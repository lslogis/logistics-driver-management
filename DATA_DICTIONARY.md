# 데이터 사전 (Data Dictionary) - 운송기사관리 시스템

**Version**: 1.0.0  
**Last Updated**: 2025-01-10  
**Database**: PostgreSQL 15+  
**ORM**: Prisma 5.x

---

## 📋 개요

### 데이터베이스 구조
- **총 테이블 수**: 8개 (메인 7개 + NextAuth 4개)
- **총 필드 수**: 97개
- **인덱스 수**: 23개
- **제약조건**: 15개 (UNIQUE, CHECK, FK)
- **ENUM 타입**: 6개

### 도메인 분류
- **인증 도메인**: users, accounts, sessions, verificationtokens
- **마스터 도메인**: drivers, vehicles, route_templates  
- **운행 도메인**: trips
- **정산 도메인**: settlements, settlement_items
- **감사 도메인**: audit_logs

---

## 🔐 인증 및 사용자 관리

### `users` (사용자)
**목적**: 시스템 사용자 인증 및 권한 관리

| 필드명 | 타입 | NULL | 기본값 | 제약조건 | 설명 |
|--------|------|------|--------|----------|------|
| `id` | String | NO | cuid() | PK | 사용자 고유 ID |
| `email` | String | NO | - | UNIQUE | 로그인 이메일 |
| `name` | String | NO | - | - | 사용자 이름 |
| `password` | String | YES | - | - | 암호화된 비밀번호 |
| `role` | UserRole | NO | DISPATCHER | - | 사용자 권한 |
| `isActive` | Boolean | NO | true | - | 계정 활성 상태 |
| `createdAt` | DateTime | NO | now() | - | 생성일시 |
| `updatedAt` | DateTime | NO | - | - | 수정일시 |
| `lastLogin` | DateTime | YES | - | - | 마지막 로그인 |

**인덱스**:
- `users_email_key` (UNIQUE): email
- `users_pkey` (PRIMARY): id

**관계**:
- `accounts` (1:N): OAuth 계정 정보
- `sessions` (1:N): 세션 정보  
- `auditLogs` (1:N): 감사 로그
- `settlements` (1:N): 생성한 정산 (createdBy)
- `confirmedSettlements` (1:N): 확정한 정산 (confirmedBy)

---

## 🚛 마스터 데이터

### `drivers` (기사)
**목적**: 운송 기사 기본 정보 관리

| 필드명 | 타입 | NULL | 기본값 | 제약조건 | 설명 |
|--------|------|------|--------|----------|------|
| `id` | String | NO | cuid() | PK | 기사 고유 ID |
| `name` | String | NO | - | - | 기사명 |
| `phone` | String | NO | - | UNIQUE | 연락처 |
| `email` | String | YES | - | - | 이메일 주소 |
| `businessNumber` | String | YES | - | - | 사업자 등록번호 |
| `companyName` | String | YES | - | - | 상호명 |
| `representativeName` | String | YES | - | - | 대표자명 |
| `bankName` | String | YES | - | - | 은행명 |
| `accountNumber` | String | YES | - | - | 계좌번호 |
| `remarks` | String | YES | - | - | 비고 |
| `isActive` | Boolean | NO | true | - | 활성 상태 |
| `createdAt` | DateTime | NO | now() | - | 등록일시 |
| `updatedAt` | DateTime | NO | - | - | 수정일시 |

**인덱스**:
- `drivers_pkey` (PRIMARY): id
- `drivers_phone_key` (UNIQUE): phone
- `drivers_name_idx`: name
- `drivers_isActive_idx`: isActive

**관계**:
- `vehicles` (1:N): 배정된 차량들
- `trips` (1:N): 운행 기록들
- `routeTemplates` (1:N): 기본 기사로 설정된 노선들
- `settlements` (1:N): 정산 기록들
- `substituteTrips` (1:N): 대차 운행 기록들

