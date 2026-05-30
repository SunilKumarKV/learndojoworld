import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../lib/prisma/prisma.service";

const XP_LEVEL_BASE = 100;

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const [xpTotal, achievements, streak, userAchievements] = await Promise.all([
      this.prisma.learningActivity.aggregate({
        _sum: { xpEarned: true },
        where: { userId },
      }),
      this.prisma.achievement.findMany({ orderBy: { createdAt: "asc" }, take: 6 }),
      this.calculateStreak(userId),
      this.prisma.userAchievement.findMany({
        include: { achievement: true },
        where: { userId },
      }),
    ]);

    const totalXp = Number(xpTotal._sum.xpEarned ?? 0);
    const level = Math.floor(totalXp / XP_LEVEL_BASE) + 1;
    const nextLevelXp = level * XP_LEVEL_BASE;
    const nextLevelProgress = Math.min(
      100,
      Math.round(((totalXp % XP_LEVEL_BASE) / XP_LEVEL_BASE) * 100),
    );

    return {
      achievements: achievements.map((achievement) => ({
        ...achievement,
        unlocked: userAchievements.some((item) => item.achievementId === achievement.id),
      })),
      currentLevel: level,
      currentStreak: streak.currentStreak,
      lastActiveDate: streak.lastActiveDate,
      longestStreak: streak.longestStreak,
      nextLevelProgress,
      nextLevelXp,
      xp: totalXp,
    };
  }

  private async calculateStreak(userId: string) {
    const activities = await this.prisma.learningActivity.findMany({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
      where: { userId },
    });

    const dates = Array.from(
      new Set(activities.map((item) => this.toDayKey(item.createdAt))),
    ).sort();
    if (dates.length === 0) {
      return { currentStreak: 0, lastActiveDate: null, longestStreak: 0 };
    }

    const latest = dates[dates.length - 1] ?? this.toDayKey(new Date());
    const today = this.toDayKey(new Date());
    const yesterday = this.toDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const isActiveToday = dates.includes(today);
    const isActiveYesterday = dates.includes(yesterday);

    let currentStreak = 1;
    let cursor = new Date(latest);
    while (true) {
      const previous = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
      const previousKey = this.toDayKey(previous);
      if (!dates.includes(previousKey)) {
        break;
      }
      currentStreak += 1;
      cursor = previous;
    }

    if (!isActiveToday && !isActiveYesterday) {
      currentStreak = 0;
    }

    if (!isActiveToday && isActiveYesterday) {
      currentStreak = 1;
    }

    let longestStreak = 1;
    let run = 1;
    for (let index = 1; index < dates.length; index += 1) {
      const current = new Date(dates[index] ?? this.toDayKey(new Date()));
      const previous = new Date(dates[index - 1] ?? this.toDayKey(new Date()));
      const diff = (current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000);
      if (diff === 1) {
        run += 1;
        longestStreak = Math.max(longestStreak, run);
      } else {
        run = 1;
      }
    }

    return {
      currentStreak,
      lastActiveDate: latest,
      longestStreak,
    };
  }

  private toDayKey(value: Date) {
    return value.toISOString().slice(0, 10);
  }
}
