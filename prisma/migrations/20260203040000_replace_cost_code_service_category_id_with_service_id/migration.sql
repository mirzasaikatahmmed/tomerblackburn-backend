/*
  Warnings:

  - You are about to drop the column `serviceCategoryId` on the `cost_codes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "cost_codes" DROP CONSTRAINT "cost_codes_serviceCategoryId_fkey";

-- DropIndex
DROP INDEX "cost_codes_serviceCategoryId_idx";

-- AlterTable
ALTER TABLE "cost_codes" DROP COLUMN "serviceCategoryId",
ADD COLUMN     "serviceId" TEXT;

-- CreateIndex
CREATE INDEX "cost_codes_serviceId_idx" ON "cost_codes"("serviceId");

-- AddForeignKey
ALTER TABLE "cost_codes" ADD CONSTRAINT "cost_codes_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
