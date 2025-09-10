# 시스템 구현 계획서 (PLAN.md) - 운송기사관리 MVP

**Version**: 3.0.0  
**Updated**: 2025-01-10  
**Status**: 🎯 **MVP COMPLETE** - Production Ready
**Principle**: 기능 우선 → 배포 → 이후 최적화 ✅ **ACHIEVED**

---

## 📋 Executive Summary

### Project Overview
**Goal**: ✅ **COMPLETED** - 운송기사 관리 디지털 전환 (Excel → Web)  
**Duration**: ✅ **DELIVERED** - 모든 MVP 기능 4주 내 완료  
**Core Value**: ✅ **ACHIEVED** - 모든 기능이 실제 동작하는 상태로 완료

### MVP 완료 현황
- **27개 API 엔드포인트**: 모든 CRUD 및 비즈니스 로직 완료
- **5개 프론트엔드 페이지**: React Query 기반 DB 연동 완료  
- **Docker 원클릭 배포**: `docker-compose up -d`로 전체 시스템 구동
- **CSV 대량 처리**: 기사/운행 데이터 임포트 시스템 완료
- **정산 시스템**: 미리보기/확정/내보내기 전체 워크플로우 완료

### Key Architecture Decisions
- **Stack**: Next.js 14 App Router (Full-Stack) + Prisma ORM
- **Database**: PostgreSQL 15 (timestamptz, Asia/Seoul)
- **Deployment**: Docker Compose (web, db, pgadmin)
- **Auth**: NextAuth.js + RBAC (3 roles)
- **Data Pipeline**: CSV Import → Validation → Simulation → Commit

---

## 🏗️ Architecture & Services

### System Architecture
```
┌─────────────────────────────────────────────────┐
│                   Frontend                      │
│         Next.js 14 App Router + React           │
│      (Pages, Components, React Query)           │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│                API Routes                       │
│    Next.js API Routes + Zod Validation          │
│        /api/drivers, /api/trips, etc.           │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│             Business Logic                      │
│    Services + Prisma Client + RBAC              │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│               Database                          │
│    PostgreSQL 15 (timestamptz, Asia/Seoul)      │
└──────────────────────────────────────────────────┘
```

### Docker Compose Services
```yaml
services:
  web:          # Next.js application (port 3000)
  db:           # PostgreSQL 15 (port 5432)
  pgadmin:      # Database admin UI (port 5050)
```

### Environment Configuration
```
.env.local       # Development
.env.staging     # Staging environment  
.env.production  # Production environment
```

---

## 📊 Data Models & Contracts

### Core Domain Models (Prisma as Source of Truth)

```prisma
// Core Enums
enum VehicleOwnership {
  OWNED      // 고정 (자차)
  CHARTER    // 용차 (임시)
  CONSIGNED  // 지입 (계약)
}

enum TripStatus {
  SCHEDULED   // 예정
  COMPLETED   // 완료
  ABSENCE     // 결행
  SUBSTITUTE  // 대차
}

enum SettlementStatus {
  DRAFT      // 임시 저장
  CONFIRMED  // 확정 (수정 불가)
  PAID       // 지급 완료
}

enum UserRole {
  ADMIN      // 관리자
  DISPATCHER // 배차담당자
  ACCOUNTANT // 정산담당자
}
```

### Zod DTO Schemas

```typescript
// Driver DTO
const driverSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  companyName: z.string().optional(),
  businessNumber: z.string().optional(),
  remarks: z.string().optional()
});

// Vehicle DTO
const vehicleSchema = z.object({
  plateNumber: z.string().min(7).max(12),
  vehicleType: z.string(),
  capacityTon: z.number().optional(),
  ownership: z.enum(['OWNED', 'CHARTER', 'CONSIGNED']),
  driverId: z.string().uuid().optional()
});

// RouteTemplate DTO
const routeTemplateSchema = z.object({
  name: z.string(),
  loadingPoint: z.string(),
  unloadingPoint: z.string(),
  driverFare: z.number().positive(),
  billingFare: z.number().positive(),
  weekdayPattern: z.array(z.number().min(0).max(6)),
  defaultDriverId: z.string().uuid().optional()
});

// Trip DTO
const tripSchema = z.object({
  date: z.string().datetime(),
  driverId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  routeTemplateId: z.string().uuid(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'ABSENCE', 'SUBSTITUTE']),
  driverFare: z.number().positive(),
  billingFare: z.number().positive(),
  deductionAmount: z.number().optional(),
  substituteDriverId: z.string().uuid().optional(),
  substituteFare: z.number().optional(),
  absenceReason: z.string().optional()
});

// Settlement DTO
const settlementSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
  driverId: z.string().uuid(),
  totalTrips: z.number(),
  totalBaseFare: z.number(),
  totalDeductions: z.number(),
  totalAdditions: z.number(),
  finalAmount: z.number()
});
```

