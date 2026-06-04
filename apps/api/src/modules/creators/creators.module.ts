import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { PrismaModule } from "../../lib/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { CreatorCourseBuilderController } from "./creator-course-builder.controller";
import { CreatorCourseBuilderService } from "./creator-course-builder.service";
import { CreatorRevenueController } from "./creator-revenue.controller";
import { CreatorRevenueService } from "./creator-revenue.service";
import { CreatorsController } from "./creators.controller";
import { CreatorsService } from "./creators.service";

@Module({
  imports: [PrismaModule, JwtModule, AuthModule],
  controllers: [CreatorsController, CreatorCourseBuilderController, CreatorRevenueController],
  providers: [CreatorsService, CreatorCourseBuilderService, CreatorRevenueService],
})
export class CreatorsModule {}
