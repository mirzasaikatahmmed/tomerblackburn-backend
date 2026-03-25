-- AlterTable
ALTER TABLE "submissions" ADD COLUMN "buildingTypeId" TEXT;

-- CreateTable
CREATE TABLE "submission_building_type_field_values" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_building_type_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submissions_buildingTypeId_idx" ON "submissions"("buildingTypeId");

-- CreateIndex
CREATE INDEX "submission_building_type_field_values_submissionId_idx" ON "submission_building_type_field_values"("submissionId");

-- CreateIndex
CREATE INDEX "submission_building_type_field_values_fieldId_idx" ON "submission_building_type_field_values"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_building_type_field_values_submissionId_fieldId_key" ON "submission_building_type_field_values"("submissionId", "fieldId");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_buildingTypeId_fkey" FOREIGN KEY ("buildingTypeId") REFERENCES "building_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_building_type_field_values" ADD CONSTRAINT "submission_building_type_field_values_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_building_type_field_values" ADD CONSTRAINT "submission_building_type_field_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "building_type_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

