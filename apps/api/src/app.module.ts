import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/env.validation";
import { PrismaModule } from "./lib/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { HealthModule } from "./modules/health/health.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { ProfilesModule } from "./modules/profiles/profiles.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: ["apps/api/.env", ".env"],
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    HealthModule,
    OnboardingModule,
    ProfilesModule,
    UsersModule,
  ],
})
export class AppModule {}
