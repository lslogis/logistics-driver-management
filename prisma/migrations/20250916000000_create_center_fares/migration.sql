-- Create center_fares table aligned with loadingPointId
CREATE TABLE "center_fares" (
  "id" TEXT PRIMARY KEY,
  "loadingPointId" TEXT NOT NULL,
  "vehicleType" TEXT NOT NULL,
  "fareType" "FareType" NOT NULL,
  "baseFare" INTEGER,
  "extraStopFee" INTEGER,
  "extraRegionFee" INTEGER,
  "region" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "center_fares"
  ADD CONSTRAINT "center_fares_loadingPointId_fkey"
  FOREIGN KEY ("loadingPointId") REFERENCES "loading_points"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

CREATE UNIQUE INDEX "center_fares_loadingPointId_vehicleType_region_key"
  ON "center_fares"("loadingPointId", "vehicleType", COALESCE("region", ''));

CREATE INDEX "center_fares_loadingPointId_vehicleType_fareType_idx"
  ON "center_fares"("loadingPointId", "vehicleType", "fareType");

CREATE INDEX "center_fares_region_idx" ON "center_fares"("region");
