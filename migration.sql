-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'ABSENCE', 'SUBSTITUTE');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PAID');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DISPATCHER', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'EXPORT', 'CONFIRM', 'ACTIVATE', 'DEACTIVATE', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('FIXED_DAILY', 'FIXED_MONTHLY', 'CONSIGNED_MONTHLY', 'CHARTER_PER_RIDE');

-- CreateEnum
CREATE TYPE "RateDetailType" AS ENUM ('BASE', 'CALL_FEE', 'WAYPOINT_FEE', 'SPECIAL');

-- CreateEnum
CREATE TYPE "SettlementItemType" AS ENUM ('TRIP', 'DEDUCTION', 'ADDITION', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'DISPATCHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "lastLogin" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "businessNumber" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "businessName" TEXT,
    "representative" TEXT,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loading_points" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "centerName" TEXT NOT NULL,
    "loadingPointName" TEXT NOT NULL,
    "lotAddress" TEXT,
    "roadAddress" TEXT,
    "manager1" TEXT,
    "manager2" TEXT,
    "phone1" TEXT,
    "phone2" TEXT,
    "remarks" TEXT,

    CONSTRAINT "loading_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "loadingPoint" TEXT NOT NULL,
    "distance" DOUBLE PRECISION,
    "driverFare" DECIMAL(12,2) NOT NULL,
    "billingFare" DECIMAL(12,2) NOT NULL,
    "weekdayPattern" INTEGER[],
    "defaultDriverId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "loadingPointId" TEXT,

    CONSTRAINT "route_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "driverId" TEXT,
    "centerId" TEXT,
    "routeType" TEXT NOT NULL DEFAULT 'charter',
    "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "driverFare" DECIMAL(12,2) NOT NULL,
    "billingFare" DECIMAL(12,2) NOT NULL,
    "absenceReason" TEXT,
    "deductionAmount" DECIMAL(12,2),
    "substituteDriverId" TEXT,
    "substituteFare" DECIMAL(12,2),
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" TEXT,
    "centerName" TEXT,
    "tonnage" TEXT,
    "vendor" TEXT,
    "regions" TEXT[],
    "totalStops" INTEGER,
    "driverName" TEXT,
    "vehicleNumber" TEXT,
    "contact" TEXT,
    "requester" TEXT,
    "baseFare" INTEGER,
    "callFee" INTEGER,
    "waypointFee" INTEGER,
    "extraFee" INTEGER,
    "totalFare" INTEGER,
    "extraReason" TEXT,
    "charterCost" INTEGER,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'DRAFT',
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "totalBaseFare" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAdditions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "confirmedAt" TIMESTAMPTZ(6),
    "confirmedBy" TEXT,
    "paidAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_items" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "tripId" TEXT,
    "type" "SettlementItemType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settlement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

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
    "validFrom" TIMESTAMPTZ(6),
    "validTo" TIMESTAMPTZ(6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rate_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_bases" (
    "id" TEXT NOT NULL,
    "centerName" TEXT NOT NULL,
    "tonnage" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "baseFare" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rate_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_addons" (
    "id" TEXT NOT NULL,
    "centerName" TEXT NOT NULL,
    "tonnage" TEXT NOT NULL,
    "perStop" INTEGER NOT NULL,
    "perWaypoint" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rate_addons_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "fixed_contracts" (
    "id" TEXT NOT NULL,
    "driverId" TEXT,
    "loadingPointId" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "centerContractType" "ContractType" NOT NULL,
    "driverContractType" "ContractType",
    "centerAmount" DECIMAL(12,2) NOT NULL,
    "driverAmount" DECIMAL(12,2),
    "operatingDays" INTEGER[],
    "startDate" DATE,
    "endDate" DATE,
    "specialConditions" TEXT,
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "fixed_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "center_fares" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "fare" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "center_fares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charter_requests" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isNegotiated" BOOLEAN NOT NULL DEFAULT false,
    "negotiatedFare" INTEGER,
    "baseFare" INTEGER,
    "regionFare" INTEGER,
    "stopFare" INTEGER,
    "extraFare" INTEGER,
    "totalFare" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverFare" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "charter_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charter_destinations" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "charter_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_token_key" ON "verificationtokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "verificationtokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "drivers_name_idx" ON "drivers"("name");

-- CreateIndex
CREATE INDEX "drivers_phone_idx" ON "drivers"("phone");

-- CreateIndex
CREATE INDEX "drivers_vehicleNumber_idx" ON "drivers"("vehicleNumber");

-- CreateIndex
CREATE INDEX "drivers_isActive_idx" ON "drivers"("isActive");

-- CreateIndex
CREATE INDEX "idx_driver_composite" ON "drivers"("name", "phone", "vehicleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_name_phone_vehicleNumber_key" ON "drivers"("name", "phone", "vehicleNumber");

-- CreateIndex
CREATE INDEX "loading_points_centerName_idx" ON "loading_points"("centerName");

-- CreateIndex
CREATE INDEX "loading_points_loadingPointName_idx" ON "loading_points"("loadingPointName");

-- CreateIndex
CREATE INDEX "loading_points_isActive_idx" ON "loading_points"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "route_templates_name_key" ON "route_templates"("name");

-- CreateIndex
CREATE INDEX "route_templates_name_idx" ON "route_templates"("name");

-- CreateIndex
CREATE INDEX "route_templates_loadingPoint_idx" ON "route_templates"("loadingPoint");

-- CreateIndex
CREATE INDEX "route_templates_loadingPointId_idx" ON "route_templates"("loadingPointId");

-- CreateIndex
CREATE INDEX "route_templates_defaultDriverId_idx" ON "route_templates"("defaultDriverId");

-- CreateIndex
CREATE INDEX "route_templates_isActive_idx" ON "route_templates"("isActive");

-- CreateIndex
CREATE INDEX "trips_driverId_date_idx" ON "trips"("driverId", "date");

-- CreateIndex
CREATE INDEX "trips_centerId_date_idx" ON "trips"("centerId", "date");

-- CreateIndex
CREATE INDEX "trips_date_status_idx" ON "trips"("date", "status");

-- CreateIndex
CREATE INDEX "trips_substituteDriverId_idx" ON "trips"("substituteDriverId");

-- CreateIndex
CREATE INDEX "trips_centerName_tonnage_idx" ON "trips"("centerName", "tonnage");

-- CreateIndex
CREATE INDEX "settlements_yearMonth_status_idx" ON "settlements"("yearMonth", "status");

-- CreateIndex
CREATE INDEX "settlements_driverId_status_idx" ON "settlements"("driverId", "status");

-- CreateIndex
CREATE INDEX "settlements_status_confirmedAt_idx" ON "settlements"("status", "confirmedAt");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_driverId_yearMonth_key" ON "settlements"("driverId", "yearMonth");

-- CreateIndex
CREATE INDEX "settlement_items_settlementId_type_idx" ON "settlement_items"("settlementId", "type");

-- CreateIndex
CREATE INDEX "settlement_items_tripId_idx" ON "settlement_items"("tripId");

-- CreateIndex
CREATE INDEX "settlement_items_date_idx" ON "settlement_items"("date");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

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
CREATE INDEX "rate_details_validFrom_validTo_idx" ON "rate_details"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "rate_details_isActive_idx" ON "rate_details"("isActive");

-- CreateIndex
CREATE INDEX "rate_base_center_tonnage_idx" ON "rate_bases"("centerName", "tonnage");

-- CreateIndex
CREATE UNIQUE INDEX "rate_bases_centerName_tonnage_region_key" ON "rate_bases"("centerName", "tonnage", "region");

-- CreateIndex
CREATE INDEX "rate_addons_center_tonnage_idx" ON "rate_addons"("centerName", "tonnage");

-- CreateIndex
CREATE UNIQUE INDEX "rate_addons_centerName_tonnage_key" ON "rate_addons"("centerName", "tonnage");

-- CreateIndex
CREATE UNIQUE INDEX "region_aliases_rawText_key" ON "region_aliases"("rawText");

-- CreateIndex
CREATE INDEX "region_aliases_normalizedText_idx" ON "region_aliases"("normalizedText");

-- CreateIndex
CREATE INDEX "region_aliases_rawText_idx" ON "region_aliases"("rawText");

-- CreateIndex
CREATE INDEX "fixed_contracts_driverId_isActive_idx" ON "fixed_contracts"("driverId", "isActive");

-- CreateIndex
CREATE INDEX "fixed_contracts_loadingPointId_isActive_idx" ON "fixed_contracts"("loadingPointId", "isActive");

-- CreateIndex
CREATE INDEX "fixed_contracts_centerContractType_idx" ON "fixed_contracts"("centerContractType");

-- CreateIndex
CREATE INDEX "fixed_contracts_driverContractType_idx" ON "fixed_contracts"("driverContractType");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_contracts_loadingPointId_routeName_key" ON "fixed_contracts"("loadingPointId", "routeName");

-- CreateIndex
CREATE INDEX "center_fares_centerId_vehicleType_idx" ON "center_fares"("centerId", "vehicleType");

-- CreateIndex
CREATE INDEX "center_fares_region_idx" ON "center_fares"("region");

-- CreateIndex
CREATE INDEX "center_fares_isActive_idx" ON "center_fares"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "center_fares_centerId_vehicleType_region_key" ON "center_fares"("centerId", "vehicleType", "region");

-- CreateIndex
CREATE INDEX "charter_requests_centerId_date_idx" ON "charter_requests"("centerId", "date");

-- CreateIndex
CREATE INDEX "charter_requests_driverId_date_idx" ON "charter_requests"("driverId", "date");

-- CreateIndex
CREATE INDEX "charter_requests_vehicleType_idx" ON "charter_requests"("vehicleType");

-- CreateIndex
CREATE INDEX "charter_requests_date_idx" ON "charter_requests"("date");

-- CreateIndex
CREATE INDEX "charter_requests_createdAt_idx" ON "charter_requests"("createdAt");

-- CreateIndex
CREATE INDEX "charter_destinations_requestId_idx" ON "charter_destinations"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "charter_destinations_requestId_order_key" ON "charter_destinations"("requestId", "order");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_templates" ADD CONSTRAINT "route_templates_defaultDriverId_fkey" FOREIGN KEY ("defaultDriverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_templates" ADD CONSTRAINT "route_templates_loadingPointId_fkey" FOREIGN KEY ("loadingPointId") REFERENCES "loading_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "loading_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_substituteDriverId_fkey" FOREIGN KEY ("substituteDriverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_masters" ADD CONSTRAINT "rate_masters_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_details" ADD CONSTRAINT "rate_details_rateMasterId_fkey" FOREIGN KEY ("rateMasterId") REFERENCES "rate_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_contracts" ADD CONSTRAINT "fixed_contracts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_contracts" ADD CONSTRAINT "fixed_contracts_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_contracts" ADD CONSTRAINT "fixed_contracts_loadingPointId_fkey" FOREIGN KEY ("loadingPointId") REFERENCES "loading_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charter_requests" ADD CONSTRAINT "charter_requests_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "loading_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charter_requests" ADD CONSTRAINT "charter_requests_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charter_requests" ADD CONSTRAINT "charter_requests_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charter_destinations" ADD CONSTRAINT "charter_destinations_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "charter_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

