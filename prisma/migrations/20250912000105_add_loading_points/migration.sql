-- AlterTable
ALTER TABLE "route_templates" ADD COLUMN     "loadingPointId" TEXT;

-- CreateTable
CREATE TABLE "loading_points" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "loading_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loading_points_name_key" ON "loading_points"("name");

-- CreateIndex
CREATE INDEX "loading_points_name_idx" ON "loading_points"("name");

-- CreateIndex
CREATE INDEX "loading_points_category_idx" ON "loading_points"("category");

-- CreateIndex
CREATE INDEX "loading_points_isActive_idx" ON "loading_points"("isActive");

-- CreateIndex
CREATE INDEX "route_templates_loadingPointId_idx" ON "route_templates"("loadingPointId");

-- AddForeignKey
ALTER TABLE "route_templates" ADD CONSTRAINT "route_templates_loadingPointId_fkey" FOREIGN KEY ("loadingPointId") REFERENCES "loading_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;
