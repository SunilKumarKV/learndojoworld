import { Injectable, NotFoundException } from "@nestjs/common";
import { FlashcardDifficulty, Prisma } from "@prisma/client";

import { PrismaService } from "../../lib/prisma/prisma.service";
import { AnalyticsService } from "../analytics/analytics.service";

const SPACED_REPETITION_DAYS: Record<FlashcardDifficulty, number> = {
  FORGOT: 1,
  HARD: 3,
  GOOD: 7,
  EASY: 14,
};

@Injectable()
export class MemoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getQuizzes() {
    return this.prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }

  async getQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      include: { questions: true },
      where: { id },
    });

    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    return quiz;
  }

  async submitAttempt(userId: string, quizId: string, answers: Record<string, unknown>) {
    const quiz = await this.prisma.quiz.findUnique({
      include: { questions: true },
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    let score = 0;
    const explanations: string[] = [];
    const weakTopics = new Set<string>();

    for (const question of quiz.questions) {
      const userAnswer = this.normalizeAnswer(question.id, answers);
      const expected = this.normalizeAnswer(question.id, question.answer);
      const isCorrect = this.isAnswerCorrect(userAnswer, expected);

      if (isCorrect) {
        score += question.points;
      } else {
        explanations.push(question.explanation ?? "Review this concept and try again.");
        weakTopics.add(question.question.slice(0, 40));
      }
    }

    const totalPoints = quiz.questions.reduce((sum, item) => sum + item.points, 0) || 1;
    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= quiz.passScore;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        answers: answers as Prisma.InputJsonValue,
        passed,
        quizId,
        score: percentage,
        userId,
      },
    });

    await this.analyticsService.trackEvent(userId, "quiz_completed", {
      quizId,
      passed,
      score: percentage,
    });
    await this.prisma.learningActivity.create({
      data: {
        activityType: "QUIZ_COMPLETED",
        courseId: quiz.courseId ?? null,
        durationMinutes: 1,
        lessonId: quiz.lessonId ?? null,
        metadata: { passed, score: percentage },
        type: "QUIZ_COMPLETED",
        userId,
        xpEarned: passed ? 25 : 0,
      },
    });

    return {
      attempt,
      explanations,
      passed,
      score: percentage,
      weakTopics: Array.from(weakTopics).slice(0, 4),
    };
  }

  async getResults(userId: string, quizId: string) {
    const attempt = await this.prisma.quizAttempt.findFirst({
      orderBy: { createdAt: "desc" },
      where: { quizId, userId },
    });

    if (!attempt) {
      throw new NotFoundException("No quiz attempt found");
    }

    const quiz = await this.prisma.quiz.findUnique({
      include: { questions: true },
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    return {
      attempt,
      explanations: quiz.questions.map((question) => ({
        explanation: question.explanation ?? "Review this concept and try again.",
        question: question.question,
      })),
      passed: attempt.passed,
      score: attempt.score,
      weakTopics: quiz.questions
        .filter(
          (question) =>
            !this.isAnswerCorrect(
              this.normalizeAnswer(question.id, attempt.answers),
              this.normalizeAnswer(question.id, question.answer),
            ),
        )
        .map((question) => question.question.slice(0, 40))
        .slice(0, 4),
    };
  }

  async getMyFlashcards(userId: string) {
    return this.prisma.flashcard.findMany({
      orderBy: { createdAt: "desc" },
      where: { userId },
    });
  }

  async createFlashcard(
    userId: string,
    payload: { front: string; back: string; tags?: string[]; lessonId?: string; courseId?: string },
  ) {
    return this.prisma.flashcard.create({
      data: {
        back: payload.back,
        courseId: payload.courseId ?? null,
        front: payload.front,
        lessonId: payload.lessonId ?? null,
        tags: payload.tags ?? [],
        userId,
      },
    });
  }

  async reviewFlashcard(
    userId: string,
    flashcardId: string,
    difficulty: keyof typeof SPACED_REPETITION_DAYS,
  ) {
    const flashcard = await this.prisma.flashcard.findUnique({ where: { id: flashcardId } });

    if (!flashcard) {
      throw new NotFoundException("Flashcard not found");
    }

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + SPACED_REPETITION_DAYS[difficulty]);

    await this.prisma.flashcardReview.create({
      data: {
        difficulty,
        flashcardId,
        nextReviewAt,
        reviewedAt: new Date(),
        userId,
      },
    });

    await this.prisma.flashcard.update({
      data: { updatedAt: new Date() },
      where: { id: flashcardId },
    });

    await this.analyticsService.trackEvent(userId, "flashcard_reviewed", {
      flashcardId,
      difficulty,
    });
    await this.prisma.learningActivity.create({
      data: {
        activityType: "FLASHCARD_REVIEWED",
        courseId: flashcard.courseId ?? null,
        durationMinutes: 1,
        lessonId: flashcard.lessonId ?? null,
        metadata: { difficulty },
        type: "FLASHCARD_REVIEWED",
        userId,
        xpEarned: 2,
      },
    });

    return { difficulty, flashcardId, nextReviewAt };
  }

  async getReviewDue(userId: string, limit: number) {
    const now = new Date();

    return this.prisma.flashcard.findMany({
      include: { reviews: { orderBy: { reviewedAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: Math.max(1, limit),
      where: {
        userId,
        OR: [
          { reviews: { some: { userId, nextReviewAt: { lte: now } } } },
          { reviews: { none: {} } },
        ],
      },
    });
  }

  async getRevisionDashboard(userId: string) {
    const dueCards = await this.prisma.flashcard.findMany({
      include: { reviews: { orderBy: { reviewedAt: "desc" }, take: 1 } },
      where: { userId },
    });

    const dueToday = dueCards.filter(
      (item) => (item.reviews[0]?.nextReviewAt ?? new Date(0)) <= new Date(),
    ).length;
    const quizAttempts = await this.prisma.quizAttempt.findMany({
      orderBy: { createdAt: "desc" },
      where: { userId },
    });

    const averageScore =
      quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, item) => sum + item.score, 0) / quizAttempts.length)
        : 0;

    await this.analyticsService.trackEvent(userId, "revision_completed", {
      dueToday,
      totalFlashcards: dueCards.length,
    });
    await this.prisma.learningActivity.create({
      data: {
        activityType: "REVISION_COMPLETED",
        durationMinutes: 1,
        metadata: { averageScore, dueToday },
        type: "REVISION_COMPLETED",
        userId,
        xpEarned: 15,
      },
    });

    return {
      averageScore,
      dueToday,
      quizAttempts: quizAttempts.slice(0, 5),
      totalFlashcards: dueCards.length,
      upcomingReviews: dueCards.filter(
        (item) => (item.reviews[0]?.nextReviewAt ?? new Date(0)) > new Date(),
      ).length,
      weakTopics: quizAttempts
        .slice(0, 3)
        .map((attempt) => `Quiz attempt ${attempt.id.slice(0, 6)} (${attempt.score}%)`),
    };
  }

  private normalizeAnswer(questionId: string, value: unknown): string[] {
    if (value === null || value === undefined) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      if ("selected" in record) {
        return this.normalizeAnswer(questionId, record.selected);
      }
      if ("answer" in record) {
        return this.normalizeAnswer(questionId, record.answer);
      }
      if ("correctIndex" in record) {
        return [String(record.correctIndex)];
      }
      if ("correctIndices" in record) {
        return this.normalizeAnswer(questionId, record.correctIndices);
      }
      if (questionId in record) {
        return this.normalizeAnswer(questionId, record[questionId]);
      }

      return [];
    }

    const primitiveValue = value as string | number | boolean;
    return [String(primitiveValue)];
  }

  private isAnswerCorrect(userAnswer: string[], expected: string[]) {
    const normalizedUser = userAnswer.map((item) => item.trim().toLowerCase());
    const normalizedExpected = expected.map((item) => item.trim().toLowerCase());

    return (
      normalizedUser.length > 0 && normalizedUser.every((item) => normalizedExpected.includes(item))
    );
  }
}
