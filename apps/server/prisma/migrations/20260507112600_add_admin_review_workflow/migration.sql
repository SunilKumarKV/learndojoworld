-- CreateEnum
CREATE TYPE "ReviewableContentType" AS ENUM ('COURSE', 'TOPIC_PAGE');

-- AlterEnum safely: TopicStatus
ALTER TYPE "TopicStatus" RENAME TO "TopicStatus_old";
CREATE TYPE "TopicStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'FLAGGED');
ALTER TABLE "TopicPage" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TopicPage"
  ALTER COLUMN "status" TYPE "TopicStatus"
  USING (
    CASE "status"::text
      WHEN 'PENDING_REVIEW' THEN 'SUBMITTED'
      WHEN 'ARCHIVED' THEN 'FLAGGED'
      ELSE "status"::text
    END
  )::"TopicStatus";
ALTER TABLE "TopicPage" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
DROP TYPE "TopicStatus_old";

-- AlterEnum safely: CourseStatus
ALTER TYPE "CourseStatus" RENAME TO "CourseStatus_old";
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'FLAGGED');
ALTER TABLE "Course" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Course"
  ALTER COLUMN "status" TYPE "CourseStatus"
  USING (
    CASE "status"::text
      WHEN 'PENDING_REVIEW' THEN 'SUBMITTED'
      WHEN 'NEEDS_REVISION' THEN 'REJECTED'
      WHEN 'ARCHIVED' THEN 'FLAGGED'
      ELSE "status"::text
    END
  )::"CourseStatus";
ALTER TABLE "Course" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
DROP TYPE "CourseStatus_old";

-- AlterTable
ALTER TABLE "TopicPage" ADD COLUMN "reviewNotes" TEXT;
ALTER TABLE "TopicPage" ADD COLUMN "submittedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ContentReviewEvent" (
    "id" TEXT NOT NULL,
    "contentType" "ReviewableContentType" NOT NULL,
    "courseId" TEXT,
    "topicPageId" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "actorId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentReviewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentReviewEvent_contentType_createdAt_idx" ON "ContentReviewEvent"("contentType", "createdAt");
CREATE INDEX "ContentReviewEvent_courseId_createdAt_idx" ON "ContentReviewEvent"("courseId", "createdAt");
CREATE INDEX "ContentReviewEvent_topicPageId_createdAt_idx" ON "ContentReviewEvent"("topicPageId", "createdAt");
CREATE INDEX "ContentReviewEvent_actorId_idx" ON "ContentReviewEvent"("actorId");

-- AddForeignKey
ALTER TABLE "ContentReviewEvent" ADD CONSTRAINT "ContentReviewEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentReviewEvent" ADD CONSTRAINT "ContentReviewEvent_topicPageId_fkey" FOREIGN KEY ("topicPageId") REFERENCES "TopicPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentReviewEvent" ADD CONSTRAINT "ContentReviewEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "User" (id, email, name, "passwordHash", role, "createdAt", "updatedAt")
VALUES
  (
    'admin_unique_id',
    'admin@example.com',
    'Admin User',
    '$2b$12$21cQfQ393aFZKwoBbARNnuvu3puZuu/Qzh2lV5H4FOkDQYFBJoKIq',
    'ADMIN',
    NOW(),
    NOW()
  ),
  (
    'creator_unique_id',
    'creator@example.com',
    'Creator User',
    '$2b$12$YTipc7MgVf8UuQ.XosWKAeHt8JgcOmAFCHwS1Inq5.J5T912/k8yO',
    'CREATOR',
    NOW(),
    NOW()
  ),
  (
    'learner_unique_id',
    'learner@example.com',
    'Learner User',
    '$2b$12$8j.7.It8q.nc0MY5yRdSWOdQKcMH4Iutr4FS505NYYTef.rM13NKy',
    'LEARNER',
    NOW(),
    NOW()
  );