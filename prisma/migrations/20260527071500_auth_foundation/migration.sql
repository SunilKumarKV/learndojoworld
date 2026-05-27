-- Add auth foundation fields with backfills so existing foundation users do not block migration.
ALTER TABLE "User"
ADD COLUMN "username" TEXT,
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "refreshTokenHash" TEXT,
ADD COLUMN "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

UPDATE "User"
SET "username" = LOWER(
  REGEXP_REPLACE(
    CONCAT(SPLIT_PART("email", '@', 1), '_', SUBSTRING(REPLACE("id"::TEXT, '-', ''), 1, 8)),
    '[^a-zA-Z0-9_]',
    '_',
    'g'
  )
)
WHERE "username" IS NULL;

UPDATE "User"
SET "passwordHash" = '__legacy_user_requires_password_reset__'
WHERE "passwordHash" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "username" SET NOT NULL,
ALTER COLUMN "passwordHash" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_isSuspended_idx" ON "User"("isSuspended");
