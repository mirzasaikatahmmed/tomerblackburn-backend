-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "activity_logs_userId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "activity_logs_userId_idx";

-- AlterTable
ALTER TABLE "activity_logs" DROP COLUMN IF EXISTS "userId", DROP COLUMN IF EXISTS "ipAddress", DROP COLUMN IF EXISTS "userAgent";
