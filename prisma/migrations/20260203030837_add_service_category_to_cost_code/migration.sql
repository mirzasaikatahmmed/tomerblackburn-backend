-- AlterTable: Add serviceCategoryId column to cost_codes
ALTER TABLE "cost_codes" ADD COLUMN "serviceCategoryId" TEXT;

-- CreateIndex
CREATE INDEX "cost_codes_serviceCategoryId_idx" ON "cost_codes"("serviceCategoryId");

-- AddForeignKey
ALTER TABLE "cost_codes" ADD CONSTRAINT "cost_codes_serviceCategoryId_fkey"
  FOREIGN KEY ("serviceCategoryId") REFERENCES "service_categories"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
