import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../lib/prisma/prisma.service";

type LearnerDashboardResponse = {
  profile: {
    fullName: string;
    skillLevel: string;
    dailyGoalMin: number;
    goals: string[];
    topics: string[];
    learningStyle: string[];
  };
  stats: {
    enrolledCourses: number;
    completedLessons: number;
    currentStreak: number;
    xp: number;
    dailyGoalMin: number;
    todayLearningMin: number;
  };
  continueLearning: null | {
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    progressPercent: number;
  };
  roadmap: Array<{
    id: string;
    title: string;
    description: string;
    status: "planned" | "active" | "done";
    order: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    type: string;
  }>;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLearnerDashboard(userId: string): Promise<LearnerDashboardResponse> {
    const profile = await this.prisma.profile.findUnique({
      include: {
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      where: {
        userId,
      },
    });

    const goals = Array.isArray(profile?.goals) ? profile.goals : [];
    const topics = Array.isArray(profile?.topics) ? profile.topics : [];
    const learningStyle = Array.isArray(profile?.learningStyle) ? profile.learningStyle : [];
    const dailyGoalMin = Number(profile?.dailyGoalMin ?? 30);
    const skillLevel = profile?.skillLevel ?? profile?.preferredDifficulty ?? "BEGINNER";
    const fullName =
      profile?.user?.name ?? profile?.displayName ?? profile?.user?.username ?? "Learner";

    return {
      profile: {
        dailyGoalMin,
        fullName,
        goals,
        learningStyle,
        skillLevel,
        topics,
      },
      stats: {
        completedLessons: 0,
        currentStreak: 0,
        dailyGoalMin,
        enrolledCourses: 0,
        todayLearningMin: 0,
        xp: 0,
      },
      continueLearning: null,
      recommendations: this.buildRecommendations(goals, topics),
      roadmap: this.buildRoadmap(goals, topics),
    };
  }

  private buildRoadmap(
    goals: string[],
    topics: string[],
  ): Array<{
    id: string;
    title: string;
    description: string;
    status: "planned" | "active" | "done";
    order: number;
  }> {
    const baseTopics = topics.length > 0 ? topics : ["Foundations", "Practice", "Reflection"];
    const baseGoals = goals.length > 0 ? goals : ["Build momentum"];

    return baseTopics.slice(0, 4).map((topic, index) => {
      const status: "planned" | "active" | "done" = index === 0 ? "active" : "planned";

      return {
        description: `A structured path for ${topic.toLowerCase()} aligned to ${baseGoals[0]?.toLowerCase() ?? "your goals"}.`,
        id: `roadmap-${index + 1}`,
        order: index + 1,
        status,
        title: `${topic} roadmap`,
      };
    });
  }

  private buildRecommendations(goals: string[], topics: string[]) {
    const primaryGoal = goals[0] ?? "build momentum";
    const primaryTopic = topics[0] ?? "your next lesson";

    return [
      {
        description: `Start with ${primaryTopic} to support ${primaryGoal.toLowerCase()}.`,
        title: "Explore your next learning block",
        type: "focus",
      },
      {
        description: "Use the onboarding profile to keep your path aligned as you progress.",
        title: "Review your learner setup",
        type: "profile",
      },
      {
        description: "Daily progress will appear here as soon as learning activity is recorded.",
        title: "Track streak and XP",
        type: "progress",
      },
    ];
  }
}
