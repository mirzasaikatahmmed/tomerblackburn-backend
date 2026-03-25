-- AlterTable
ALTER TABLE "cost_codes" ADD COLUMN "tips" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

