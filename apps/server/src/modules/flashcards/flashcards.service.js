const prisma = require('../../lib/prisma');
const { createAppError } = require('../../utils/appError');
const {
  FLASHCARD_REVIEW_MULTIPLIER,
  FLASHCARD_REVIEW_SCORE,
} = require('./flashcards.constants');

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function roundInterval(interval) {
  return Math.max(1, Math.round(interval));
}

function getNextInterval(currentInterval, grade) {
  const multiplier = FLASHCARD_REVIEW_MULTIPLIER[grade] || 1;
  return roundInterval(currentInterval * multiplier);
}

function calculateMastery(reviewCount, reviewValueTotal) {
  if (!reviewCount) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (reviewValueTotal / (reviewCount * FLASHCARD_REVIEW_SCORE.EASY)) * 100
    )
  );
}

function serializeFlashcard(flashcard) {
  return {
    id: flashcard.id,
    frontText: flashcard.frontText,
    backText: flashcard.backText,
    reviewCount: flashcard.reviewCount,
    intervalDays: flashcard.intervalDays,
    nextReviewAt: flashcard.nextReviewAt,
    masteryScore: flashcard.masteryScore,
    topicPage: flashcard.topicPage || null,
    roadmapNode: flashcard.roadmapNode || null,
    createdAt: flashcard.createdAt,
    updatedAt: flashcard.updatedAt,
  };
}

async function assertTopicReference(topicPageId) {
  if (!topicPageId) {
    return null;
  }

  const topic = await prisma.topicPage.findUnique({
    where: { id: topicPageId },
    include: { roadmapNode: true },
  });

  if (!topic || !['APPROVED', 'PUBLISHED'].includes(topic.status)) {
    throw createAppError('Topic page not found', 404);
  }

  return {
    id: topic.id,
    title: topic.title,
    roadmapNodeId: topic.roadmapNodeId,
  };
}

async function createFlashcard(user, payload) {
  const topicReference = await assertTopicReference(payload.topicPageId);
  const frontText = payload.frontText.trim();
  const backText =
    payload.backText?.trim() ||
    (topicReference
      ? `Review ${topicReference.title}`
      : 'Review this flashcard');

  const card = await prisma.flashcard.create({
    data: {
      userId: user.id,
      topicPageId: topicReference?.id || null,
      roadmapNodeId: topicReference?.roadmapNodeId || null,
      frontText,
      backText,
      nextReviewAt: addDays(new Date(), 1),
    },
    include: {
      topicPage: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      roadmapNode: {
        select: {
          id: true,
          title: true,
          slug: true,
          roadmap: true,
        },
      },
    },
  });

  return serializeFlashcard(card);
}

async function getFlashcardsDue(user, range) {
  const flashcards = await prisma.flashcard.findMany({
    where: {
      userId: user.id,
      nextReviewAt: {
        lt: range.end,
      },
    },
    include: {
      topicPage: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      roadmapNode: {
        select: {
          id: true,
          title: true,
          slug: true,
          roadmap: true,
        },
      },
    },
    orderBy: {
      nextReviewAt: 'asc',
    },
    take: 12,
  });

  return flashcards.map(serializeFlashcard);
}

async function reviewFlashcard(user, flashcardId, payload) {
  const flashcard = await prisma.flashcard.findFirst({
    where: {
      id: flashcardId,
      userId: user.id,
    },
  });

  if (!flashcard) {
    throw createAppError('Flashcard not found', 404);
  }

  const grade = payload.grade;
  const nextInterval = getNextInterval(flashcard.intervalDays, grade);
  const nextReviewAt = addDays(new Date(), nextInterval);
  const reviewValue = FLASHCARD_REVIEW_SCORE[grade] || 0;
  const reviewCount = flashcard.reviewCount + 1;
  const reviewValueTotal = flashcard.reviewValueTotal + reviewValue;
  const masteryScore = calculateMastery(reviewCount, reviewValueTotal);

  const updatedFlashcard = await prisma.flashcard.update({
    where: { id: flashcard.id },
    data: {
      intervalDays: nextInterval,
      nextReviewAt,
      reviewCount,
      reviewValueTotal,
      masteryScore,
    },
    include: {
      topicPage: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      roadmapNode: {
        select: {
          id: true,
          title: true,
          slug: true,
          roadmap: true,
        },
      },
    },
  });

  await prisma.flashcardReview.create({
    data: {
      flashcardId: flashcard.id,
      userId: user.id,
      grade,
      intervalDays: nextInterval,
      nextReviewAt,
    },
  });

  return serializeFlashcard(updatedFlashcard);
}

module.exports = {
  createFlashcard,
  getFlashcardsDue,
  reviewFlashcard,
};
