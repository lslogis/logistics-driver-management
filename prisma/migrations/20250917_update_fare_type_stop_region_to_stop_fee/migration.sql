-- Update FareType enum: STOP_REGION -> STOP_FEE
-- 기존 데이터를 새로운 enum 값으로 마이그레이션

-- 1. 임시 enum 생성
CREATE TYPE "FareType_new" AS ENUM ('BASIC', 'STOP_FEE');

-- 2. 기존 데이터 변경
UPDATE "center_fares" SET "fareType" = 'STOP_FEE'::text::"FareType_new" WHERE "fareType" = 'STOP_REGION';

-- 3. 테이블 컬럼 타입 변경
ALTER TABLE "center_fares" ALTER COLUMN "fareType" TYPE "FareType_new" USING ("fareType"::text::"FareType_new");

-- 4. 기존 enum 삭제하고 새 enum으로 대체
DROP TYPE "FareType";
ALTER TYPE "FareType_new" RENAME TO "FareType";