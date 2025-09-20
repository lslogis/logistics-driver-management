-- Migration: Consolidate Request and Dispatch models
-- Date: 2025-09-20
-- Description: Move dispatch fields to Request model and remove Dispatch table

-- 1. Add new driver-related fields to Request table
ALTER TABLE "requests" ADD COLUMN "driverId" TEXT;
ALTER TABLE "requests" ADD COLUMN "driverName" TEXT;
ALTER TABLE "requests" ADD COLUMN "driverPhone" TEXT;
ALTER TABLE "requests" ADD COLUMN "driverVehicle" TEXT;
ALTER TABLE "requests" ADD COLUMN "deliveryTime" TEXT;
ALTER TABLE "requests" ADD COLUMN "driverFee" INTEGER;
ALTER TABLE "requests" ADD COLUMN "driverNotes" TEXT;
ALTER TABLE "requests" ADD COLUMN "dispatchedAt" TIMESTAMPTZ(6);

-- 2. Make centerCarNo nullable (from schema update)
ALTER TABLE "requests" ALTER COLUMN "centerCarNo" DROP NOT NULL;

-- 3. Data migration: Copy data from dispatches to requests
-- Note: If multiple dispatches exist for one request, take the most recent one
UPDATE "requests" r SET 
  "driverId" = d."driverId",
  "driverName" = d."driverName",
  "driverPhone" = d."driverPhone", 
  "driverVehicle" = d."driverVehicle",
  "deliveryTime" = d."deliveryTime",
  "driverFee" = d."driverFee",
  "driverNotes" = d."driverNotes",
  "dispatchedAt" = d."createdAt"
FROM "dispatches" d 
WHERE d."requestId" = r."id"
  AND d."createdAt" = (
    SELECT MAX("createdAt") 
    FROM "dispatches" d2 
    WHERE d2."requestId" = r."id"
  );

-- 4. Add foreign key constraint for driverId
ALTER TABLE "requests" ADD CONSTRAINT "requests_driverId_fkey" 
FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL;

-- 5. Add index for driverId (already in schema but ensuring it exists)
CREATE INDEX IF NOT EXISTS "requests_driverId_idx" ON "requests"("driverId");

-- 6. Drop the dispatch table and its indexes
DROP TABLE IF EXISTS "dispatches" CASCADE;

-- 7. Verify data integrity
DO $$
BEGIN
  -- Check if any requests lost their dispatch data
  IF EXISTS (
    SELECT 1 FROM "requests" r
    WHERE NOT EXISTS (
      SELECT 1 FROM "requests" r2 
      WHERE r2."id" = r."id" 
      AND (r2."driverName" IS NOT NULL OR r2."driverId" IS NOT NULL)
    )
  ) THEN
    RAISE NOTICE 'Warning: Some requests may not have driver information after migration';
  END IF;
  
  RAISE NOTICE 'Migration completed successfully';
END $$;