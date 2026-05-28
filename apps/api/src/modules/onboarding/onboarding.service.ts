import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../lib/prisma/prisma.service";
import type { LearnerOnboardingDto } from "./dto/learner-onboarding.dto";

type LearnerOnboardingResponse = {
  completed: boolean;
  dailyGoalMin: number;
  goals: string[];
  learningStyle: string[];
  level: LearnerOnboardingDto["level"] | null;
  topics: string[];
};

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async saveLearnerOnboarding(
    userId: string,
    dto: LearnerOnboardingDto,
  ): Promise<LearnerOnboardingResponse> {
    const now = new Date();

    const profile = await this.prisma.profile.upsert({
      create: {
        dailyGoalMin: dto.dailyGoalMin,
        displayName: null,
        goals: dto.goals,
        learningStyle: dto.learningStyle,
        onboardingCompleted: true,
        onboardingCompletedAt: now,
        preferredDifficulty: dto.level,
        skillLevel: dto.level,
        topics: dto.topics,
        userId,
      },
      update: {
        dailyGoalMin: dto.dailyGoalMin,
        goals: dto.goals,
        learningStyle: dto.learningStyle,
        onboardingCompleted: true,
        onboardingCompletedAt: now,
        preferredDifficulty: dto.level,
        skillLevel: dto.level,
        topics: dto.topics,
      },
      where: {
        userId,
      },
    });

    return {
      completed: Boolean(profile.onboardingCompleted),
      dailyGoalMin: Number(profile.dailyGoalMin ?? 30),
      goals: Array.isArray(profile.goals) ? profile.goals : [],
      learningStyle: Array.isArray(profile.learningStyle) ? profile.learningStyle : [],
      level: profile.skillLevel ?? profile.preferredDifficulty ?? null,
      topics: Array.isArray(profile.topics) ? profile.topics : [],
    };
  }

  async getLearnerOnboarding(userId: string): Promise<LearnerOnboardingResponse> {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId,
      },
    });

    return {
      completed: Boolean(profile?.onboardingCompleted ?? false),
      dailyGoalMin: Number(profile?.dailyGoalMin ?? 30),
      goals: Array.isArray(profile?.goals) ? profile.goals : [],
      learningStyle: Array.isArray(profile?.learningStyle) ? profile.learningStyle : [],
      level: profile?.skillLevel ?? profile?.preferredDifficulty ?? null,
      topics: Array.isArray(profile?.topics) ? profile.topics : [],
    };
  }
}