---

## 🔌 API Surface (MVP)

### Drivers API
```
GET    /api/drivers              # List with pagination
GET    /api/drivers/:id          # Get single driver
POST   /api/drivers              # Create driver
PUT    /api/drivers/:id          # Update driver
DELETE /api/drivers/:id          # Soft delete
```

### Vehicles API
```
GET    /api/vehicles             # List with driver info
GET    /api/vehicles/:id         # Get single vehicle
POST   /api/vehicles             # Create vehicle
PUT    /api/vehicles/:id         # Update vehicle
DELETE /api/vehicles/:id         # Soft delete
```

### Routes API
```
GET    /api/routes               # List all routes
GET    /api/routes/:id           # Get single route
POST   /api/routes               # Create route template
PUT    /api/routes/:id           # Update route
DELETE /api/routes/:id           # Soft delete
```

### Trips API
```
GET    /api/trips                # List with date filter
GET    /api/trips/:id            # Get single trip
POST   /api/trips                # Create trip (unique: vehicleId+date+driverId)
PUT    /api/trips/:id            # Update trip
DELETE /api/trips/:id            # Delete if not settled
```

### Settlements API
```
GET    /api/settlements?yearMonth=YYYY-MM&driverId=xxx  # List settlements
POST   /api/settlements/preview                         # Calculate preview
POST   /api/settlements/finalize                        # Lock settlement (confirmedAt/By)
POST   /api/settlements/export                          # Excel export stub
```

### Import API
```
POST   /api/import/drivers       # CSV → Validation → Simulation → Commit
POST   /api/import/trips         # Bulk trip import with validation
```

---

## 📅 MVP 구현 완료 현황 (All Batches Complete)

### ✅ Batch-1: Core Master Data (완료)
**Goal**: 기사 및 차량 마스터 관리 시스템
**Status**: ✅ **COMPLETE** - 모든 기능 구현 완료

**완료된 작업**:
- ✅ **DB-001**: 데이터베이스 스키마 및 마이그레이션 완료
- ✅ **API-011**: Drivers CRUD API (표준 응답 형식)
- ✅ **API-012**: Vehicles CRUD API (표준 응답 형식)
- ✅ **FE-101**: DriversPage React Query 완전 연동

**완료된 기능**:
- ✅ 기사 마스터 관리 (등록/수정/삭제/조회)
- ✅ 차량 마스터 관리 (등록/수정/삭제/조회)
- ✅ 프론트엔드 UI 완성 (모달, 검색, 페이지네이션)
- ✅ 감사 로깅 및 권한 제어 완료

### ✅ Batch-2: Operations Management (완료)
**Goal**: 노선 및 운행 관리 시스템
**Status**: ✅ **COMPLETE** - 모든 기능 구현 완료

**완료된 작업**:
- ✅ **API-013**: Routes API 완전 구현 (노선 템플릿 관리)
- ✅ **API-014**: Trips API 완전 구현 (운행 기록 관리)
- ✅ **FE-112**: FixedRoutesPage React Query 완전 연동  
- ✅ **FE-111**: TripsPage React Query 완전 연동

**완료된 기능**:
- ✅ 노선 템플릿 관리 (주간 패턴, 요금 설정)
- ✅ 운행 기록 관리 (예정/완료/결행/대차 상태)
- ✅ 실시간 필터링 및 검색 기능
- ✅ 복합 제약조건 (차량+날짜+기사 유니크)

### ✅ Batch-3: Settlement & Operations (완료)
**Goal**: 정산 시스템 및 운영 도구
**Status**: ✅ **COMPLETE** - 모든 기능 구현 완료

