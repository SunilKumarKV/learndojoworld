import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcrypt";

import type { EnvironmentVariables } from "../../config/env.validation";
import { PrismaService } from "../../lib/prisma/prisma.service";
import { AnalyticsService } from "../analytics/analytics.service";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";
import type { TokenPayload } from "./types/authenticated-user.type";

const PASSWORD_HASH_ROUNDS = 12;
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AnalyticsService))
    private readonly analyticsService: AnalyticsService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim().toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: {
        email: true,
        username: true,
      },
    });

    if (existingUser?.email === email) {
      throw new ConflictException("Email is already registered.");
    }

    if (existingUser?.username === username) {
      throw new ConflictException("Username is already registered.");
    }

    const passwordHash = await hash(dto.password, PASSWORD_HASH_ROUNDS);
    const name = dto.name?.trim() || null;
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        profile: {
          create: {
            displayName: name ?? username,
          },
        },
        username,
      },
      select: publicUserSelect,
    });
    const tokens = await this.issueTokens({
      email: user.email,
      role: user.role,
      sub: user.id,
      username: user.username,
    });

    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);
    await this.analyticsService.trackEvent(user.id, "user_registered", { email });

    return {
      user,
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    if (!user.isActive || user.isSuspended) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const tokens = await this.issueTokens({
      email: user.email,
      role: user.role,
      sub: user.id,
      username: user.username,
    });
    const updatedUser = await this.prisma.user.update({
      data: {
        lastLoginAt: new Date(),
        refreshTokenHash: await hash(tokens.refreshToken, PASSWORD_HASH_ROUNDS),
      },
      select: publicUserSelect,
      where: {
        id: user.id,
      },
    });

    return {
      user: updatedUser,
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user?.refreshTokenHash || !user.isActive || user.isSuspended) {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    const isRefreshTokenValid = await compare(refreshToken, user.refreshTokenHash);

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    const tokens = await this.issueTokens({
      email: user.email,
      role: user.role,
      sub: user.id,
      username: user.username,
    });

    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      tokens,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      data: {
        refreshTokenHash: null,
      },
      where: {
        id: userId,
      },
    });

    return {
      loggedOut: true,
    };
  }

  private async issueTokens(payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: ACCESS_TOKEN_TTL,
        secret: this.configService.get("JWT_SECRET", { infer: true }),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: REFRESH_TOKEN_TTL,
        secret: this.configService.get("JWT_REFRESH_SECRET", { infer: true }),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async storeRefreshTokenHash(userId: string, refreshToken: string) {
    await this.prisma.user.update({
      data: {
        refreshTokenHash: await hash(refreshToken, PASSWORD_HASH_ROUNDS),
      },
      where: {
        id: userId,
      },
    });
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.get("JWT_REFRESH_SECRET", { infer: true }),
      });
    } catch (_error) {
      throw new UnauthorizedException("Invalid refresh token.");
    }
  }
}

const publicUserSelect = {
  createdAt: true,
  email: true,
  id: true,
  isActive: true,
  isSuspended: true,
  lastLoginAt: true,
  name: true,
  role: true,
  updatedAt: true,
  username: true,
} as const;
