-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_logs_isRead_idx" ON "activity_logs"("isRead");
