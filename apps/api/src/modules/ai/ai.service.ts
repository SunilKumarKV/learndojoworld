import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../lib/prisma/prisma.service";
import { AIChatRequestDto, AIInstruction } from "./dto/chat-request.dto";
import { AIChatMessage } from "../../lib/ai/ai.provider";
import { AIProviderRouter, ProviderResult } from "../../lib/ai/provider-router";

type AIChatServiceResult = {
  conversationId: string;
  message: {
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  };
  aiUsage: {
    messagesToday: number;
    remainingToday: number;
    dailyLimit: number;
    costToday: number;
  };
  provider: string;
  model: string;
  fallbackUsed: boolean;
};

@Injectable()
export class AIService {
  private providerRouter?: AIProviderRouter;
  private readonly dailyMessageLimit = 20;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async chat(userId: string, body: AIChatRequestDto): Promise<AIChatServiceResult> {
    // Initialize provider router on first use (avoids throwing on bootstrap)
    if (!this.providerRouter) {
      this.providerRouter = new AIProviderRouter(process.env);
    }

    const conversation = await this.ensureConversation(userId, body);
    const usageStats = await this.getDailyUsage(userId);

    if (usageStats.messagesToday >= this.dailyMessageLimit) {
      throw new BadRequestException(
        "You have reached your free AI usage limit for today. Upgrade for more tutor messages.",
      );
    }

    const contextMessages = await this.buildContextMessages(
      userId,
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

  async getConversations(userId: string) {
    const conversations = await this.prisma.aIConversation.findMany({
      where: { userId },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { content: true, role: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return conversations.map((conversation) => ({
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

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException("Conversation not found.");
    }

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

  private async getDailyUsage(userId: string) {
    const now = new Date();
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const messagesToday = await this.prisma.aIMessage.count({
      where: { userId, createdAt: { gte: startOfDay } },
    });

    const costSum = await this.prisma.aIMessage.aggregate({
      _sum: { cost: true },
      where: { userId, createdAt: { gte: startOfDay } },
    });

    return {
      messagesToday,
      costToday: Number(costSum._sum.cost ?? 0),
      dailyLimit: this.dailyMessageLimit,
      remainingToday: Math.max(0, this.dailyMessageLimit - messagesToday),
    };
  }

  private async buildContextMessages(
    userId: string,
    courseId?: string,
    lessonId?: string,
    conversation?: { courseId?: string | null; lessonId?: string | null },
  ) {
    const effectiveCourseId = courseId ?? conversation?.courseId;
    const effectiveLessonId = lessonId ?? conversation?.lessonId;

    const profilePromise = this.prisma.profile.findUnique({
      where: { userId },
    });

    const lessonPromise = effectiveLessonId
      ? this.prisma.lesson.findUnique({
          where: { id: effectiveLessonId },
          include: {
            module: { include: { course: true } },
          },
        })
      : Promise.resolve(null);

    const coursePromise = effectiveCourseId
      ? this.prisma.course.findUnique({ where: { id: effectiveCourseId } })
      : Promise.resolve(null);

    const [profile, lesson, course] = await Promise.all([
      profilePromise,
      lessonPromise,
      coursePromise,
    ]);

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
}
