import { Module } from "@nestjs/common";
import { ReferralsController } from "./referrals.controller";
import { ReferralsService } from "./referrals.service";
import { PrismaModule } from "../../lib/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
