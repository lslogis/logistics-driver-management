-- Rollback script for Request-Dispatch consolidation
-- This script recreates the Dispatch table and moves data back

-- 1. Recreate the Dispatch table
CREATE TABLE "dispatches" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "driverId" TEXT,
  "driverName" TEXT NOT NULL,
  "driverPhone" TEXT NOT NULL,
  "driverVehicle" TEXT NOT NULL,
  "deliveryTime" TEXT,
  "driverFee" INTEGER NOT NULL,
  "driverNotes" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id")
);

-- 2. Recreate indexes for Dispatch table
CREATE INDEX "dispatches_requestId_idx" ON "dispatches"("requestId");
CREATE INDEX "dispatches_driverId_idx" ON "dispatches"("driverId");
CREATE INDEX "dispatches_requestId_driverId_idx" ON "dispatches"("requestId", "driverId");
CREATE INDEX "dispatches_createdAt_idx" ON "dispatches"("createdAt");

-- 3. Add foreign key constraints
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_requestId_fkey" 
FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE;

ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_driverId_fkey" 
FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL;

-- 4. Migrate data back from requests to dispatches
INSERT INTO "dispatches" (
  "id", "requestId", "driverId", "driverName", "driverPhone", 
  "driverVehicle", "deliveryTime", "driverFee", "driverNotes", 
  "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid()::text,
  r."id",
  r."driverId",
  COALESCE(r."driverName", 'Unknown'),
  COALESCE(r."driverPhone", '010-0000-0000'),
  COALESCE(r."driverVehicle", 'Unknown'),
  r."deliveryTime",
  COALESCE(r."driverFee", 0),
  r."driverNotes",
  COALESCE(r."dispatchedAt", r."createdAt"),
  COALESCE(r."dispatchedAt", r."createdAt")
FROM "requests" r
WHERE r."driverName" IS NOT NULL OR r."driverId" IS NOT NULL;

-- 5. Remove driver fields from requests table
ALTER TABLE "requests" DROP CONSTRAINT IF EXISTS "requests_driverId_fkey";
DROP INDEX IF EXISTS "requests_driverId_idx";

ALTER TABLE "requests" DROP COLUMN IF EXISTS "driverId";
ALTER TABLE "requests" DROP COLUMN IF EXISTS "driverName";
ALTER TABLE "requests" DROP COLUMN IF EXISTS "driverPhone";
ALTER TABLE "requests" DROP COLUMN IF EXISTS "driverVehicle";
ALTER TABLE "requests" DROP COLUMN IF EXISTS "deliveryTime";
ALTER TABLE "requests" DROP COLUMN IF EXISTS "driverFee";
ALTER TABLE "requests" DROP COLUMN IF EXISTS "driverNotes";
ALTER TABLE "requests" DROP COLUMN IF EXISTS "dispatchedAt";

-- 6. Restore centerCarNo as NOT NULL if needed
-- ALTER TABLE "requests" ALTER COLUMN "centerCarNo" SET NOT NULL;

RAISE NOTICE 'Rollback completed successfully';