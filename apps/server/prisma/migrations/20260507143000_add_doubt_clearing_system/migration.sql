-- CreateEnum
CREATE TYPE "DoubtStatus" AS ENUM ('OPEN', 'RESOLVED', 'FLAGGED', 'HIDDEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "DoubtReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED');

-- CreateTable
CREATE TABLE "Doubt" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "DoubtStatus" NOT NULL DEFAULT 'OPEN',
    "topicPageId" TEXT,
    "roadmapNodeId" TEXT,
    "videoTimestampSeconds" INTEGER,
    "authorId" TEXT NOT NULL,
    "acceptedReplyId" TEXT,
    "moderationReason" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Doubt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoubtReply" (
    "id" TEXT NOT NULL,
    "doubtId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "officialMarkedById" TEXT,
    "officialMarkedAt" TIMESTAMP(3),
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "moderationReason" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoubtReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoubtVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "doubtId" TEXT,
    "replyId" TEXT,
    "value" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoubtVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoubtReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "doubtId" TEXT,
    "replyId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "DoubtReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoubtReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Doubt_acceptedReplyId_key" ON "Doubt"("acceptedReplyId");

-- CreateIndex
CREATE INDEX "Doubt_topicPageId_createdAt_idx" ON "Doubt"("topicPageId", "createdAt");

-- CreateIndex
CREATE INDEX "Doubt_roadmapNodeId_createdAt_idx" ON "Doubt"("roadmapNodeId", "createdAt");

-- CreateIndex
CREATE INDEX "Doubt_authorId_createdAt_idx" ON "Doubt"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Doubt_status_idx" ON "Doubt"("status");

-- CreateIndex
CREATE INDEX "DoubtReply_doubtId_createdAt_idx" ON "DoubtReply"("doubtId", "createdAt");

-- CreateIndex
CREATE INDEX "DoubtReply_authorId_createdAt_idx" ON "DoubtReply"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "DoubtReply_isOfficial_idx" ON "DoubtReply"("isOfficial");

-- CreateIndex
CREATE INDEX "DoubtReply_isHidden_idx" ON "DoubtReply"("isHidden");

-- CreateIndex
CREATE UNIQUE INDEX "DoubtVote_userId_doubtId_key" ON "DoubtVote"("userId", "doubtId");

-- CreateIndex
CREATE UNIQUE INDEX "DoubtVote_userId_replyId_key" ON "DoubtVote"("userId", "replyId");

-- CreateIndex
CREATE INDEX "DoubtVote_doubtId_idx" ON "DoubtVote"("doubtId");

-- CreateIndex
CREATE INDEX "DoubtVote_replyId_idx" ON "DoubtVote"("replyId");

-- CreateIndex
CREATE UNIQUE INDEX "DoubtReport_reporterId_doubtId_key" ON "DoubtReport"("reporterId", "doubtId");

-- CreateIndex
CREATE UNIQUE INDEX "DoubtReport_reporterId_replyId_key" ON "DoubtReport"("reporterId", "replyId");

-- CreateIndex
CREATE INDEX "DoubtReport_doubtId_createdAt_idx" ON "DoubtReport"("doubtId", "createdAt");

-- CreateIndex
CREATE INDEX "DoubtReport_replyId_createdAt_idx" ON "DoubtReport"("replyId", "createdAt");

-- CreateIndex
CREATE INDEX "DoubtReport_status_createdAt_idx" ON "DoubtReport"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Doubt" ADD CONSTRAINT "Doubt_topicPageId_fkey" FOREIGN KEY ("topicPageId") REFERENCES "TopicPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doubt" ADD CONSTRAINT "Doubt_roadmapNodeId_fkey" FOREIGN KEY ("roadmapNodeId") REFERENCES "RoadmapNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doubt" ADD CONSTRAINT "Doubt_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtReply" ADD CONSTRAINT "DoubtReply_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtReply" ADD CONSTRAINT "DoubtReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtReply" ADD CONSTRAINT "DoubtReply_officialMarkedById_fkey" FOREIGN KEY ("officialMarkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doubt" ADD CONSTRAINT "Doubt_acceptedReplyId_fkey" FOREIGN KEY ("acceptedReplyId") REFERENCES "DoubtReply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtVote" ADD CONSTRAINT "DoubtVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtVote" ADD CONSTRAINT "DoubtVote_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtVote" ADD CONSTRAINT "DoubtVote_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "DoubtReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtReport" ADD CONSTRAINT "DoubtReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtReport" ADD CONSTRAINT "DoubtReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtReport" ADD CONSTRAINT "DoubtReport_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtReport" ADD CONSTRAINT "DoubtReport_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "DoubtReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
