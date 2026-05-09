-- CreateEnum
CREATE TYPE "FlashcardReviewGrade" AS ENUM ('EASY', 'GOOD', 'HARD', 'FORGOT');

-- AlterTable
ALTER TABLE "Doubt" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DoubtReply" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DoubtReport" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "LearnerStats" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RevisionItem" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StudyPlan" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StudySession" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicPageId" TEXT,
    "roadmapNodeId" TEXT,
    "frontText" TEXT NOT NULL,
    "backText" TEXT NOT NULL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "reviewValueTotal" INTEGER NOT NULL DEFAULT 0,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "nextReviewAt" TIMESTAMP(3) NOT NULL,
    "masteryScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardReview" (
    "id" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grade" "FlashcardReviewGrade" NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "nextReviewAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlashcardReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Flashcard_userId_idx" ON "Flashcard"("userId");

-- CreateIndex
CREATE INDEX "Flashcard_nextReviewAt_idx" ON "Flashcard"("nextReviewAt");

-- CreateIndex
CREATE INDEX "Flashcard_topicPageId_idx" ON "Flashcard"("topicPageId");

-- CreateIndex
CREATE INDEX "FlashcardReview_flashcardId_idx" ON "FlashcardReview"("flashcardId");

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_topicPageId_fkey" FOREIGN KEY ("topicPageId") REFERENCES "TopicPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_roadmapNodeId_fkey" FOREIGN KEY ("roadmapNodeId") REFERENCES "RoadmapNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardReview" ADD CONSTRAINT "FlashcardReview_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "Flashcard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardReview" ADD CONSTRAINT "FlashcardReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
