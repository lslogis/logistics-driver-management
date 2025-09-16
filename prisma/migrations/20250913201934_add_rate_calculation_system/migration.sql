-- CreateEnum
CREATE TYPE "RateDetailType" AS ENUM ('BASE', 'CALL_FEE', 'WAYPOINT_FEE', 'SPECIAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'ACTIVATE';
ALTER TYPE "AuditAction" ADD VALUE 'DEACTIVATE';

-- CreateTable
CREATE TABLE "rate_masters" (
    "id" TEXT NOT NULL,
    "centerName" TEXT NOT NULL,
    "tonnage" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "rate_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_details" (
    "id" TEXT NOT NULL,
    "rateMasterId" TEXT NOT NULL,
    "type" "RateDetailType" NOT NULL,
    "region" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "conditions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rate_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_masters_centerName_idx" ON "rate_masters"("centerName");

-- CreateIndex
CREATE INDEX "rate_masters_tonnage_idx" ON "rate_masters"("tonnage");

-- CreateIndex
CREATE INDEX "rate_masters_isActive_idx" ON "rate_masters"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "rate_masters_centerName_tonnage_key" ON "rate_masters"("centerName", "tonnage");

-- CreateIndex
CREATE INDEX "rate_details_rateMasterId_type_idx" ON "rate_details"("rateMasterId", "type");

-- CreateIndex
CREATE INDEX "rate_details_region_idx" ON "rate_details"("region");

-- CreateIndex
CREATE INDEX "rate_details_isActive_idx" ON "rate_details"("isActive");

-- AddForeignKey
ALTER TABLE "rate_masters" ADD CONSTRAINT "rate_masters_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_details" ADD CONSTRAINT "rate_details_rateMasterId_fkey" FOREIGN KEY ("rateMasterId") REFERENCES "rate_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
