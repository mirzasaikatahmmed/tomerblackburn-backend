-- CreateTable
CREATE TABLE "building_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "building_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_type_fields" (
    "id" TEXT NOT NULL,
    "buildingTypeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'text',
    "placeholder" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "building_type_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "building_types_isActive_idx" ON "building_types"("isActive");

-- CreateIndex
CREATE INDEX "building_types_displayOrder_idx" ON "building_types"("displayOrder");

-- CreateIndex
CREATE INDEX "building_type_fields_buildingTypeId_idx" ON "building_type_fields"("buildingTypeId");

-- AddForeignKey
ALTER TABLE "building_type_fields" ADD CONSTRAINT "building_type_fields_buildingTypeId_fkey" FOREIGN KEY ("buildingTypeId") REFERENCES "building_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
