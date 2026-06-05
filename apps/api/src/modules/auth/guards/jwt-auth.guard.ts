import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

import type { EnvironmentVariables } from "../../../config/env.validation";
import { PrismaService } from "../../../lib/prisma/prisma.service";
import type { AuthenticatedUser, TokenPayload } from "../types/authenticated-user.type";

type RequestWithUser = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.configService.get("JWT_SECRET", { infer: true }),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          email: true,
          id: true,
          isActive: true,
          isSuspended: true,
          role: true,
          username: true,
        },
      });

      if (!user || !user.isActive || user.isSuspended) {
        throw new UnauthorizedException("Invalid or expired token.");
      }

      request.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
      };

      return true;
    } catch (_error) {
      throw new UnauthorizedException("Invalid or expired token.");
    }
  }

  private extractBearerToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];

    return type === "Bearer" ? token : undefined;
  }
}
