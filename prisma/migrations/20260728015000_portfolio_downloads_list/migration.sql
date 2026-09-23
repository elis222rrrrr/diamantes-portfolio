-- AlterTable
ALTER TABLE "PortfolioProject" DROP COLUMN "downloadLabel",
DROP COLUMN "downloadUrl",
ADD COLUMN     "downloads" JSONB NOT NULL DEFAULT '[]';
