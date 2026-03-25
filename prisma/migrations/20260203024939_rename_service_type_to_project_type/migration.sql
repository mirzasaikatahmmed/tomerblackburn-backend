-- AlterTable: Rename service_types to project_types
ALTER TABLE "service_types" RENAME TO "project_types";

-- AlterTable: Rename serviceTypeId column to projectTypeId in service_categories
ALTER TABLE "service_categories" RENAME COLUMN "serviceTypeId" TO "projectTypeId";

-- RenameForeignKey
ALTER TABLE "service_categories"
  DROP CONSTRAINT IF EXISTS "service_categories_serviceTypeId_fkey",
  ADD CONSTRAINT "service_categories_projectTypeId_fkey"
    FOREIGN KEY ("projectTypeId")
    REFERENCES "project_types"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX IF EXISTS "service_categories_serviceTypeId_idx"
  RENAME TO "service_categories_projectTypeId_idx";
