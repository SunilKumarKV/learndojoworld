-- CreateEnum
CREATE TYPE "BetaWaitlistRoleInterest" AS ENUM ('LEARNER', 'CREATOR', 'BOTH');

-- CreateEnum
CREATE TYPE "BetaWaitlistStatus" AS ENUM ('WAITLISTED', 'INVITED', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "BetaAccess" ADD COLUMN "cohortId" UUID;

-- CreateTable
CREATE TABLE "BetaWaitlistEntry" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "roleInterest" "BetaWaitlistRoleInterest" NOT NULL,
    "source" TEXT,
    "status" "BetaWaitlistStatus" NOT NULL DEFAULT 'WAITLISTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetaWaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaCohort" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetUsers" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetaCohort_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BetaWaitlistEntry_email_key" ON "BetaWaitlistEntry"("email");

-- CreateIndex
CREATE INDEX "BetaWaitlistEntry_status_idx" ON "BetaWaitlistEntry"("status");

-- CreateIndex
CREATE INDEX "BetaWaitlistEntry_roleInterest_idx" ON "BetaWaitlistEntry"("roleInterest");

-- CreateIndex
CREATE INDEX "BetaWaitlistEntry_createdAt_idx" ON "BetaWaitlistEntry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BetaCohort_name_key" ON "BetaCohort"("name");

-- CreateIndex
CREATE INDEX "BetaCohort_createdAt_idx" ON "BetaCohort"("createdAt");

-- CreateIndex
CREATE INDEX "BetaAccess_cohortId_idx" ON "BetaAccess"("cohortId");

-- AddForeignKey
ALTER TABLE "BetaAccess" ADD CONSTRAINT "BetaAccess_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "BetaCohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;
