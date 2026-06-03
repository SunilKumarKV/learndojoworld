-- Extend creator profiles without breaking existing creator rows.
ALTER TABLE "CreatorProfile"
ADD COLUMN "expertise" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "websiteUrl" TEXT,
ADD COLUMN "linkedinUrl" TEXT,
ADD COLUMN "youtubeUrl" TEXT;

-- Nullable ownership keeps seeded/system courses valid until creator-built courses exist.
ALTER TABLE "Course" ADD COLUMN "creatorId" UUID;

CREATE INDEX "Course_creatorId_idx" ON "Course"("creatorId");

ALTER TABLE "Course"
ADD CONSTRAINT "Course_creatorId_fkey"
FOREIGN KEY ("creatorId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
