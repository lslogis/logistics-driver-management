/*
  Warnings:

  - You are about to drop the column `customRoute` on the `trips` table. All the data in the column will be lost.
  - You are about to drop the column `routeTemplateId` on the `trips` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleNumber` on the `trips` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "trips" DROP CONSTRAINT "trips_routeTemplateId_fkey";

-- DropIndex
DROP INDEX "trips_routeTemplateId_idx";

-- AlterTable
ALTER TABLE "trips" DROP COLUMN "customRoute",
DROP COLUMN "routeTemplateId",
DROP COLUMN "vehicleNumber",
ALTER COLUMN "routeType" SET DEFAULT 'charter';