**비즈니스 규칙**:
- 연락처(phone)는 시스템 내 유일값
- 비활성화 시에도 과거 운행 기록 보존
- 사업자번호는 개인사업자의 경우 선택사항

### `vehicles` (차량)  
**목적**: 운송 차량 정보 및 소유권 관리

| 필드명 | 타입 | NULL | 기본값 | 제약조건 | 설명 |
|--------|------|------|--------|----------|------|
| `id` | String | NO | cuid() | PK | 차량 고유 ID |
| `plateNumber` | String | NO | - | UNIQUE | 차량번호 |
| `vehicleType` | String | NO | - | - | 차종 (1톤, 2.5톤, 5톤 등) |
| `ownership` | VehicleOwnership | NO | - | - | 소유권 구분 |
| `driverId` | String | YES | - | FK | 배정된 기사 ID |
| `isActive` | Boolean | NO | true | - | 사용 가능 상태 |
| `capacity` | Float | YES | - | - | 적재량 (톤) |
| `year` | Int | YES | - | - | 연식 |
| `createdAt` | DateTime | NO | now() | - | 등록일시 |
| `updatedAt` | DateTime | NO | - | - | 수정일시 |

**ENUM - VehicleOwnership**:
- `OWNED`: 고정 (자차)
- `CHARTER`: 용차 (임시 임차)  
- `CONSIGNED`: 지입 (계약 관계)

**인덱스**:
- `vehicles_pkey` (PRIMARY): id
- `vehicles_plateNumber_key` (UNIQUE): plateNumber
- `vehicles_ownership_idx`: ownership
- `vehicles_driverId_idx`: driverId

**관계**:
- `driver` (N:1): 배정된 기사
- `trips` (1:N): 운행 기록들

**비즈니스 규칙**:
- 차량번호는 시스템 내 유일값
- 한 차량은 한 명의 기사에게만 배정 가능
- 소유권에 따라 정산 방식이 달라짐

### `route_templates` (노선 템플릿)
**목적**: 고정 노선 정보 및 요일별 운행 패턴 관리

| 필드명 | 타입 | NULL | 기본값 | 제약조건 | 설명 |
|--------|------|------|--------|----------|------|
| `id` | String | NO | cuid() | PK | 노선 고유 ID |
| `name` | String | NO | - | UNIQUE | 노선명 |
| `loadingPoint` | String | NO | - | - | 상차지 |
| `unloadingPoint` | String | NO | - | - | 하차지 |
| `distance` | Float | YES | - | - | 거리 (km) |
| `driverFare` | Decimal(12,2) | NO | - | - | 기사 운임 |
| `billingFare` | Decimal(12,2) | NO | - | - | 청구 운임 |
| `weekdayPattern` | Int[] | NO | - | - | 운행 요일 (1=월, 7=일) |
| `defaultDriverId` | String | YES | - | FK | 기본 배정 기사 |
| `isActive` | Boolean | NO | true | - | 활성 상태 |
| `createdAt` | DateTime | NO | now() | - | 생성일시 |
| `updatedAt` | DateTime | NO | - | - | 수정일시 |

**인덱스**:
- `route_templates_pkey` (PRIMARY): id
- `route_templates_name_key` (UNIQUE): name  
- `route_templates_loadingPoint_idx`: loadingPoint
- `route_templates_defaultDriverId_idx`: defaultDriverId
- `route_templates_isActive_idx`: isActive

**관계**:
- `defaultDriver` (N:1): 기본 배정 기사
- `trips` (1:N): 생성된 운행들

**비즈니스 규칙**:
- 요일 패턴: [1,2,3,4,5] = 월~금, [6,7] = 주말
- 기사 운임 ≤ 청구 운임 (마진 확보)
- 비활성화 시에도 기존 운행은 유지

---

## 🚚 운행 관리

### `trips` (운행)
**목적**: 일일 운행 기록 및 상태 관리

