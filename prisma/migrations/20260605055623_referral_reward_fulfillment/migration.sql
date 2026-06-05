-- AlterTable
ALTER TABLE "ReferralReward" ADD COLUMN     "fulfilledAt" TIMESTAMP(3),
ADD COLUMN     "fulfillmentReference" TEXT;

-- CreateIndex
CREATE INDEX "ReferralReward_fulfilledAt_idx" ON "ReferralReward"("fulfilledAt");
