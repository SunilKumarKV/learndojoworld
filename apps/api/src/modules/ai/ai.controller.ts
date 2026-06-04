import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { AIChatRequestDto } from "./dto/chat-request.dto";
import { AIService } from "./ai.service";

@Controller("ai")
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @UseGuards(JwtAuthGuard)
  @Post("chat")
  async chat(@CurrentUser() user: AuthenticatedUser, @Body() body: AIChatRequestDto) {
    const result = await this.aiService.chat(user.id, body);

    // result contains conversationId, message, aiUsage, provider, model, fallbackUsed
    return {
      success: true,
      message: "AI response generated",
      data: {
        conversationId: result.conversationId,
        answer: result.message?.content ?? null,
        message: result.message,
        provider: result.provider,
        model: result.model,
        fallbackUsed: result.fallbackUsed ?? false,
        aiUsage: result.aiUsage,
        usage: {
          dailyLimit: result.aiUsage.dailyLimit,
          messagesRemainingToday: Math.max(
            0,
            result.aiUsage.dailyLimit - result.aiUsage.messagesUsedToday,
          ),
          messagesUsedThisMonth: result.aiUsage.messagesUsedThisMonth,
          messagesUsedToday: result.aiUsage.messagesUsedToday,
          monthlyLimit: result.aiUsage.monthlyLimit,
          planCode: result.aiUsage.planCode,
        },
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("conversations")
  getConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.getConversations(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("conversations/:id")
  getConversation(@CurrentUser() user: AuthenticatedUser, @Param("id") conversationId: string) {
    if (!conversationId?.trim() || conversationId === "undefined") {
      throw new BadRequestException("Conversation id is required.");
    }

    return this.aiService.getConversation(user.id, conversationId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("conversations/:id")
  deleteConversation(@CurrentUser() user: AuthenticatedUser, @Param("id") conversationId: string) {
    if (!conversationId?.trim() || conversationId === "undefined") {
      throw new BadRequestException("Conversation id is required.");
    }

    return this.aiService.deleteConversation(user.id, conversationId);
  }
}
