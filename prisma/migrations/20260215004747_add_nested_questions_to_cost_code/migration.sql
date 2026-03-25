-- AlterTable
ALTER TABLE "cost_codes" ADD COLUMN     "nestedInputType" TEXT,
ADD COLUMN     "parentCostCodeId" TEXT,
ADD COLUMN     "showWhenParentValue" TEXT;

-- AddForeignKey
ALTER TABLE "cost_codes" ADD CONSTRAINT "cost_codes_parentCostCodeId_fkey" FOREIGN KEY ("parentCostCodeId") REFERENCES "cost_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