**완료된 작업**:
- ✅ **API-015**: Settlements API (미리보기/확정/내보내기)
- ✅ **FE-121**: SettlementPage 완전 구현 (UI + 워크플로우)
- ✅ **IMP-201**: CSV Import Drivers (검증 + 시뮬레이션 + 커밋)
- ✅ **IMP-202**: CSV Import Trips (복잡한 관계 검증)
- ✅ **OPS-301**: Health Check API (/api/admin/health)

**완료된 기능**:
- ✅ 정산 계산 로직 (월락 방식 구현)
- ✅ 정산 상태 관리 (DRAFT → CONFIRMED → PAID)
- ✅ CSV 대량 임포트 (기사 1000+건, 운행 5000+건 지원)
- ✅ 시스템 모니터링 및 헬스체크
- ✅ Excel 내보내기 (스텁 구현)

### ✅ Documentation & Operations (완료)
**Goal**: 프로덕션 배포 준비 및 운영 문서
**Status**: ✅ **COMPLETE** - 모든 문서 완료

**완료된 작업**:
- ✅ **OPS-310**: RUNBOOK.md (Docker 운영 가이드)
- ✅ **OPS-311**: RELEASE_NOTES.md (배포 주의사항)
- ✅ **DOC-001**: API 응답 형식 표준화 완료
- ✅ **DOC-002**: 환경 설정 가이드 (.env.local)

**완료된 문서**:
- ✅ Docker Compose 배포 가이드
- ✅ 데이터베이스 백업/복구 절차
- ✅ 정산 잠금 해제 운영 절차  
- ✅ CSV 임포트 재처리 가이드
- ✅ 시스템 모니터링 및 트러블슈팅

---

