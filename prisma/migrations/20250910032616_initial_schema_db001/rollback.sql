-- Rollback script for initial_schema_db001 (Task: DB-001)
-- Generated: 2025-09-10
-- 
-- IMPORTANT: Review this script before executing!
-- This script reverses the changes made by migration.sql
--
-- To execute rollback:
-- 1. docker-compose exec -T db psql -U postgres -d logistics_db < prisma/migrations/20250910032616_initial_schema_db001/rollback.sql
-- 2. Delete migration directory: rm -rf prisma/migrations/20250910032616_initial_schema_db001
-- 3. Update Prisma schema to previous state and regenerate client

-- Drop all foreign key constraints first
ALTER TABLE IF EXISTS "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
ALTER TABLE IF EXISTS "settlement_items" DROP CONSTRAINT IF EXISTS "settlement_items_tripId_fkey";
ALTER TABLE IF EXISTS "settlement_items" DROP CONSTRAINT IF EXISTS "settlement_items_settlementId_fkey";
ALTER TABLE IF EXISTS "settlements" DROP CONSTRAINT IF EXISTS "settlements_confirmedBy_fkey";
ALTER TABLE IF EXISTS "settlements" DROP CONSTRAINT IF EXISTS "settlements_createdBy_fkey";
ALTER TABLE IF EXISTS "settlements" DROP CONSTRAINT IF EXISTS "settlements_driverId_fkey";
ALTER TABLE IF EXISTS "trips" DROP CONSTRAINT IF EXISTS "trips_substituteDriverId_fkey";
ALTER TABLE IF EXISTS "trips" DROP CONSTRAINT IF EXISTS "trips_routeTemplateId_fkey";
ALTER TABLE IF EXISTS "trips" DROP CONSTRAINT IF EXISTS "trips_vehicleId_fkey";
ALTER TABLE IF EXISTS "trips" DROP CONSTRAINT IF EXISTS "trips_driverId_fkey";
ALTER TABLE IF EXISTS "route_templates" DROP CONSTRAINT IF EXISTS "route_templates_defaultDriverId_fkey";
ALTER TABLE IF EXISTS "vehicles" DROP CONSTRAINT IF EXISTS "vehicles_driverId_fkey";
ALTER TABLE IF EXISTS "sessions" DROP CONSTRAINT IF EXISTS "sessions_userId_fkey";
ALTER TABLE IF EXISTS "accounts" DROP CONSTRAINT IF EXISTS "accounts_userId_fkey";

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS "audit_logs";
DROP TABLE IF EXISTS "settlement_items";
DROP TABLE IF EXISTS "settlements";
DROP TABLE IF EXISTS "trips";
DROP TABLE IF EXISTS "route_templates";
DROP TABLE IF EXISTS "vehicles";
DROP TABLE IF EXISTS "drivers";
DROP TABLE IF EXISTS "verificationtokens";
DROP TABLE IF EXISTS "sessions";
DROP TABLE IF EXISTS "accounts";
DROP TABLE IF EXISTS "users";

-- Drop all custom types
DROP TYPE IF EXISTS "SettlementItemType";
DROP TYPE IF EXISTS "AuditAction";
DROP TYPE IF EXISTS "UserRole";
DROP TYPE IF EXISTS "SettlementStatus";
DROP TYPE IF EXISTS "TripStatus";
DROP TYPE IF EXISTS "VehicleOwnership";

-- Note: Extensions and timezone settings are preserved as they may be used by other applications