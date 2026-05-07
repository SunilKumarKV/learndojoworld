const prisma = require('../../lib/prisma');
const { ROLES } = require('../auth/auth.constants');
const { createAppError } = require('../../utils/appError');
const {
  REVIEWABLE_CONTENT_TYPE,
} = require('../adminReview/adminReview.constants');
const { recordReviewEvent } = require('../adminReview/reviewEvent.service');
const { TOPIC_STATUS } = require('./topic.constants');

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
};

const roadmapNodeSummarySelect = {
  id: true,
  title: true,
  slug: true,
  roadmapId: true,
};

const blockOrderBy = [{ order: 'asc' }, { createdAt: 'asc' }];

const topicInclude = {
  createdBy: { select: userSummarySelect },
  approvedBy: { select: userSummarySelect },
  roadmapNode: { select: roadmapNodeSummarySelect },
  blocks: {
    orderBy: blockOrderBy,
  },
};

function slugify(value) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'topic';
}

async function createUniqueTopicSlug(title, requestedSlug) {
  const baseSlug = slugify(requestedSlug || title);
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await prisma.topicPage.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function isApprovedPublished(topic) {
  return (
    topic.status === TOPIC_STATUS.PUBLISHED &&
    Boolean(topic.approvedAt) &&
    Boolean(topic.approvedById)
  );
}

function canReadTopic(user, topic) {
  if (user.role === ROLES.LEARNER) {
    return isApprovedPublished(topic);
  }

  if (user.role === ROLES.ADMIN) {
    return topic.status !== TOPIC_STATUS.FLAGGED;
  }

  return topic.createdById === user.id || isApprovedPublished(topic);
}

function canManageTopic(user, topic) {
  return user.role === ROLES.ADMIN || topic.createdById === user.id;
}

function serializeBlock(block) {
  return {
    id: block.id,
    topicPageId: block.topicPageId,
    type: block.type,
    title: block.title,
    content: block.content,
    language: block.language,
    referenceId: block.referenceId,
    order: block.order,
    metadata: block.metadata,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt,
  };
}

function serializeTopic(topic, includeBlocks = true) {
  return {
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    summary: topic.summary,
    status: topic.status,
    roadmapNode: topic.roadmapNode,
    createdBy: topic.createdBy,
    approvedBy: topic.approvedBy,
    reviewNotes: topic.reviewNotes,
    submittedAt: topic.submittedAt,
    approvedAt: topic.approvedAt,
    publishedAt: topic.publishedAt,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
    blocks: includeBlocks
      ? (topic.blocks || []).map(serializeBlock)
      : undefined,
  };
}

function getTopicListWhere(user, filters = {}) {
  const linkedNodeFilter = filters.roadmapNodeId
    ? { roadmapNodeId: filters.roadmapNodeId }
    : {};

  if (user.role === ROLES.LEARNER) {
    return {
      status: TOPIC_STATUS.PUBLISHED,
      approvedAt: { not: null },
      approvedById: { not: null },
      ...linkedNodeFilter,
    };
  }

  if (user.role === ROLES.ADMIN) {
    return {
      status: { not: TOPIC_STATUS.FLAGGED },
      ...linkedNodeFilter,
    };
  }

  return {
    AND: [
      linkedNodeFilter,
      {
        OR: [
          { createdById: user.id },
          {
            status: TOPIC_STATUS.PUBLISHED,
            approvedAt: { not: null },
            approvedById: { not: null },
          },
        ],
      },
    ],
  };
}

async function listTopics(user, filters = {}) {
  const topics = await prisma.topicPage.findMany({
    where: getTopicListWhere(user, filters),
    include: {
      createdBy: { select: userSummarySelect },
      approvedBy: { select: userSummarySelect },
      roadmapNode: { select: roadmapNodeSummarySelect },
      blocks: {
        select: { id: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return topics.map((topic) => ({
    ...serializeTopic(topic, false),
    blockCount: topic.blocks.length,
  }));
}

async function getTopic(user, topicId) {
  const topic = await prisma.topicPage.findUnique({
    where: { id: topicId },
    include: topicInclude,
  });

  if (!topic || !canReadTopic(user, topic)) {
    throw createAppError('Topic not found', 404);
  }

  return serializeTopic(topic);
}

async function assertRoadmapNodeExists(roadmapNodeId) {
  if (!roadmapNodeId) {
    return;
  }

  const node = await prisma.roadmapNode.findUnique({
    where: { id: roadmapNodeId },
    select: { id: true },
  });

  if (!node) {
    throw createAppError('Roadmap node not found', 404);
  }
}

async function createTopic(user, payload) {
  await assertRoadmapNodeExists(payload.roadmapNodeId);

  const slug = await createUniqueTopicSlug(payload.title, payload.slug);
  const submittedAt =
    payload.status === TOPIC_STATUS.SUBMITTED ? new Date() : undefined;
  const topic = await prisma.topicPage.create({
    data: {
      title: payload.title,
      slug,
      summary: payload.summary,
      roadmapNodeId: payload.roadmapNodeId,
      status: payload.status,
      submittedAt,
      createdById: user.id,
    },
    include: topicInclude,
  });

  if (payload.status === TOPIC_STATUS.SUBMITTED) {
    await recordReviewEvent({
      actorId: user.id,
      contentType: REVIEWABLE_CONTENT_TYPE.TOPIC_PAGE,
      topicPageId: topic.id,
      fromStatus: null,
      toStatus: TOPIC_STATUS.SUBMITTED,
    });
  }

  return serializeTopic(topic);
}

async function getManageableTopic(user, topicId) {
  const topic = await prisma.topicPage.findUnique({
    where: { id: topicId },
    include: topicInclude,
  });

  if (!topic || !canManageTopic(user, topic)) {
    throw createAppError('Topic not found', 404);
  }

  if (topic.status === TOPIC_STATUS.FLAGGED) {
    throw createAppError('Flagged topics cannot be changed', 400);
  }

  return topic;
}

async function addContentBlocks(user, topicId, blocks) {
  const topic = await getManageableTopic(user, topicId);
  const latestBlock = await prisma.contentBlock.findFirst({
    where: { topicPageId: topicId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  let nextOrder = (latestBlock?.order ?? -1) + 1;

  const createdBlocks = await prisma.$transaction(
    blocks.map((block) => {
      const order = block.order ?? nextOrder;
      nextOrder += 1;

      return prisma.contentBlock.create({
        data: {
          topicPageId: topicId,
          type: block.type,
          title: block.title,
          content: block.content,
          language: block.language,
          referenceId: block.referenceId,
          order,
          metadata: block.metadata,
        },
      });
    })
  );

  return {
    topic: serializeTopic(topic),
    blocks: createdBlocks.map(serializeBlock),
  };
}

async function submitTopicForReview(user, topicId) {
  const topic = await getManageableTopic(user, topicId);

  if (!topic.blocks.length) {
    throw createAppError(
      'Add content blocks before submitting for review',
      400
    );
  }

  const updatedTopic = await prisma.topicPage.update({
    where: { id: topicId },
    data: {
      status: TOPIC_STATUS.SUBMITTED,
      submittedAt: new Date(),
      approvedAt: null,
      approvedById: null,
      publishedAt: null,
      reviewNotes: null,
    },
    include: topicInclude,
  });

  await recordReviewEvent({
    actorId: user.id,
    contentType: REVIEWABLE_CONTENT_TYPE.TOPIC_PAGE,
    topicPageId: topicId,
    fromStatus: topic.status,
    toStatus: TOPIC_STATUS.SUBMITTED,
  });

  return serializeTopic(updatedTopic);
}

async function approveTopic(user, topicId) {
  const topic = await prisma.topicPage.findUnique({
    where: { id: topicId },
    include: topicInclude,
  });

  if (!topic) {
    throw createAppError('Topic not found', 404);
  }

  if (!topic.blocks.length) {
    throw createAppError('Topics need content blocks before approval', 400);
  }

  const now = new Date();
  const updatedTopic = await prisma.topicPage.update({
    where: { id: topicId },
    data: {
      status: TOPIC_STATUS.APPROVED,
      approvedById: user.id,
      approvedAt: now,
      publishedAt: null,
      reviewNotes: null,
    },
    include: topicInclude,
  });

  await recordReviewEvent({
    actorId: user.id,
    contentType: REVIEWABLE_CONTENT_TYPE.TOPIC_PAGE,
    topicPageId: topicId,
    fromStatus: topic.status,
    toStatus: TOPIC_STATUS.APPROVED,
  });

  return serializeTopic(updatedTopic);
}

module.exports = {
  listTopics,
  getTopic,
  createTopic,
  addContentBlocks,
  submitTopicForReview,
  approveTopic,
  isApprovedPublished,
};
