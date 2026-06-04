-- DropIndex
DROP INDEX "ReferralReward_referralEventId_key";

-- AlterTable
ALTER TABLE "ReferralReward" ADD COLUMN     "notes" TEXT;