| 필드명 | 타입 | NULL | 기본값 | 제약조건 | 설명 |
|--------|------|------|--------|----------|------|
| `id` | String | NO | cuid() | PK | 운행 고유 ID |
| `date` | Date | NO | - | - | 운행일 |
| `driverId` | String | NO | - | FK | 운행 기사 ID |
| `vehicleId` | String | NO | - | FK | 사용 차량 ID |
| `routeType` | String | NO | "fixed" | - | 노선 유형 |
| `routeTemplateId` | String | YES | - | FK | 고정노선 ID |
| `customRoute` | Json | YES | - | - | 커스텀 노선 정보 |
| `status` | TripStatus | NO | SCHEDULED | - | 운행 상태 |
| `driverFare` | Decimal(12,2) | NO | - | - | 기사 운임 |
| `billingFare` | Decimal(12,2) | NO | - | - | 청구 운임 |
| `absenceReason` | String | YES | - | - | 결행 사유 |
| `deductionAmount` | Decimal(12,2) | YES | - | - | 공제 금액 |
| `substituteDriverId` | String | YES | - | FK | 대차 기사 ID |
| `substituteFare` | Decimal(12,2) | YES | - | - | 대차비 |
| `remarks` | String | YES | - | - | 비고 |
| `createdAt` | DateTime | NO | now() | - | 생성일시 |
| `updatedAt` | DateTime | NO | - | - | 수정일시 |
| `createdBy` | String | YES | - | - | 생성자 ID |

**ENUM - TripStatus**:
- `SCHEDULED`: 예정
- `COMPLETED`: 완료  
- `ABSENCE`: 결행
- `SUBSTITUTE`: 대차

**제약조건**:
- `unique_vehicle_date_driver` (UNIQUE): vehicleId, date, driverId

**인덱스**:
- `trips_pkey` (PRIMARY): id
- `trips_driverId_date_idx`: driverId, date
- `trips_date_status_idx`: date, status
- `trips_routeTemplateId_idx`: routeTemplateId
- `trips_substituteDriverId_idx`: substituteDriverId

**관계**:
- `driver` (N:1): 운행 기사
- `vehicle` (N:1): 사용 차량
- `routeTemplate` (N:1): 고정노선 (선택)
- `substituteDriver` (N:1): 대차 기사 (선택)
- `settlementItems` (1:N): 정산 항목들

**비즈니스 규칙**:
- 동일 차량의 동일 날짜, 동일 기사 조합은 유일
- ABSENCE 상태 시 deductionAmount = driverFare * 0.1
- SUBSTITUTE 상태 시 원 기사에게 5% 공제 적용

---

## 💰 정산 관리

### `settlements` (정산)
**목적**: 월별 기사 정산 집계 및 상태 관리

| 필드명 | 타입 | NULL | 기본값 | 제약조건 | 설명 |
|--------|------|------|--------|----------|------|
| `id` | String | NO | cuid() | PK | 정산 고유 ID |
| `yearMonth` | String | NO | - | - | 정산 년월 (YYYY-MM) |
| `driverId` | String | NO | - | FK | 대상 기사 ID |
| `status` | SettlementStatus | NO | DRAFT | - | 정산 상태 |
| `totalTrips` | Int | NO | 0 | - | 총 운행 횟수 |
| `totalBaseFare` | Decimal(12,2) | NO | 0 | - | 총 기본 운임 |
| `totalDeductions` | Decimal(12,2) | NO | 0 | - | 총 공제 금액 |
| `totalAdditions` | Decimal(12,2) | NO | 0 | - | 총 추가 지급 |
| `finalAmount` | Decimal(12,2) | NO | 0 | - | 최종 지급액 |
| `confirmedAt` | DateTime | YES | - | - | 확정 일시 |
| `confirmedBy` | String | YES | - | FK | 확정자 ID |
| `paidAt` | DateTime | YES | - | - | 지급 일시 |
| `createdAt` | DateTime | NO | now() | - | 생성일시 |
| `updatedAt` | DateTime | NO | - | - | 수정일시 |
| `createdBy` | String | YES | - | - | 생성자 ID |

