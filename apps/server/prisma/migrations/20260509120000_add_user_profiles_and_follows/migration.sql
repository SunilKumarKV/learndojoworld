CREATE TABLE IF NOT EXISTS "UserProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "headline" TEXT,
  "bio" TEXT,
  "location" TEXT,
  "website" TEXT,
  "avatarUrl" TEXT,
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_userId_key" ON "UserProfile"("userId");

ALTER TABLE "UserProfile"
  ADD CONSTRAINT "UserProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "UserFollow" (
  "id" TEXT NOT NULL,
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");
CREATE INDEX IF NOT EXISTS "UserFollow_followingId_idx" ON "UserFollow"("followingId");
CREATE INDEX IF NOT EXISTS "UserFollow_followerId_idx" ON "UserFollow"("followerId");

ALTER TABLE "UserFollow"
  ADD CONSTRAINT "UserFollow_followerId_fkey"
  FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserFollow"
  ADD CONSTRAINT "UserFollow_followingId_fkey"
  FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
