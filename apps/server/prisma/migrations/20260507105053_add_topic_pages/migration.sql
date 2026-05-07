-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentBlockType" AS ENUM ('HEADING', 'PARAGRAPH', 'EXAMPLE', 'REAL_WORLD_EXAMPLE', 'COMMON_MISTAKE', 'WARNING', 'TIP', 'CODE', 'QUIZ_REFERENCE', 'VIDEO_REFERENCE');

-- CreateTable
CREATE TABLE "TopicPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "status" "TopicStatus" NOT NULL DEFAULT 'DRAFT',
    "roadmapNodeId" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBlock" (
    "id" TEXT NOT NULL,
    "topicPageId" TEXT NOT NULL,
    "type" "ContentBlockType" NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "language" TEXT,
    "referenceId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicPage_slug_key" ON "TopicPage"("slug");

-- CreateIndex
CREATE INDEX "TopicPage_status_idx" ON "TopicPage"("status");

-- CreateIndex
CREATE INDEX "TopicPage_roadmapNodeId_idx" ON "TopicPage"("roadmapNodeId");

-- CreateIndex
CREATE INDEX "TopicPage_createdById_idx" ON "TopicPage"("createdById");

-- CreateIndex
CREATE INDEX "ContentBlock_topicPageId_order_idx" ON "ContentBlock"("topicPageId", "order");

-- CreateIndex
CREATE INDEX "ContentBlock_type_idx" ON "ContentBlock"("type");

-- AddForeignKey
ALTER TABLE "TopicPage" ADD CONSTRAINT "TopicPage_roadmapNodeId_fkey" FOREIGN KEY ("roadmapNodeId") REFERENCES "RoadmapNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicPage" ADD CONSTRAINT "TopicPage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicPage" ADD CONSTRAINT "TopicPage_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_topicPageId_fkey" FOREIGN KEY ("topicPageId") REFERENCES "TopicPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