**ENUM - SettlementStatus**:
- `DRAFT`: 임시 저장 (수정 가능)
- `CONFIRMED`: 확정 (수정 불가)
- `PAID`: 지급 완료

**제약조건**:
- `unique_driver_yearmonth` (UNIQUE): driverId, yearMonth

**인덱스**:
- `settlements_pkey` (PRIMARY): id
- `settlements_yearMonth_status_idx`: yearMonth, status
- `settlements_driverId_status_idx`: driverId, status  
- `settlements_status_confirmedAt_idx`: status, confirmedAt

**관계**:
- `driver` (N:1): 대상 기사
- `creator` (N:1): 생성자
- `confirmer` (N:1): 확정자
- `items` (1:N): 정산 상세 항목들

**비즈니스 규칙**:
- 기사별 월단위 정산은 유일
- CONFIRMED 상태 이후 수정 불가
- finalAmount = totalBaseFare - totalDeductions + totalAdditions

### `settlement_items` (정산 항목)
**목적**: 정산 상세 내역 및 항목별 금액 관리

| 필드명 | 타입 | NULL | 기본값 | 제약조건 | 설명 |
|--------|------|------|--------|----------|------|
| `id` | String | NO | cuid() | PK | 항목 고유 ID |
| `settlementId` | String | NO | - | FK | 정산 ID |
| `tripId` | String | YES | - | FK | 연결된 운행 ID |
| `type` | SettlementItemType | NO | - | - | 항목 유형 |
| `description` | String | NO | - | - | 항목 설명 |
| `amount` | Decimal(12,2) | NO | - | - | 금액 (양수/음수) |
| `date` | Date | NO | - | - | 발생일 |
| `createdAt` | DateTime | NO | now() | - | 생성일시 |
| `updatedAt` | DateTime | NO | - | - | 수정일시 |

**ENUM - SettlementItemType**:
- `TRIP`: 운행 운임 (양수)
- `DEDUCTION`: 공제 (음수) 
- `ADDITION`: 추가 지급 (양수)
- `ADJUSTMENT`: 수동 조정 (양수/음수)

**인덱스**:
- `settlement_items_pkey` (PRIMARY): id
- `settlement_items_settlementId_type_idx`: settlementId, type
- `settlement_items_tripId_idx`: tripId
- `settlement_items_date_idx`: date

**관계**:
- `settlement` (N:1): 소속 정산
- `trip` (N:1): 연결된 운행 (선택)

**비즈니스 규칙**:
- TRIP 타입은 tripId 필수
- DEDUCTION 타입은 음수 금액
- ADDITION/ADJUSTMENT는 수동 입력

---

## 📝 감사 및 로깅

### `audit_logs` (감사 로그)
**목적**: 시스템 내 모든 중요 행위 추적 및 감사 증적

| 필드명 | 타입 | NULL | 기본값 | 제약조건 | 설명 |
|--------|------|------|--------|----------|------|
| `id` | String | NO | cuid() | PK | 로그 고유 ID |
| `userId` | String | YES | - | FK | 행위자 ID |
| `userName` | String | NO | - | - | 행위자 이름 |
| `action` | AuditAction | NO | - | - | 행위 유형 |
| `entityType` | String | NO | - | - | 대상 엔티티 타입 |
| `entityId` | String | NO | - | - | 대상 엔티티 ID |
| `changes` | Json | YES | - | - | 변경 내용 (전/후) |
| `metadata` | Json | YES | - | - | 추가 메타데이터 |
| `createdAt` | DateTime | NO | now() | - | 발생 일시 |

