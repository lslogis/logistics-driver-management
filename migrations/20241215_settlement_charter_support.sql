-- Settlement Charter Support Migration
-- Adds support for Charter-based settlements alongside Trip-based settlements
-- This is a non-breaking change that maintains backward compatibility

-- 1. Add charterId column to settlement_items table (nullable to maintain backward compatibility)
ALTER TABLE "settlement_items" 
ADD COLUMN IF NOT EXISTS "charterId" TEXT;

-- 2. Create index for charterId for performance
CREATE INDEX IF NOT EXISTS "settlement_items_charterId_idx" 
ON "settlement_items"("charterId");

-- 3. Add foreign key constraint to CharterRequest table
-- Note: This is optional and should only be added if CharterRequest table exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'charter_requests'
    ) THEN
        ALTER TABLE "settlement_items" 
        ADD CONSTRAINT "settlement_items_charterId_fkey" 
        FOREIGN KEY ("charterId") 
        REFERENCES "charter_requests"("id") 
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. Update Settlement table to support both trips and charters
-- Add totalCharters column (for tracking charter count, similar to totalTrips)
ALTER TABLE "settlements" 
ADD COLUMN IF NOT EXISTS "totalCharters" INTEGER DEFAULT 0;

-- 5. Add a notes column to settlements for migration tracking
ALTER TABLE "settlements" 
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- 6. Create a view for combined trip/charter settlements
CREATE OR REPLACE VIEW settlement_combined_view AS
SELECT 
    s.id,
    s."yearMonth",
    s."driverId",
    s.status,
    s."totalTrips",
    s."totalCharters",
    s."totalBaseFare",
    s."totalDeductions",
    s."totalAdditions",
    s."finalAmount",
    s."confirmedAt",
    s."confirmedBy",
    s."paidAt",
    s.notes,
    s."createdAt",
    s."updatedAt",
    d.name as driver_name,
    COUNT(DISTINCT si."tripId") as actual_trips,
    COUNT(DISTINCT si."charterId") as actual_charters
FROM settlements s
JOIN drivers d ON s."driverId" = d.id
LEFT JOIN settlement_items si ON s.id = si."settlementId"
GROUP BY 
    s.id, s."yearMonth", s."driverId", s.status,
    s."totalTrips", s."totalCharters", s."totalBaseFare",
    s."totalDeductions", s."totalAdditions", s."finalAmount",
    s."confirmedAt", s."confirmedBy", s."paidAt", s.notes,
    s."createdAt", s."updatedAt", d.name;

-- 7. Add comment to track migration
COMMENT ON COLUMN "settlement_items"."charterId" IS 'Charter Request ID for charter-based settlements (added for Trip to Charter migration)';
COMMENT ON COLUMN "settlements"."totalCharters" IS 'Total number of charters in this settlement (added for Trip to Charter migration)';

-- Migration completed successfully
-- This migration is backward compatible and does not break existing Trip-based settlements