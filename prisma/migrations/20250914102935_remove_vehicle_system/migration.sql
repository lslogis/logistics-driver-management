/*
  Warnings:

  - You are about to drop the column `vehicleId` on the `trips` table. All the data in the column will be lost.
  - You are about to drop the `vehicles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "trips" DROP CONSTRAINT "trips_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_driverId_fkey";

-- AlterTable
ALTER TABLE "trips" DROP COLUMN "vehicleId";

-- DropTable
DROP TABLE "vehicles";

-- DropEnum
DROP TYPE "VehicleOwnership";
