import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../../lib/prisma/prisma.service";
import { AIChatRequestDto, AIInstruction } from "./dto/chat-request.dto";
import { AIChatMessage } from "../../lib/ai/ai.provider";
import { AIProviderRouter, ProviderResult } from "../../lib/ai/provider-router";
import { BillingService, type AIUsageSummary } from "../billing/billing.service";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";

type AIChatServiceResult = {
  conversationId: string;
  message: {
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  };
  aiUsage: AIUsageSummary;
  provider: string;
  model: string;
  fallbackUsed: boolean;
};

@Injectable()
export class AIService {
  private providerRouter?: AIProviderRouter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly billingService: BillingService,
  ) {}

  async chat(user: AuthenticatedUser, body: AIChatRequestDto): Promise<AIChatServiceResult> {
    const userId = user.id;

    // Initialize provider router on first use (avoids throwing on bootstrap)
    if (!this.providerRouter) {
      this.providerRouter = new AIProviderRouter({
        ...process.env,
        AI_FALLBACK_PROVIDER: this.configService.get<string>("AI_FALLBACK_PROVIDER"),
        AI_PRIMARY_PROVIDER: this.configService.get<string>("AI_PRIMARY_PROVIDER"),
        AI_PROVIDER: this.configService.get<string>("AI_PROVIDER"),
        GEMINI_API_KEY: this.configService.get<string>("GEMINI_API_KEY"),
        GEMINI_MODEL: this.configService.get<string>("GEMINI_MODEL"),
        OPENAI_API_KEY: this.configService.get<string>("OPENAI_API_KEY"),
        OPENAI_MODEL: this.configService.get<string>("OPENAI_MODEL"),
      });
    }

    const conversation = await this.ensureConversation(userId, body);
    await this.billingService.assertAIUsageAvailable(userId);

    const contextMessages = await this.buildContextMessages(
      user,
      body.courseId,
      body.lessonId,
      conversation,
    );
    const userMessage = this.buildUserMessage(body.instruction, body.message);
    const apiMessages: AIChatMessage[] = [
      ...contextMessages,
      { role: "user", content: userMessage },
    ];

    try {
      const pr: ProviderResult = await this.providerRouter.chat(apiMessages);
      const response = pr;
      const assistantMessage = response.content;

      await this.prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          userId,
          role: "USER",
          content: userMessage,
          tokenCount: response.usage.promptTokens,
          cost: new Prisma.Decimal(0),
          courseId: body.courseId ?? conversation.courseId,
          lessonId: body.lessonId ?? conversation.lessonId,
        },
      });

      const assistantRecord = await this.prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          userId,
          role: "ASSISTANT",
          content: assistantMessage,
          tokenCount: response.usage.completionTokens,
          cost: new Prisma.Decimal(response.cost),
          courseId: body.courseId ?? conversation.courseId,
          lessonId: body.lessonId ?? conversation.lessonId,
        },
      });

      await this.prisma.aIConversation.update({
        where: { id: conversation.id },
        data: {
          totalTokens: { increment: response.usage.totalTokens },
          totalCost: {
            increment: new Prisma.Decimal(response.cost),
          },
          updatedAt: new Date(),
        },
      });

      const usageStats = await this.billingService.consumeAIUsage({
        model: response.model,
        provider: response.provider,
        tokensUsed: response.usage.totalTokens,
        userId,
      });

      return {
        conversationId: conversation.id,
        message: {
          id: assistantRecord.id,
          role: assistantRecord.role,
          content: assistantRecord.content,
          createdAt: assistantRecord.createdAt,
        },
        aiUsage: usageStats,
        provider: response.provider,
        model: response.model,
        fallbackUsed: response.fallbackUsed ?? false,
      };
    } catch (err: unknown) {
      // Development-only logging (do not log secrets)
      const isDev = this.configService.get<string>("NODE_ENV") === "development";
      if (isDev) {
        console.error("AIService.chat error:", (err as Error)?.message ?? err);
      }
      // Provide a safe error to the client
      if (
        err instanceof ServiceUnavailableException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }

      throw new InternalServerErrorException("Failed to generate AI response.");
    }
  }

  async getConversations(user: AuthenticatedUser) {
    const conversations = await this.prisma.aIConversation.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { content: true, role: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const accessibleConversations = [];
    for (const conversation of conversations) {
      if (await this.canAccessConversationContext(user, conversation)) {
        accessibleConversations.push(conversation);
      }
    }

    return accessibleConversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title ?? conversation.id,
      courseId: conversation.courseId,
      lessonId: conversation.lessonId,
      totalTokens: conversation.totalTokens,
      totalCost: conversation.totalCost,
      updatedAt: conversation.updatedAt,
      lastMessage: conversation.messages[0]?.content ?? "",
      lastMessageRole: conversation.messages[0]?.role ?? "USER",
      lastMessageAt: conversation.messages[0]?.createdAt,
    }));
  }

  async getConversation(user: AuthenticatedUser, conversationId: string) {
    const conversation = await this.prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation || conversation.userId !== user.id) {
      throw new NotFoundException("Conversation not found.");
    }

    await this.assertConversationContextAccess(user, conversation);

    return {
      id: conversation.id,
      title: conversation.title,
      courseId: conversation.courseId,
      lessonId: conversation.lessonId,
      totalTokens: conversation.totalTokens,
      totalCost: conversation.totalCost,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
    };
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.aIConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException("Conversation not found.");
    }

    await this.prisma.aIConversation.delete({ where: { id: conversationId } });

    return { success: true };
  }

  private async ensureConversation(userId: string, body: AIChatRequestDto) {
    if (!body.conversationId) {
      const title = body.instruction ? body.instruction : body.message.slice(0, 120);
      return this.prisma.aIConversation.create({
        data: {
          userId,
          title,
          courseId: body.courseId ?? null,
          lessonId: body.lessonId ?? null,
        },
      });
    }

    const conversation = await this.prisma.aIConversation.findUnique({
      where: { id: body.conversationId },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException("Conversation not found.");
    }

    return this.prisma.aIConversation.update({
      where: { id: conversation.id },
      data: {
        courseId: body.courseId ?? conversation.courseId,
        lessonId: body.lessonId ?? conversation.lessonId,
        title: conversation.title ?? body.message.slice(0, 120),
      },
    });
  }

  private async buildContextMessages(
    user: AuthenticatedUser,
    courseId?: string,
    lessonId?: string,
    conversation?: { courseId?: string | null; lessonId?: string | null },
  ) {
    const profilePromise = this.prisma.profile.findUnique({
      where: { userId: user.id },
    });
    const contextPromise = this.loadAuthorizedContext(user, courseId, lessonId, conversation);
    const [profile, context] = await Promise.all([profilePromise, contextPromise]);
    const { course, lesson } = context;

    const contextMessages: AIChatMessage[] = [
      {
        role: "system",
        content:
          "You are LearnDojoWorld Tutor. Use the learner's profile, course and lesson context to answer helpfully, simply, and in a positive study coach tone. Avoid unrelated content.",
      },
    ];

    if (profile) {
      const goals = profile.goals.join(", ") || "no goals provided";
      const topics = profile.topics.join(", ") || "no topics provided";
      const skillLevel = profile.skillLevel ?? profile.preferredDifficulty ?? "BEGINNER";

      contextMessages.push({
        role: "system",
        content: `Learner profile: goals=${goals}; level=${skillLevel}; onboarding topics=${topics}.`,
      });
    }

    if (course) {
      contextMessages.push({
        role: "system",
        content: `Course context: title=${course.title}; description=${course.description}.`,
      });
    }

    if (lesson) {
      contextMessages.push({
        role: "system",
        content: `Lesson context: title=${lesson.title}; content=${lesson.content}.`,
      });
    }

    return contextMessages;
  }

  private buildUserMessage(instruction: AIInstruction | undefined, message: string) {
    const trimmed = message.trim();

    if (!instruction) {
      return trimmed;
    }

    switch (instruction) {
      case AIInstruction.EXPLAIN_SIMPLE:
        return trimmed
          ? `Explain this lesson simply as if the learner is a beginner. ${trimmed}`
          : "Explain this lesson simply as if the learner is a beginner.";
      case AIInstruction.REAL_EXAMPLE:
        return trimmed
          ? `Give a real-world example that illustrates the lesson concept. ${trimmed}`
          : "Give a real-world example that illustrates the lesson concept.";
      case AIInstruction.QUIZ_ME:
        return trimmed
          ? `Create a short quiz based on the lesson content. ${trimmed}`
          : "Create a short quiz based on the lesson content.";
      case AIInstruction.SUMMARIZE:
        return trimmed
          ? `Summarize the lesson clearly. ${trimmed}`
          : "Summarize the lesson clearly.";
      case AIInstruction.CREATE_FLASHCARDS:
        return trimmed
          ? `Create 3 helpful flashcards for this lesson. ${trimmed}`
          : "Create 3 helpful flashcards for this lesson.";
      default:
        return trimmed;
    }
  }

  private async canAccessConversationContext(
    user: AuthenticatedUser,
    conversation: { courseId?: string | null; lessonId?: string | null },
  ) {
    try {
      await this.assertConversationContextAccess(user, conversation);
      return true;
    } catch (err: unknown) {
      if (
        err instanceof BadRequestException ||
        err instanceof ForbiddenException ||
        err instanceof NotFoundException
      ) {
        return false;
      }

      throw err;
    }
  }

  private async assertConversationContextAccess(
    user: AuthenticatedUser,
    conversation: { courseId?: string | null; lessonId?: string | null },
  ) {
    await this.loadAuthorizedContext(
      user,
      conversation.courseId ?? undefined,
      conversation.lessonId ?? undefined,
    );
  }

  private async loadAuthorizedContext(
    user: AuthenticatedUser,
    courseId?: string,
    lessonId?: string,
    conversation?: { courseId?: string | null; lessonId?: string | null },
  ) {
    const effectiveCourseId = courseId ?? conversation?.courseId ?? undefined;
    const effectiveLessonId = lessonId ?? conversation?.lessonId ?? undefined;

    if (!effectiveCourseId && !effectiveLessonId) {
      return { course: null, lesson: null };
    }

    let lesson: {
      id: string;
      title: string;
      content: string;
      module: {
        courseId: string;
        course: {
          id: string;
          title: string;
          description: string;
          creatorId: string | null;
        };
      };
    } | null = null;
    let course: {
      id: string;
      title: string;
      description: string;
      creatorId: string | null;
    } | null = null;

    if (effectiveLessonId) {
      lesson = await this.prisma.lesson.findUnique({
        select: {
          content: true,
          id: true,
          module: {
            select: {
              course: {
                select: {
                  creatorId: true,
                  description: true,
                  id: true,
                  title: true,
                },
              },
              courseId: true,
            },
          },
          title: true,
        },
        where: { id: effectiveLessonId },
      });

      if (!lesson) {
        throw new NotFoundException("Lesson not found.");
      }

      course = lesson.module.course;

      if (effectiveCourseId && effectiveCourseId !== lesson.module.courseId) {
        throw new BadRequestException("Lesson does not belong to the requested course.");
      }
    } else if (effectiveCourseId) {
      course = await this.prisma.course.findUnique({
        select: {
          creatorId: true,
          description: true,
          id: true,
          title: true,
        },
        where: { id: effectiveCourseId },
      });

      if (!course) {
        throw new NotFoundException("Course not found.");
      }
    }

    if (course && !(await this.canAccessCourseContent(user, course.id, course.creatorId))) {
      throw new ForbiddenException("You must enroll in this course before using its AI context.");
    }

    return { course, lesson };
  }

  private async canAccessCourseContent(
    user: AuthenticatedUser,
    courseId: string,
    creatorId: string | null,
  ) {
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (user.role === UserRole.CREATOR && creatorId === user.id) {
      return true;
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      select: { id: true },
      where: { userId_courseId: { courseId, userId: user.id } },
    });

    return Boolean(enrollment);
  }
}
