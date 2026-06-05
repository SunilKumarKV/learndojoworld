import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { validateEnvironment } from "./config/env.validation";
import { PrismaModule } from "./lib/prisma/prisma.module";
import { ActivityModule } from "./modules/activity/activity.module";
import { AIModule } from "./modules/ai/ai.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AdminModule } from "./modules/admin/admin.module";
import { BetaModule } from "./modules/beta/beta.module";
import { BillingModule } from "./modules/billing/billing.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { CreatorsModule } from "./modules/creators/creators.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { GamificationModule } from "./modules/gamification/gamification.module";
import { HealthModule } from "./modules/health/health.module";
import { LearningModule } from "./modules/learning/learning.module";
import { MemoryModule } from "./modules/memory/memory.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ProfilesModule } from "./modules/profiles/profiles.module";
import { UsersModule } from "./modules/users/users.module";
import { ReferralsModule } from "./modules/referrals/referrals.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: ["apps/api/.env", ".env"],
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuthModule,
    AdminModule,
    BetaModule,
    BillingModule,
    CoursesModule,
    CreatorsModule,
    DashboardModule,
    AIModule,
    HealthModule,
    LearningModule,
    AnalyticsModule,
    ActivityModule,
    GamificationModule,
    MemoryModule,
    OnboardingModule,
    PaymentsModule,
    ProfilesModule,
    UsersModule,
    ReferralsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
