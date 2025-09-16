-- Add new fields
ALTER TABLE "trips" ADD COLUMN "vehicleNumber" TEXT;
ALTER TABLE "trips" ADD COLUMN "totalStops" INTEGER;

-- Migrate existing operationDate data to date field (if needed)
UPDATE "trips" SET "date" = "operationDate"::date 
WHERE "operationDate" IS NOT NULL AND "date" IS NULL;

-- Drop the operationDate column and its index
DROP INDEX IF EXISTS "trips_operationDate_idx";
ALTER TABLE "trips" DROP COLUMN "operationDate";