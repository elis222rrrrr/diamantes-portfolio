-- CreateEnum
CREATE TYPE "PortfolioGroup" AS ENUM ('PERSONAL', 'COMMISSIONED');

-- CreateTable
CREATE TABLE "PortfolioProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "group" "PortfolioGroup" NOT NULL,
    "accent" TEXT NOT NULL,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroTagline" TEXT NOT NULL DEFAULT 'Creative Technology Studio',
    "heroCategories" JSONB NOT NULL DEFAULT '["3D FASHION", "ENGINEERING", "PRODUCT DESIGN", "DIGITAL FABRICATION"]',
    "seoDefaultTitle" TEXT NOT NULL DEFAULT 'Diamantes 3Designs | 3D Modeling, 3D Printing & Prototype Engineering Studio',
    "seoDefaultDescription" TEXT NOT NULL DEFAULT 'Diamantes 3Designs is a Greece-based studio working worldwide across 3D modeling, 3D printing, prototype engineering, CAD, fashion experimentation, and product design.',
    "seoKeywords" JSONB NOT NULL DEFAULT '[]',
    "seoKnowsAbout" JSONB NOT NULL DEFAULT '["3D Modeling", "3D Printing", "Prototype Engineering", "CAD Design", "Fashion Experimentation", "Product Design"]',
    "areaServed" TEXT NOT NULL DEFAULT 'Worldwide',
    "addressStreet" TEXT,
    "addressCity" TEXT,
    "addressPostalCode" TEXT,
    "addressCountry" TEXT NOT NULL DEFAULT 'GR',
    "phone" TEXT,
    "email" TEXT NOT NULL DEFAULT 'diamantesdesignsbyelis@gmail.com',
    "instagramUrl" TEXT NOT NULL DEFAULT 'https://www.instagram.com/diamantesdesigns/',
    "tiktokUrl" TEXT NOT NULL DEFAULT 'https://www.tiktok.com/@diamantes.designs',
    "shippingCountries" JSONB NOT NULL DEFAULT '["GR","CY","DE","FR","IT","ES","NL","BE","AT","IE","PT","GB","US","CA","AU"]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioProject_group_order_idx" ON "PortfolioProject"("group", "order");

-- CreateIndex
CREATE INDEX "Service_order_idx" ON "Service"("order");
