-- DropForeignKey
ALTER TABLE "trips" DROP CONSTRAINT "trips_driverId_fkey";

-- DropForeignKey
ALTER TABLE "trips" DROP CONSTRAINT "trips_vehicleId_fkey";

-- DropIndex
DROP INDEX "trips_vehicleId_date_driverId_key";

-- AlterTable
ALTER TABLE "rate_details" ADD COLUMN     "validFrom" TIMESTAMPTZ(6),
ADD COLUMN     "validTo" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "baseFare" INTEGER,
ADD COLUMN     "callFee" INTEGER,
ADD COLUMN     "centerId" TEXT,
ADD COLUMN     "centerName" TEXT,
ADD COLUMN     "charterCost" INTEGER,
ADD COLUMN     "contact" TEXT,
ADD COLUMN     "driverName" TEXT,
ADD COLUMN     "extraFee" INTEGER,
ADD COLUMN     "extraReason" TEXT,
ADD COLUMN     "operationDate" TIMESTAMPTZ(6),
ADD COLUMN     "regions" TEXT[],
ADD COLUMN     "requester" TEXT,
ADD COLUMN     "tonnage" TEXT,
ADD COLUMN     "totalFare" INTEGER,
ADD COLUMN     "vehicleNumber" TEXT,
ADD COLUMN     "vendor" TEXT,
ADD COLUMN     "waypointFee" INTEGER,
ALTER COLUMN "driverId" DROP NOT NULL,
ALTER COLUMN "vehicleId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "region_aliases" (
    "id" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "region_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "region_aliases_normalizedText_idx" ON "region_aliases"("normalizedText");

-- CreateIndex
CREATE INDEX "region_aliases_rawText_idx" ON "region_aliases"("rawText");

-- CreateIndex
CREATE UNIQUE INDEX "region_aliases_rawText_key" ON "region_aliases"("rawText");

-- CreateIndex
CREATE INDEX "rate_details_validFrom_validTo_idx" ON "rate_details"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "trips_centerId_date_idx" ON "trips"("centerId", "date");

-- CreateIndex
CREATE INDEX "trips_operationDate_idx" ON "trips"("operationDate");

-- CreateIndex
CREATE INDEX "trips_centerName_tonnage_idx" ON "trips"("centerName", "tonnage");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "loading_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
