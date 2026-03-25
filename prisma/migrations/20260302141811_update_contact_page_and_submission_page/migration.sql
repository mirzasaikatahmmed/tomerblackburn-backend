-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "ctaBannerEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ctaBannerText" TEXT DEFAULT 'Get Your Free Live Estimate Now!';

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "contact_media" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "fileInstanceId" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL DEFAULT 'PHOTO',
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_media_contactId_idx" ON "contact_media"("contactId");

-- CreateIndex
CREATE INDEX "contact_media_mediaType_idx" ON "contact_media"("mediaType");

-- CreateIndex
CREATE INDEX "contact_media_fileInstanceId_idx" ON "contact_media"("fileInstanceId");

-- CreateIndex
CREATE INDEX "submissions_isArchived_idx" ON "submissions"("isArchived");

-- AddForeignKey
ALTER TABLE "contact_media" ADD CONSTRAINT "contact_media_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact_us"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_media" ADD CONSTRAINT "contact_media_fileInstanceId_fkey" FOREIGN KEY ("fileInstanceId") REFERENCES "file_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
