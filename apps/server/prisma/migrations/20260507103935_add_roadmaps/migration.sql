-- CreateEnum
CREATE TYPE "RoadmapStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NodeProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_REVISION');

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "RoadmapStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapNode" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoadmapProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRoadmapProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNodeProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapNodeId" TEXT NOT NULL,
    "userRoadmapProgressId" TEXT NOT NULL,
    "status" "NodeProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "needsRevisionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNodeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NodePrerequisites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Roadmap_slug_key" ON "Roadmap"("slug");

-- CreateIndex
CREATE INDEX "Roadmap_status_idx" ON "Roadmap"("status");

-- CreateIndex
CREATE INDEX "Roadmap_createdById_idx" ON "Roadmap"("createdById");

-- CreateIndex
CREATE INDEX "RoadmapNode_roadmapId_order_idx" ON "RoadmapNode"("roadmapId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapNode_roadmapId_slug_key" ON "RoadmapNode"("roadmapId", "slug");

-- CreateIndex
CREATE INDEX "UserRoadmapProgress_roadmapId_idx" ON "UserRoadmapProgress"("roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoadmapProgress_userId_roadmapId_key" ON "UserRoadmapProgress"("userId", "roadmapId");

-- CreateIndex
CREATE INDEX "UserNodeProgress_userRoadmapProgressId_idx" ON "UserNodeProgress"("userRoadmapProgressId");

-- CreateIndex
CREATE INDEX "UserNodeProgress_status_idx" ON "UserNodeProgress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserNodeProgress_userId_roadmapNodeId_key" ON "UserNodeProgress"("userId", "roadmapNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "_NodePrerequisites_AB_unique" ON "_NodePrerequisites"("A", "B");

-- CreateIndex
CREATE INDEX "_NodePrerequisites_B_index" ON "_NodePrerequisites"("B");

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapNode" ADD CONSTRAINT "RoadmapNode_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoadmapProgress" ADD CONSTRAINT "UserRoadmapProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoadmapProgress" ADD CONSTRAINT "UserRoadmapProgress_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNodeProgress" ADD CONSTRAINT "UserNodeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNodeProgress" ADD CONSTRAINT "UserNodeProgress_roadmapNodeId_fkey" FOREIGN KEY ("roadmapNodeId") REFERENCES "RoadmapNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNodeProgress" ADD CONSTRAINT "UserNodeProgress_userRoadmapProgressId_fkey" FOREIGN KEY ("userRoadmapProgressId") REFERENCES "UserRoadmapProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NodePrerequisites" ADD CONSTRAINT "_NodePrerequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "RoadmapNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NodePrerequisites" ADD CONSTRAINT "_NodePrerequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "RoadmapNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
