import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { PrismaService } from "../../lib/prisma/prisma.service";
import type { UpsertCreatorProfileDto } from "./dto/upsert-creator-profile.dto";

@Injectable()
export class CreatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(userId: string, dto: UpsertCreatorProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        select: {
          email: true,
          id: true,
          isActive: true,
          isSuspended: true,
          name: true,
          role: true,
          username: true,
        },
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException("User not found.");
      }

      const creatorProfile = await tx.creatorProfile.upsert({
        create: {
          ...this.normalizeProfileDto(dto),
          userId,
        },
        update: this.normalizeProfileDto(dto),
        where: { userId },
      });

      const updatedUser =
        user.role === UserRole.LEARNER
          ? await tx.user.update({
              data: { role: UserRole.CREATOR },
              select: {
                email: true,
                id: true,
                isActive: true,
                isSuspended: true,
                name: true,
                role: true,
                username: true,
              },
              where: { id: userId },
            })
          : user;

      return {
        profile: creatorProfile,
        user: updatedUser,
      };
    });
  }

  async getMe(userId: string) {
    return this.ensureCreatorProfile(userId);
  }

  async updateMe(userId: string, dto: UpsertCreatorProfileDto) {
    await this.ensureCreatorProfile(userId);

    return this.prisma.creatorProfile.update({
      data: this.normalizeProfileDto(dto),
      where: { userId },
    });
  }

  async getDashboard(userId: string) {
    await this.ensureCreatorProfile(userId);

    const [coursesCount, learnersCount] = await Promise.all([
      this.prisma.course.count({ where: { creatorId: userId } }),
      this.prisma.enrollment.count({ where: { course: { creatorId: userId } } }),
    ]);

    return {
      metrics: {
        coursesCount,
        learnersCount,
        rating: null,
        revenue: {
          amount: 0,
          currency: "INR",
        },
      },
      nextAction: {
        href: null,
        label: "Create course coming soon",
      },
    };
  }

  async getCourses(userId: string) {
    await this.ensureCreatorProfile(userId);

    const courses = await this.prisma.course.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      where: { creatorId: userId },
    });

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      subtitle: course.subtitle,
      status: course.status,
      difficulty: course.difficulty,
      category: course.category,
      enrollmentCount: course._count.enrollments,
      moduleCount: course._count.modules,
      publishedAt: course.publishedAt,
      updatedAt: course.updatedAt,
    }));
  }

  private async ensureCreatorProfile(userId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Creator profile not found.");
    }

    return profile;
  }

  private normalizeProfileDto(dto: UpsertCreatorProfileDto) {
    return {
      bio: dto.bio.trim(),
      displayName: dto.displayName.trim(),
      expertise: dto.expertise.map((item) => item.trim()).filter(Boolean),
      linkedinUrl: dto.linkedinUrl?.trim() || null,
      websiteUrl: dto.websiteUrl?.trim() || null,
      youtubeUrl: dto.youtubeUrl?.trim() || null,
    };
  }
}
