-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('FIXED_DAILY', 'FIXED_MONTHLY', 'CONSIGNED_MONTHLY');

-- CreateTable
CREATE TABLE "fixed_routes" (
    "id" TEXT NOT NULL,
    "loadingPointId" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "assignedDriverId" TEXT,
    "weekdayPattern" INTEGER[],
    "contractType" "ContractType" NOT NULL,
    "revenueMonthlyWithExpense" DECIMAL(12,2),
    "revenueDaily" DECIMAL(12,2),
    "revenueMonthly" DECIMAL(12,2),
    "costMonthlyWithExpense" DECIMAL(12,2),
    "costDaily" DECIMAL(12,2),
    "costMonthly" DECIMAL(12,2),
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "fixed_routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fixed_routes_loadingPointId_idx" ON "fixed_routes"("loadingPointId");

-- CreateIndex
CREATE INDEX "fixed_routes_routeName_idx" ON "fixed_routes"("routeName");

-- CreateIndex
CREATE INDEX "fixed_routes_assignedDriverId_idx" ON "fixed_routes"("assignedDriverId");

-- CreateIndex
CREATE INDEX "fixed_routes_contractType_idx" ON "fixed_routes"("contractType");

-- CreateIndex
CREATE INDEX "fixed_routes_isActive_idx" ON "fixed_routes"("isActive");

-- AddForeignKey
ALTER TABLE "fixed_routes" ADD CONSTRAINT "fixed_routes_loadingPointId_fkey" FOREIGN KEY ("loadingPointId") REFERENCES "loading_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_routes" ADD CONSTRAINT "fixed_routes_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_routes" ADD CONSTRAINT "fixed_routes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;