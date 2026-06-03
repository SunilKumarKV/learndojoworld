import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { AIController } from "./ai.controller";
import { AIService } from "./ai.service";

@Module({
  imports: [AuthModule],
  controllers: [AIController],
  providers: [AIService],
})
export class AIModule {}
