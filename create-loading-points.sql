-- Create loading_points table
CREATE TABLE IF NOT EXISTS "loading_points" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loading_points_pkey" PRIMARY KEY ("id")
);

-- Create unique index on name
CREATE UNIQUE INDEX IF NOT EXISTS "loading_points_name_key" ON "loading_points"("name");

-- Create other indexes
CREATE INDEX IF NOT EXISTS "loading_points_name_idx" ON "loading_points"("name");
CREATE INDEX IF NOT EXISTS "loading_points_category_idx" ON "loading_points"("category");
CREATE INDEX IF NOT EXISTS "loading_points_isActive_idx" ON "loading_points"("isActive");

-- Add loadingPointId column to route_templates if it doesn't exist
ALTER TABLE "route_templates" 
ADD COLUMN IF NOT EXISTS "loadingPointId" TEXT;

-- Create foreign key constraint
ALTER TABLE "route_templates" 
ADD CONSTRAINT IF NOT EXISTS "route_templates_loadingPointId_fkey" 
FOREIGN KEY ("loadingPointId") REFERENCES "loading_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS "route_templates_loadingPointId_idx" ON "route_templates"("loadingPointId");

-- Insert sample data
INSERT INTO "loading_points" ("id", "name", "address", "category", "isActive", "usageCount", "createdAt", "updatedAt") 
VALUES 
    (gen_random_uuid(), '서울 물류센터', '서울시 강서구', '물류센터', true, 0, NOW(), NOW()),
    (gen_random_uuid(), '부산항 컨테이너 터미널', '부산광역시 중구', '항만', true, 0, NOW(), NOW()),
    (gen_random_uuid(), '인천공항 화물터미널', '인천시 중구', '터미널', true, 0, NOW(), NOW()),
    (gen_random_uuid(), '경기 제조공장', '경기도 평택시', '공장', true, 0, NOW(), NOW()),
    (gen_random_uuid(), '대구 유통창고', '대구광역시 달서구', '창고', true, 0, NOW(), NOW()),
    (gen_random_uuid(), '광주 농산물 집하장', '광주광역시 서구', '집하장', true, 0, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;