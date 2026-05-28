-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "dailyGoalMin" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "learningStyle" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "skillLevel" "Difficulty",
ADD COLUMN     "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];
