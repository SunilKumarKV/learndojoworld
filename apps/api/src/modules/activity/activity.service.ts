import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../lib/prisma/prisma.service";

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async getTimeline(userId: string, limit = 10) {
    const [learningActivities, userEvents] = await Promise.all([
      this.prisma.learningActivity.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        where: { userId },
      }),
      this.prisma.userEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        where: { userId },
      }),
    ]);

    return [...learningActivities, ...userEvents]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit)
      .map((item) => ({
        createdAt: item.createdAt,
        event:
          "type" in item ? (item.type ?? item.activityType ?? "learning_activity") : item.event,
        id: item.id,
        metadata: item.metadata ?? null,
        xpEarned: "xpEarned" in item ? item.xpEarned : 0,
      }));
  }
}
