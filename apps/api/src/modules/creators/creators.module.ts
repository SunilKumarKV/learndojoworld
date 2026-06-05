import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { PrismaModule } from "../../lib/prisma/prisma.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { AuthModule } from "../auth/auth.module";
import { CreatorCourseBuilderController } from "./creator-course-builder.controller";
import { CreatorCourseBuilderService } from "./creator-course-builder.service";
import { CreatorRevenueController } from "./creator-revenue.controller";
import { CreatorRevenueService } from "./creator-revenue.service";
import { CreatorsController } from "./creators.controller";
import { CreatorsService } from "./creators.service";
import { PublicCreatorsController } from "./public-creators.controller";

@Module({
  imports: [PrismaModule, JwtModule, AuthModule, AnalyticsModule],
  controllers: [
    CreatorsController,
    CreatorCourseBuilderController,
    CreatorRevenueController,
    PublicCreatorsController,
  ],
  providers: [CreatorsService, CreatorCourseBuilderService, CreatorRevenueService],
})
export class CreatorsModule {}
