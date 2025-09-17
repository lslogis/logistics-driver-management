-- 용차 관리 시스템 추가 마이그레이션
-- 날짜: 2024-11-15
-- 설명: CenterFare, CharterRequest, CharterDestination 테이블 추가

-- 센터 요율 테이블 생성
CREATE TABLE IF NOT EXISTS "CenterFare" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "fare" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "CenterFare_pkey" PRIMARY KEY ("id")
);

-- 용차 요청 테이블 생성
CREATE TABLE IF NOT EXISTS "CharterRequest" (
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
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "CharterRequest_pkey" PRIMARY KEY ("id")
);

-- 용차 목적지 테이블 생성
CREATE TABLE IF NOT EXISTS "CharterDestination" (
    "id" TEXT NOT NULL,
    "charterRequestId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharterDestination_pkey" PRIMARY KEY ("id")
);

-- 유니크 인덱스 생성
CREATE UNIQUE INDEX IF NOT EXISTS "CenterFare_centerId_vehicleType_region_key" 
ON "CenterFare"("centerId", "vehicleType", "region");

CREATE UNIQUE INDEX IF NOT EXISTS "CharterDestination_charterRequestId_order_key" 
ON "CharterDestination"("charterRequestId", "order");

-- 일반 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS "CenterFare_centerId_idx" ON "CenterFare"("centerId");
CREATE INDEX IF NOT EXISTS "CenterFare_vehicleType_idx" ON "CenterFare"("vehicleType");
CREATE INDEX IF NOT EXISTS "CenterFare_region_idx" ON "CenterFare"("region");
CREATE INDEX IF NOT EXISTS "CenterFare_isActive_idx" ON "CenterFare"("isActive");

CREATE INDEX IF NOT EXISTS "CharterRequest_centerId_idx" ON "CharterRequest"("centerId");
CREATE INDEX IF NOT EXISTS "CharterRequest_driverId_idx" ON "CharterRequest"("driverId");
CREATE INDEX IF NOT EXISTS "CharterRequest_date_idx" ON "CharterRequest"("date");
CREATE INDEX IF NOT EXISTS "CharterRequest_vehicleType_idx" ON "CharterRequest"("vehicleType");
CREATE INDEX IF NOT EXISTS "CharterRequest_createdAt_idx" ON "CharterRequest"("createdAt");

CREATE INDEX IF NOT EXISTS "CharterDestination_charterRequestId_idx" ON "CharterDestination"("charterRequestId");

-- 외래키 제약조건 추가
ALTER TABLE "CenterFare" 
ADD CONSTRAINT IF NOT EXISTS "CenterFare_centerId_fkey" 
FOREIGN KEY ("centerId") REFERENCES "loadingPoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CenterFare" 
ADD CONSTRAINT IF NOT EXISTS "CenterFare_createdBy_fkey" 
FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CenterFare" 
ADD CONSTRAINT IF NOT EXISTS "CenterFare_updatedBy_fkey" 
FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CharterRequest" 
ADD CONSTRAINT IF NOT EXISTS "CharterRequest_centerId_fkey" 
FOREIGN KEY ("centerId") REFERENCES "loadingPoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CharterRequest" 
ADD CONSTRAINT IF NOT EXISTS "CharterRequest_driverId_fkey" 
FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CharterRequest" 
ADD CONSTRAINT IF NOT EXISTS "CharterRequest_createdBy_fkey" 
FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CharterRequest" 
ADD CONSTRAINT IF NOT EXISTS "CharterRequest_updatedBy_fkey" 
FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CharterDestination" 
ADD CONSTRAINT IF NOT EXISTS "CharterDestination_charterRequestId_fkey" 
FOREIGN KEY ("charterRequestId") REFERENCES "CharterRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- User 테이블에 charter 관련 관계 추가 (이미 존재할 수 있으므로 조건부)
-- 이 부분은 Prisma가 자동으로 처리하므로 별도 작업 불필요

-- 마이그레이션 완료 로그
INSERT INTO "audit_logs" ("id", "userId", "action", "resource", "resourceId", "data", "metadata", "createdAt")
VALUES (
    'charter_migration_' || extract(epoch from now()),
    'system',
    'CREATE',
    'Migration',
    '20241115_add_charter_management',
    '{"description": "Added charter management system tables", "tables": ["CenterFare", "CharterRequest", "CharterDestination"]}',
    '{"source": "migration_script", "version": "1.0.0"}',
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;