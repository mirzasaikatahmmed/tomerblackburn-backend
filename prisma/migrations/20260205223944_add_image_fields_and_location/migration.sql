-- AlterTable
ALTER TABLE "project_types" RENAME CONSTRAINT "service_types_pkey" TO "project_types_pkey";

-- AlterTable
ALTER TABLE "project_types" ADD COLUMN "imageId" TEXT;

-- AlterTable
ALTER TABLE "service_categories" ADD COLUMN     "imageId" TEXT;

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "address" TEXT,
ADD COLUMN     "location" TEXT;

-- AddForeignKey
ALTER TABLE "project_types" ADD CONSTRAINT "project_types_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "file_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "file_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "service_types_displayOrder_idx" RENAME TO "project_types_displayOrder_idx";

-- RenameIndex
ALTER INDEX "service_types_isActive_idx" RENAME TO "project_types_isActive_idx";
