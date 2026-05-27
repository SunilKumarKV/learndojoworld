import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/env.validation";
import { PrismaModule } from "./lib/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
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
    HealthModule,
    ProfilesModule,
    UsersModule,
  ],
})
export class AppModule {}
