-- AlterTable
ALTER TABLE "PortfolioProject" ADD COLUMN     "downloadLabel" TEXT,
ADD COLUMN     "downloadUrl" TEXT,
ADD COLUMN     "images" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "videoUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioProject_slug_key" ON "PortfolioProject"("slug");
