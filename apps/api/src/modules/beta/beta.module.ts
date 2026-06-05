import { Module } from "@nestjs/common";

import { AnalyticsModule } from "../analytics/analytics.module";
import { AdminBetaController } from "./admin-beta.controller";
import { BetaController } from "./beta.controller";
import { BetaService } from "./beta.service";

@Module({
  controllers: [BetaController, AdminBetaController],
  imports: [AnalyticsModule],
  providers: [BetaService],
})
export class BetaModule {}