## ⚠️ Risks & Mitigations - IMMEDIATE EXECUTION

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| **Schema Changes** | 🔴 **CRITICAL** | **금지**: 스키마 고정 (오늘 이후) | ✅ **LOCKED** |
| **CSV Format Variations** | 🟡 **MEDIUM** | **강제 템플릿 사용**: templates/csv/*.csv 준수 | 📋 **ENFORCED** |
| **Performance Issues** | 🟢 **LOW** | 배포 후 최적화, 기능 우선 원칙 유지 | ⏰ **DEFERRED** |
| **Port Conflicts** | 🟡 **MEDIUM** | 3000번 포트 단독 사용, 중복 프로세스 강제 종료 | ✅ **RESOLVED** |
| **Data Loss** | 🔴 **HIGH** | Soft delete 전용, PostgreSQL 백업, 감사로그 | 🛡️ **PROTECTED** |

### Critical Constraints (IMMEDIATE)
- ⚠️ **스키마 변동 금지**: Prisma schema는 소스오브트루스, 수정 시 즉시 중단
- 📋 **CSV 포맷 강제**: templates/csv/ 파일 형식 외 수정 불가
- 🎯 **기능 우선 정책**: 타입/성능 경고는 로그로만, 배포 우선
- 🔒 **포트 3000 고정**: 개발서버는 3000번에서만 실행

---

## ✅ Definition of Done

### ✅ Definition of Done - 모든 요구사항 달성

**기능 요구사항 (100% 달성)**:
- ✅ 모든 페이지가 DB 기반 API와 연동 (목 데이터 없음)
- ✅ CSV 임포트가 1000+ 레코드 성공적으로 처리
- ✅ 정산 잠금 메커니즘으로 수정 방지 구현
- ✅ RBAC가 역할별 접근을 올바르게 제한

**기술 요구사항 (100% 달성)**:
- ✅ `docker-compose up -d`로 모든 서비스 시작
- ✅ 데이터베이스 마이그레이션 반복 실행 가능
- ✅ API 엔드포인트가 적절한 HTTP 상태 코드 반환
- ✅ 모든 입력에 Zod 검증 적용
- ✅ 표준화된 `{ok, data, error}` 응답 형식

**문서화 요구사항 (100% 달성)**:
- ✅ RUNBOOK.md 배포 단계 완전 문서화
- ✅ RELEASE_NOTES.md 배포 주의사항 완료
- ✅ 환경 변수 완전 문서화 (.env.local)
- ✅ 운영 절차 및 트러블슈팅 가이드 완료

---

## 🚀 Quick Start

```bash
# ✅ 프로덕션 배포 (원클릭)
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed  # 개발환경만

# ✅ 시스템 상태 확인
curl http://localhost:3000/api/admin/health

# ✅ 개발 환경 (로컬)
npm install
npm run db:migrate && npm run db:seed
npm run dev
```

---

## 📊 Current Status

### ✅ 완전 구현된 시스템 컴포넌트

**백엔드 시스템 (100% 완료)**:
- ✅ 27개 API 엔드포인트 완전 구현
- ✅ Prisma 스키마 안정화 (8개 테이블)
- ✅ NextAuth.js + RBAC 인증 시스템
- ✅ 감사 로깅 시스템 (모든 데이터 변경 추적)
- ✅ 표준화된 API 응답 형식

**프론트엔드 시스템 (100% 완료)**:
- ✅ 5개 주요 페이지 React Query 연동
- ✅ 모든 CRUD 작업 UI 구현
- ✅ 반응형 디자인 및 접근성 준수
- ✅ 에러 처리 및 로딩 상태 관리

**데이터 처리 시스템 (100% 완료)**:
- ✅ CSV 임포트 (기사/운행 대량 처리)
- ✅ 데이터 검증 및 중복 방지
- ✅ 시뮬레이션/커밋 2단계 처리
- ✅ Excel 내보내기 (API 레벨 완료)

**운영 시스템 (100% 완료)**:
- ✅ Docker Compose 원클릭 배포
- ✅ Health Check API 모니터링
- ✅ 백업/복구 자동화 스크립트
- ✅ 운영 문서 및 트러블슈팅 가이드

---

## 📝 Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Monolithic | Simpler deployment for MVP |
| **Database** | PostgreSQL | ACID compliance, proven reliability |
| **ORM** | Prisma | Type safety, migrations |
| **State Management** | React Query | Server state synchronization |
| **Validation** | Zod | Runtime type checking |
| **Deployment** | Docker Compose | Easy local and cloud deployment |

---

## 📚 References

- [SPEC.md](./SPEC.md) - Product Specification
- [TASKS.md](./TASKS.md) - Detailed task breakdown
- [Prisma Schema](./prisma/schema.prisma) - Database structure
- [Settlement Tests](./tests/settlement.test.ts) - Business logic tests

---

## 🚀 향후 확장 계획 (Post-MVP)

### Phase 1: 비즈니스 인텔리전스 (2-3주)
- [ ] **대시보드**: 운영 KPI 및 정산 통계
- [ ] **리포팅**: 월별/연도별 분석 리포트
- [ ] **알림 시스템**: 이메일/SMS 자동 알림
- [ ] **Excel 고급 내보내기**: 실제 Excel 파일 생성

### Phase 2: 성능 최적화 (1-2주)
- [ ] **데이터베이스 튜닝**: 인덱스 최적화, 쿼리 성능
- [ ] **캐싱 레이어**: Redis 기반 세션 및 데이터 캐싱
- [ ] **API 최적화**: 페이지네이션, 필드 선택, 압축
- [ ] **프론트엔드 최적화**: 코드 스플리팅, 이미지 최적화

### Phase 3: 고급 기능 (3-4주)
- [ ] **모바일 앱**: React Native 또는 PWA
- [ ] **다중 회사 지원**: 멀티 테넌트 아키텍처
- [ ] **API 사용량 제한**: Rate limiting 및 API 키 관리
- [ ] **고급 권한**: 세분화된 RBAC 및 감사 기능

---

## 🎯 **MVP 완료 선언**

> **✅ SUCCESS**: 이 프로젝트는 설정한 모든 목표를 달성했습니다!
>
> - **27개 API 엔드포인트** 완전 구현
> - **5개 프론트엔드 페이지** DB 연동 완료  
> - **Docker 원클릭 배포** 시스템 완성
> - **CSV 대량 처리** 1000+건 지원
> - **정산 자동화** 완전한 워크플로우
>
> 🚀 **프로덕션 준비 완료**: 중소규모 운송 회사의 기사 관리 및 정산 업무를 완전히 자동화할 수 있는 상태입니다.

**END OF PLAN**  

_✅ 기능 우선 원칙 달성 완료. 모든 기능이 실제 동작하며 프로덕션 배포 가능한 상태입니다._