-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "details" TEXT NOT NULL DEFAULT '';

-- Backfill slugs for existing rows
UPDATE "Service" SET "slug" = 'fashion-design' WHERE "title" = '3D Fashion Design';
UPDATE "Service" SET "slug" = 'brand-logo-design' WHERE "title" = 'Brand & Logo Design';
UPDATE "Service" SET "slug" = 'character-motion-design' WHERE "title" = '3D Character & Motion Design';
UPDATE "Service" SET "slug" = 'jewelry-accessory-design' WHERE "title" = 'Jewelry & Accessory Design';
UPDATE "Service" SET "slug" = 'digital-fabrication-3d-printing' WHERE "title" = 'Digital Fabrication & 3D Printing';
UPDATE "Service" SET "slug" = 'product-mechanical-design' WHERE "title" = 'Product & Mechanical Design';
-- Any other/unexpected row falls back to a slug derived from its id, so the
-- NOT NULL below can never fail regardless of what's actually in the table.
UPDATE "Service" SET "slug" = "id" WHERE "slug" IS NULL;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
