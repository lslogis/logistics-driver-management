/*
  Warnings:

  - You are about to drop the column `companyName` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `representativeName` on the `drivers` table. All the data in the column will be lost.
  - Added the required column `vehicleNumber` to the `drivers` table without a default value. This is not possible if the table is not empty.

*/

-- 1. Add new required column with temporary default (safe for existing data)
ALTER TABLE "drivers" ADD COLUMN "vehicleNumber" TEXT NOT NULL DEFAULT 'TEMP-000';

-- 2. Add new optional columns with new names
ALTER TABLE "drivers" ADD COLUMN "businessName" TEXT;
ALTER TABLE "drivers" ADD COLUMN "representative" TEXT;

-- 3. Copy data from old columns to new columns (preserve existing data)
UPDATE "drivers" SET 
  "businessName" = "companyName",
  "representative" = "representativeName";

-- 4. Create index for new vehicleNumber column
CREATE INDEX "drivers_vehicleNumber_idx" ON "drivers"("vehicleNumber");

-- 5. Drop old columns
ALTER TABLE "drivers" DROP COLUMN "companyName";
ALTER TABLE "drivers" DROP COLUMN "email";
ALTER TABLE "drivers" DROP COLUMN "representativeName";

-- 6. Remove temporary default from vehicleNumber
ALTER TABLE "drivers" ALTER COLUMN "vehicleNumber" DROP DEFAULT;

-- Note: Manual data update will be needed for vehicleNumber field
-- Users should run: UPDATE drivers SET "vehicleNumber" = '<actual_vehicle_number>' WHERE "vehicleNumber" = 'TEMP-000';