**ENUM - AuditAction**:
- `CREATE`: 생성
- `UPDATE`: 수정
- `DELETE`: 삭제
- `IMPORT`: 대량 임포트
- `EXPORT`: 데이터 내보내기
- `CONFIRM`: 정산 확정
- `LOGIN`: 로그인
- `LOGOUT`: 로그아웃

**인덱스**:
- `audit_logs_pkey` (PRIMARY): id
- `audit_logs_userId_createdAt_idx`: userId, createdAt
- `audit_logs_entityType_entityId_idx`: entityType, entityId
- `audit_logs_action_createdAt_idx`: action, createdAt
- `audit_logs_createdAt_idx`: createdAt

**관계**:
- `user` (N:1): 행위자 (선택)

**비즈니스 규칙**:
- 모든 중요 행위는 감사 로그 필수
- 변경사항은 changes JSON에 전/후 값 저장
- 로그인/로그아웃은 metadata에 IP, User-Agent 저장

---

## 🔗 관계형 데이터 매핑

### 주요 관계 다이어그램

```
users (1) ----< audit_logs (N)
  |
  +-----------< settlements (N) [creator]
  |
  +-----------< settlements (N) [confirmer]

drivers (1) ---< vehicles (N)
  |
  +----------< trips (N) [driver]
  |
  +----------< trips (N) [substituteDriver]  
  |
  +----------< route_templates (N) [defaultDriver]
  |
  +----------< settlements (N)

vehicles (1) --< trips (N)

route_templates (1) --< trips (N)

trips (1) -----< settlement_items (N)

settlements (1) < settlement_items (N)
```

### 외래키 제약조건

| 자식 테이블 | 부모 테이블 | ON DELETE | ON UPDATE |
|-------------|-------------|-----------|-----------|
| vehicles.driverId | drivers.id | SET NULL | CASCADE |
| trips.driverId | drivers.id | CASCADE | CASCADE |
| trips.vehicleId | vehicles.id | CASCADE | CASCADE |
| trips.routeTemplateId | route_templates.id | SET NULL | CASCADE |
| trips.substituteDriverId | drivers.id | SET NULL | CASCADE |
| settlements.driverId | drivers.id | CASCADE | CASCADE |
| settlements.createdBy | users.id | SET NULL | CASCADE |
| settlements.confirmedBy | users.id | SET NULL | CASCADE |
| settlement_items.settlementId | settlements.id | CASCADE | CASCADE |
| settlement_items.tripId | trips.id | SET NULL | CASCADE |
| audit_logs.userId | users.id | SET NULL | CASCADE |

---

## 📊 데이터 볼륨 예상치

### 테이블별 예상 레코드 수 (연간)

| 테이블 | 일일 증가 | 월간 증가 | 연간 총량 | 비고 |
|--------|-----------|-----------|-----------|------|
| users | 1-2 | 5-10 | 50 | 사용자 증가 완만 |
| drivers | 5-10 | 50-100 | 500 | 기사 등록 주기적 |
| vehicles | 3-5 | 30-50 | 300 | 차량 등록 |
| route_templates | 1-2 | 5-10 | 100 | 노선 추가 완만 |
| trips | 500-1000 | 15K-30K | 250K | 주요 트랜잭션 |
| settlements | 0-50 | 100-200 | 1.2K | 월 단위 생성 |
| settlement_items | 500-2000 | 15K-60K | 500K | 운행당 1-2개 |
| audit_logs | 1000-2000 | 30K-60K | 500K | 모든 행위 기록 |

### 저장공간 예상치

```
PostgreSQL Database Size (1년 기준):
  - Tables Data: ~500MB
  - Indexes: ~200MB  
  - WAL/Logs: ~100MB
  - Total: ~800MB

File Storage (1년 기준):
  - CSV Upload Files: ~50MB
  - Application Logs: ~200MB
  - Backup Files: ~2GB (30일 retention)
```

---

## 🛡️ 보안 및 데이터 보호

### 민감 데이터 분류

