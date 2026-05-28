import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { PrismaModule } from "../../lib/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { LearningController } from "./learning.controller";
import { LessonsController } from "./lessons.controller";
import { ProgressController } from "./progress.controller";
import { LearningService } from "./learning.service";

@Module({
  imports: [PrismaModule, JwtModule, AuthModule],
  controllers: [LessonsController, ProgressController, LearningController],
  providers: [LearningService],
})
export class LearningModule {}
