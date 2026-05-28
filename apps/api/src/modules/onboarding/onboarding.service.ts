import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../lib/prisma/prisma.service";
import type { LearnerOnboardingDto } from "./dto/learner-onboarding.dto";

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async saveLearnerOnboarding(userId: string, dto: LearnerOnboardingDto) {
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
      completed: profile.onboardingCompleted,
      dailyGoalMin: profile.dailyGoalMin,
      goals: profile.goals,
      learningStyle: profile.learningStyle,
      level: profile.skillLevel ?? profile.preferredDifficulty ?? null,
      topics: profile.topics,
    };
  }

  async getLearnerOnboarding(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId,
      },
    });

    return {
      completed: profile?.onboardingCompleted ?? false,
      dailyGoalMin: profile?.dailyGoalMin ?? 30,
      goals: profile?.goals ?? [],
      learningStyle: profile?.learningStyle ?? [],
      level: profile?.skillLevel ?? profile?.preferredDifficulty ?? null,
      topics: profile?.topics ?? [],
    };
  }
}
