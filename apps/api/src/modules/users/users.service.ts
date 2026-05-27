import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../lib/prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      select: {
        createdAt: true,
        email: true,
        id: true,
        isActive: true,
        isSuspended: true,
        lastLoginAt: true,
        name: true,
        profile: {
          select: {
            displayName: true,
            headline: true,
            id: true,
            preferredDifficulty: true,
          },
        },
        role: true,
        updatedAt: true,
        username: true,
      },
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return user;
  }
}
