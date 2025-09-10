# 시스템 구현 계획서 (PLAN.md) - 운송기사관리 MVP

**Version**: 2.0.0  
**Updated**: 2025-01-10  
**Architect**: System Architect  
**Principle**: 기능 우선 → 배포 → 이후 최적화

---

## 📋 Executive Summary

### Project Overview
**Goal**: 운송기사 관리 디지털 전환 - Excel 기반에서 웹 시스템으로  
**Duration**: 4주 (기능 개발 및 배포)  
**Core Value**: 실제 동작하는 기능 우선, 성능 최적화는 배포 후

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

## 📅 Workstreams & Milestones (4 Weeks) - IMMEDIATE EXECUTION

### Week 1: Foundation & Core APIs ✅ **COMPLETED TODAY**
**Goal**: Database connection and basic CRUD APIs
**Status**: ✅ **DONE** - All deliverables completed

**Completed Tasks**:
- ✅ **DB-001**: Database connection and migration verification
- ✅ **API-011**: Drivers API complete (GET/POST/PUT/DELETE)
- ✅ **API-012**: Vehicles API complete (GET/POST/PUT/DELETE)
- ✅ **FE-101**: DriversPage React Query integration complete

**Deliverables Achieved**:
- ✅ Working database with migrations and seed data (10 drivers, 12 vehicles)
- ✅ Drivers and Vehicles APIs fully functional with RBAC
- ✅ Frontend DriversPage connected to real API
- ✅ CRUD operations tested and verified

**Definition of Done (TODAY) ✅**:
- ✅ `/api/drivers` CRUD complete with validation
- ✅ `/api/vehicles` CRUD complete with validation  
- ✅ DriversPage fully integrated with React Query
- ✅ All operations working at http://localhost:3000

---

### Week 2: Routes, Trips & Frontend Integration
**Goal**: Complete remaining APIs and frontend connections
**Status**: 🔄 **IN PROGRESS**

**Tasks**:
- ✅ **API-013**: Routes API implementation (COMPLETED)
- ✅ **API-014**: Trips API with status management (COMPLETED)
- 🔄 **FE-111**: Replace Trips page with API data (NEXT)
- [ ] Date-based trip filtering optimization
- [ ] Status management UI components

**Deliverables**:
- Complete CRUD APIs for all domains
- Frontend pages connected to real APIs
- Trip status workflow (SCHEDULED → COMPLETED/ABSENCE/SUBSTITUTE)

---

### Week 3: Settlement & Validation
**Goal**: Settlement calculation and data integrity
**Status**: ⏳ **PENDING**

**Tasks**:
- [ ] **API-015**: Settlement API complete verification
- [ ] **FE-121**: Settlement preview/finalize/export UI
- [ ] Settlement calculation logic (월락 방식)
- [ ] Lock mechanism (DRAFT → CONFIRMED → PAID)

**Deliverables**:
- Settlement preview calculation working
- Finalize with immutability lock
- Export stub for Excel generation

---

### Week 4: Import & Operations
**Goal**: CSV import and deployment readiness
**Status**: ⏳ **PENDING**

**Tasks**:
- [ ] **IMP-201**: CSV Import (drivers) - template enforcement
- [ ] **IMP-202**: CSV Import (trips) - validation pipeline
- [ ] **OPS-301**: Health check endpoint (/api/health)
- [ ] **OPS-310**: RUNBOOK.md and RELEASE_NOTES.md

**Deliverables**:
- CSV import handling 100+ records with validation
- Production health monitoring
- Complete deployment documentation

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

### Functional Requirements
- [ ] Each page works with DB-backed APIs (no mock data)
- [ ] CSV import successfully processes 100+ records
- [ ] Settlement lock mechanism prevents modifications
- [ ] RBAC properly restricts access by role

### Technical Requirements
- [ ] `docker-compose up` starts all services
- [ ] Database migrations are repeatable
- [ ] API endpoints return proper HTTP status codes
- [ ] Zod validation on all inputs

### Documentation Requirements
- [ ] API endpoints documented in Postman/Insomnia
- [ ] RUNBOOK.md with deployment steps
- [ ] Environment variables documented

---

## 🚀 Quick Start

```bash
# Development
docker-compose up
npx prisma migrate dev
npx prisma db seed
npm run dev

# Production
docker-compose -f docker-compose.prod.yml up
```

---

## 📊 Current Status

### Completed ✅
- Database schema defined and migrated
- Docker Compose environment configured
- NextAuth.js with RBAC setup
- Settlement test suite (tests/settlement.test.ts)
- CSV templates created (templates/csv/*.csv)
- GitHub CI/CD pipeline

### In Progress 🔄
- API Routes implementation (partially complete)
- Frontend-API integration

### Pending ⏳
- CSV Import wizard
- Settlement UI with preview
- Excel export
- Production deployment configuration

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

**END OF PLAN**

_This plan prioritizes working functionality over optimization. Performance tuning will be addressed post-deployment._