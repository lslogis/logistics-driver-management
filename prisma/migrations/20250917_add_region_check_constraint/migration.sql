-- 센터요율 region 필드에 대한 체크 제약조건 추가
-- 기본운임의 경우 region이 필수, 경유운임의 경우 region은 빈 문자열

-- 1. 기존 빈 region 데이터 정리 (경유운임의 경우 null로 변경)
UPDATE center_fares 
SET region = NULL 
WHERE "fareType" = 'STOP_FEE' AND (region = '' OR region IS NULL);

-- 2. 기본운임인데 region이 빈 경우가 있다면 에러로 처리하기 위해 확인
-- (이 쿼리는 실행만 하고 결과가 있으면 수동으로 처리해야 함)
SELECT id, "loadingPointId", "vehicleType", region, "fareType"
FROM center_fares 
WHERE "fareType" = 'BASIC' AND (region = '' OR region IS NULL);

-- 3. 체크 제약조건 추가
-- 기본운임이면 region이 비어있지 않아야 하고, 경유운임이면 region이 null이어야 함
ALTER TABLE center_fares 
ADD CONSTRAINT chk_region_by_fare_type 
CHECK (
  ("fareType" = 'BASIC' AND region IS NOT NULL AND btrim(region) != '') OR
  ("fareType" = 'STOP_FEE' AND region IS NULL)
);