**Level 1 (High Sensitivity)**:
- `users.password`: bcrypt 해시
- `drivers.businessNumber`: 사업자번호
- `drivers.accountNumber`: 계좌번호

**Level 2 (Medium Sensitivity)**:
- `drivers.phone`: 개인 연락처
- `drivers.email`: 개인 이메일
- `audit_logs.metadata`: IP 주소 등

**Level 3 (Low Sensitivity)**:
- 운행 기록, 정산 정보
- 차량 정보, 노선 정보

### 데이터 접근 제어

```sql
-- Row Level Security (향후 구현 고려)
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- 기사는 본인 데이터만 조회 가능
CREATE POLICY driver_own_data ON drivers
  FOR ALL TO driver_role
  USING (id = current_setting('app.current_driver_id'));

-- 관리자는 모든 데이터 접근 가능
CREATE POLICY admin_all_access ON drivers
  FOR ALL TO admin_role
  USING (true);
```

---

## 📈 성능 최적화 가이드

### 인덱스 사용 패턴

**자주 사용되는 쿼리**:
```sql
-- 1. 일일 운행 조회 (높은 빈도)
SELECT * FROM trips WHERE date = ? AND driverId = ?;
-- 사용 인덱스: trips_driverId_date_idx

-- 2. 월 정산 조회 (중간 빈도)  
SELECT * FROM settlements WHERE yearMonth = ? AND status = ?;
-- 사용 인덱스: settlements_yearMonth_status_idx

-- 3. 감사 로그 검색 (낮은 빈도)
SELECT * FROM audit_logs WHERE action = ? ORDER BY createdAt DESC;
-- 사용 인덱스: audit_logs_action_createdAt_idx
```

**성능 모니터링 쿼리**:
```sql
-- 느린 쿼리 식별
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE mean_time > 100  -- 100ms 이상
ORDER BY total_time DESC;

-- 인덱스 사용률 확인
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  seq_scan as table_scans,
  seq_scan::float / (idx_scan + seq_scan) as table_scan_ratio
FROM pg_stat_user_indexes ui
JOIN pg_stat_user_tables ut ON ui.relid = ut.relid
WHERE (idx_scan + seq_scan) > 0
ORDER BY table_scan_ratio DESC;
```

### 데이터 아카이빙 전략

**정기 아카이빙 대상**:
```sql
-- 3년 이전 감사 로그 아카이빙
CREATE TABLE audit_logs_archive (LIKE audit_logs);

INSERT INTO audit_logs_archive 
SELECT * FROM audit_logs 
WHERE createdAt < NOW() - INTERVAL '3 years';

DELETE FROM audit_logs 
WHERE createdAt < NOW() - INTERVAL '3 years';

-- 5년 이전 완료 운행 기록 아카이빙  
CREATE TABLE trips_archive (LIKE trips);

INSERT INTO trips_archive
SELECT * FROM trips
WHERE date < NOW() - INTERVAL '5 years' 
  AND status = 'COMPLETED';
```

---

## 📋 체크리스트

### 일일 점검
- [ ] 테이블 레코드 수 모니터링
- [ ] 인덱스 사용률 확인
- [ ] 긴급 백업 실행 (중요 변경 시)

### 주간 점검  
- [ ] 데이터 무결성 검사 (FK, UNIQUE 제약)
- [ ] 성능 통계 리뷰 (pg_stat_statements)
- [ ] 디스크 사용량 트렌드 분석

### 월간 점검
- [ ] VACUUM ANALYZE 실행
- [ ] 데이터 아카이빙 실행
- [ ] 인덱스 재구축 검토

---

**Data Dictionary 버전**: 1.0.0  
**마지막 업데이트**: 2025-01-10  
**스키마 버전**: 1.0.0

> 📘 **참고**: 이 데이터 사전은 Prisma 스키마 파일(`schema.prisma`)과 동기화됩니다. 스키마 변경 시 이 문서도 함께 업데이트해야 합니다.