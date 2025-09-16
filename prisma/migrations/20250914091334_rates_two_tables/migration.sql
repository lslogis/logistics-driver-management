-- CreateTable
CREATE TABLE "rate_bases" (
    "id" TEXT NOT NULL,
    "centerName" TEXT NOT NULL,
    "tonnage" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "baseFare" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rate_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_addons" (
    "id" TEXT NOT NULL,
    "centerName" TEXT NOT NULL,
    "tonnage" TEXT NOT NULL,
    "perStop" INTEGER NOT NULL,
    "perWaypoint" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rate_addons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_base_center_tonnage_idx" ON "rate_bases"("centerName", "tonnage");

-- CreateIndex
CREATE UNIQUE INDEX "rate_bases_centerName_tonnage_region_key" ON "rate_bases"("centerName", "tonnage", "region");

-- CreateIndex
CREATE INDEX "rate_addons_center_tonnage_idx" ON "rate_addons"("centerName", "tonnage");

-- CreateIndex
CREATE UNIQUE INDEX "rate_addons_centerName_tonnage_key" ON "rate_addons"("centerName", "tonnage");
