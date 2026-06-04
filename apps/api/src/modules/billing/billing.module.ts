import { Module, forwardRef } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PaymentsModule } from "../payments/payments.module";
import { AIUsageController } from "./ai-usage.controller";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";

@Module({
  imports: [AuthModule, forwardRef(() => PaymentsModule)],
  controllers: [BillingController, AIUsageController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
