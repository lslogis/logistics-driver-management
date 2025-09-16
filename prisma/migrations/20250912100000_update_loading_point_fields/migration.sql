-- CreateMigration: Update LoadingPoint schema to new field structure
-- This migration preserves existing data while changing the schema structure

BEGIN;

-- Step 1: Add new columns to loading_points table
ALTER TABLE "loading_points" 
ADD COLUMN "centerName" TEXT,
ADD COLUMN "loadingPointName" TEXT,
ADD COLUMN "lotAddress" TEXT,
ADD COLUMN "roadAddress" TEXT,  
ADD COLUMN "manager1" TEXT,
ADD COLUMN "manager2" TEXT,
ADD COLUMN "phone1" TEXT,
ADD COLUMN "phone2" TEXT;

-- Step 2: Migrate existing data from 'name' to 'centerName' and 'loadingPointName'
-- For existing data, we'll use the 'name' field for both centerName and loadingPointName
UPDATE "loading_points" 
SET "centerName" = "name", 
    "loadingPointName" = "name"
WHERE "centerName" IS NULL;

-- Step 3: Migrate existing 'address' data to 'lotAddress' (assuming most are lot addresses)
UPDATE "loading_points" 
SET "lotAddress" = "address"
WHERE "address" IS NOT NULL AND "lotAddress" IS NULL;

-- Step 4: Make the new required columns NOT NULL after data migration
ALTER TABLE "loading_points" 
ALTER COLUMN "centerName" SET NOT NULL,
ALTER COLUMN "loadingPointName" SET NOT NULL;

-- Step 5: Drop the old columns that are no longer needed
ALTER TABLE "loading_points" 
DROP COLUMN "name",
DROP COLUMN "address",
DROP COLUMN "category",
DROP COLUMN "usageCount";

-- Step 6: Update indexes - drop old ones and create new ones
DROP INDEX IF EXISTS "loading_points_name_idx";
DROP INDEX IF EXISTS "loading_points_category_idx";

CREATE INDEX "loading_points_centerName_idx" ON "loading_points"("centerName");
CREATE INDEX "loading_points_loadingPointName_idx" ON "loading_points"("loadingPointName");

-- Step 7: Update any existing unique constraints
-- Remove the old unique constraint on 'name' if it exists
-- Note: We're not adding unique constraint on new fields as multiple loading points can have same center/point names

COMMIT;