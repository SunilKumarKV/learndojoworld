import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/env.validation";
import { PrismaModule } from "./lib/prisma/prisma.module";
import { ActivityModule } from "./modules/activity/activity.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { GamificationModule } from "./modules/gamification/gamification.module";
import { HealthModule } from "./modules/health/health.module";
import { LearningModule } from "./modules/learning/learning.module";
import { MemoryModule } from "./modules/memory/memory.module";
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
    CoursesModule,
    DashboardModule,
    HealthModule,
    LearningModule,
    AnalyticsModule,
    ActivityModule,
    GamificationModule,
    MemoryModule,
    OnboardingModule,
    ProfilesModule,
    UsersModule,
  ],
})
export class AppModule {}
