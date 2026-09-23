-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "images" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;
