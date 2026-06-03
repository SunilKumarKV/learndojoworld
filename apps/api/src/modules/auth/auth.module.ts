import { forwardRef, Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AnalyticsModule } from "../analytics/analytics.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Global()
@Module({
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule],
  imports: [forwardRef(() => AnalyticsModule), JwtModule.register({})],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
