-- CreateTable
CREATE TABLE "tips" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tips_position_idx" ON "tips"("position");
