# 운송기사관리 시스템 (MVP) - 아키텍처 및 구현 계획

**Version**: 1.0.0  
**작성일**: 2025-01-10  
**작성자**: System Architect  
**References**: [SPEC.md](./SPEC.md)

---

## 1. Executive Summary

### 1.1 프로젝트 개요
운송기사관리 시스템을 Next.js 14 App Router 기반 **단일 애플리케이션**으로 구축합니다. PostgreSQL을 데이터베이스로 사용하며, Docker Compose로 개발/배포 환경을 통합 관리합니다.

### 1.2 핵심 결정사항
- **Architecture**: Monolithic Next.js App (API Routes 포함)
- **Database**: PostgreSQL 15 with Prisma ORM
- **Deployment**: Docker Compose (web, db, pgadmin)
- **Authentication**: NextAuth.js with JWT
- **Import/Export**: CSV parser + validation pipeline

---

## 2. System Architecture

### 2.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end
    
    subgraph "Application Layer (Docker)"
        subgraph "Next.js App"
            UI[Next.js Pages/Components]
            API[API Routes]
            Auth[NextAuth.js]
            Prisma[Prisma Client]
        end
    end
    
    subgraph "Data Layer (Docker)"
        PostgreSQL[(PostgreSQL 15)]
        Redis[(Redis Cache)]
    end
    
    subgraph "Infrastructure"
        Nginx[Nginx Proxy]
        PGAdmin[pgAdmin]
    end
    
    Browser --> Nginx
    Mobile --> Nginx
    Nginx --> UI
    UI --> API
    API --> Auth
    API --> Prisma
    Prisma --> PostgreSQL
    API --> Redis
    Nginx --> PGAdmin
    PGAdmin --> PostgreSQL
```

### 2.2 Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        Pages[Pages<br/>- Dashboard<br/>- Drivers<br/>- Vehicles<br/>- Routes<br/>- Trips<br/>- Settlement]
        Components[Components<br/>- DataTable<br/>- ImportWizard<br/>- SettlementPreview<br/>- AuditLog]
        Hooks[Custom Hooks<br/>- useAuth<br/>- usePermission<br/>- useImport]
    end
    
    subgraph "API Layer"
        Routes[API Routes<br/>/api/auth<br/>/api/drivers<br/>/api/vehicles<br/>/api/routes<br/>/api/trips<br/>/api/settlements]
        Middleware[Middleware<br/>- Auth Check<br/>- RBAC<br/>- Audit Logger<br/>- Rate Limiter]
        Services[Services<br/>- DriverService<br/>- TripService<br/>- SettlementService<br/>- ImportService]
    end
    
    subgraph "Data Access"
        PrismaClient[Prisma Client]
        Repositories[Repositories<br/>- DriverRepo<br/>- VehicleRepo<br/>- TripRepo<br/>- SettlementRepo]
    end
    
    Pages --> Routes
    Routes --> Middleware
    Middleware --> Services
    Services --> Repositories
    Repositories --> PrismaClient
```

### 2.3 Data Flow - Settlement Pipeline

```mermaid
graph TD
    Start[월 선택] --> Fetch[운행 데이터 조회]
    Fetch --> Aggregate[집계 계산<br/>- 정상 운행<br/>- 결행 공제<br/>- 대차비]
    Aggregate --> Preview[미리보기 생성]
    Preview --> Review{검토}
    Review -->|수정 필요| Edit[수동 조정]
    Edit --> Preview
    Review -->|확인| Confirm[정산 확정]
    Confirm --> Lock[데이터 잠금]
    Lock --> Export[Excel 내보내기]
    Lock --> Audit[감사 로그 기록]
```

---

## 3. Project Structure

### 3.1 Folder Structure

```
logistics-driver-management/
├── .docker/                  # Docker 설정
│   ├── postgres/
│   │   └── init.sql         # DB 초기화 스크립트
│   └── nginx/
│       └── nginx.conf       # Nginx 설정
├── .github/                  # GitHub Actions
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── prisma/
│   ├── schema/              # 스키마 파일 분리
│   │   ├── commons.prisma   # 공통 모델 (Enum, 기본 설정)
│   │   ├── auth.prisma      # 인증 관련
│   │   ├── driver.prisma    # 기사/차량
│   │   ├── route.prisma     # 노선
│   │   ├── trip.prisma      # 운행
│   │   └── settlement.prisma # 정산
│   ├── migrations/          # 마이그레이션 파일
│   └── seed.ts             # 시드 데이터
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/        # 인증 관련 페이지
│   │   │   ├── login/
│   │   │   └── logout/
│   │   ├── (dashboard)/   # 메인 대시보드
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── drivers/       # 기사 관리
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── import/page.tsx
│   │   ├── vehicles/      # 차량 관리
│   │   ├── routes/        # 노선 관리
│   │   ├── trips/         # 운행 관리
│   │   ├── settlements/   # 정산 관리
│   │   │   ├── page.tsx
│   │   │   ├── preview/page.tsx
│   │   │   └── export/route.ts
│   │   ├── admin/         # 관리자 페이지
│   │   │   ├── audit/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   ├── api/           # API Routes
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── drivers/
│   │   │   │   ├── route.ts        # GET(list), POST(create)
│   │   │   │   ├── [id]/route.ts   # GET, PUT, DELETE
│   │   │   │   └── import/route.ts # CSV import
│   │   │   ├── vehicles/
│   │   │   ├── routes/
│   │   │   ├── trips/
│   │   │   ├── settlements/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/confirm/route.ts
│   │   │   │   └── export/route.ts
│   │   │   └── audit/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/         # 재사용 컴포넌트
│   │   ├── common/
│   │   │   ├── DataTable/
│   │   │   ├── Modal/
│   │   │   ├── Button/
│   │   │   └── Form/
│   │   ├── import/
│   │   │   ├── ImportWizard.tsx
│   │   │   ├── ColumnMapper.tsx
│   │   │   └── ValidationResult.tsx
│   │   ├── settlement/
│   │   │   ├── SettlementPreview.tsx
│   │   │   ├── SettlementSummary.tsx
│   │   │   └── ExportButton.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── lib/               # 유틸리티 및 설정
│   │   ├── auth/
│   │   │   ├── config.ts
│   │   │   └── rbac.ts
│   │   ├── db/
│   │   │   ├── prisma.ts
│   │   │   └── seed-data.ts
│   │   ├── services/      # 비즈니스 로직
│   │   │   ├── driver.service.ts
│   │   │   ├── vehicle.service.ts
│   │   │   ├── trip.service.ts
│   │   │   ├── settlement.service.ts
│   │   │   └── import.service.ts
│   │   ├── utils/
│   │   │   ├── csv-parser.ts
│   │   │   ├── excel-export.ts
│   │   │   ├── date-helper.ts
│   │   │   └── validation.ts
│   │   └── constants/
│   │       └── index.ts
│   ├── hooks/             # Custom React Hooks
│   │   ├── useAuth.ts
│   │   ├── usePermission.ts
│   │   ├── useImport.ts
│   │   └── useSettlement.ts
│   ├── types/             # TypeScript 타입 정의
│   │   ├── auth.d.ts
│   │   ├── models.d.ts
│   │   └── api.d.ts
│   └── middleware.ts      # Next.js Middleware
├── public/
│   ├── templates/         # CSV 템플릿 파일
│   │   ├── drivers.csv
│   │   ├── vehicles.csv
│   │   └── routes.csv
│   └── images/
├── tests/                 # 테스트 파일
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker-compose.yml     # 개발 환경
├── docker-compose.prod.yml # 프로덕션 환경
├── .env.example
├── .env.local            # 개발 환경 변수
├── .env.staging          # 스테이징 환경 변수
├── .env.production       # 프로덕션 환경 변수
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

### 3.2 Folder Structure Rationale

| Directory | Purpose | Rationale |
|-----------|---------|-----------|
| `/prisma/schema/` | 분리된 스키마 파일 | 도메인별 관리, 병렬 작업 용이 |
| `/src/app/` | Next.js 14 App Router | 파일 기반 라우팅, RSC 활용 |
| `/src/app/api/` | API Routes | 단일 애플리케이션 내 API 통합 |
| `/src/components/` | 재사용 컴포넌트 | 도메인별 그룹화, 재사용성 극대화 |
| `/src/lib/services/` | 비즈니스 로직 | API Routes와 로직 분리 |
| `/src/lib/utils/` | 유틸리티 함수 | 공통 기능 중앙 관리 |
| `/.docker/` | Docker 설정 | 인프라 설정 분리 |
| `/public/templates/` | CSV 템플릿 | 사용자 다운로드 가능 |

---

## 4. Database Design

### 4.1 Prisma Schema Structure

```prisma
// prisma/schema/commons.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum VehicleOwnership {
  OWNED      // 고정 (자차)
  CHARTER    // 용차 (임시)
  CONSIGNED  // 지입 (계약)
}

enum TripStatus {
  SCHEDULED
  COMPLETED
  ABSENCE
  SUBSTITUTE
}

enum SettlementStatus {
  DRAFT
  CONFIRMED
  PAID
}

enum UserRole {
  ADMIN
  DISPATCHER
  ACCOUNTANT
}
```

### 4.2 Entity Relationships

```mermaid
erDiagram
    User ||--o{ AuditLog : creates
    User {
        string id PK
        string email UK
        string name
        UserRole role
        boolean isActive
    }
    
    Driver ||--o| Vehicle : assigned
    Driver ||--o{ Trip : drives
    Driver ||--o{ Settlement : receives
    Driver {
        string id PK
        string name
        string phone UK
        string businessNumber
        string bankAccount
        boolean isActive
    }
    
    Vehicle {
        string id PK
        string plateNumber UK
        string vehicleType
        VehicleOwnership ownership
        string driverId FK
    }
    
    RouteTemplate ||--o{ Trip : generates
    RouteTemplate {
        string id PK
        string name
        string loadingPoint
        string unloadingPoint
        decimal driverFare
        decimal billingFare
        int[] weekdayPattern
    }
    
    Trip ||--o| SettlementItem : included
    Trip {
        string id PK
        date date
        string driverId FK
        string vehicleId FK
        string routeTemplateId FK
        TripStatus status
        decimal driverFare
        decimal billingFare
        decimal deductionAmount
    }
    
    Settlement ||--|{ SettlementItem : contains
    Settlement {
        string id PK
        string yearMonth
        string driverId FK
        SettlementStatus status
        decimal totalAmount
        timestamp confirmedAt
    }
    
    SettlementItem {
        string id PK
        string settlementId FK
        string tripId FK
        string type
        decimal amount
    }
    
    AuditLog {
        string id PK
        string userId FK
        string action
        string entityType
        string entityId
        json changes
        timestamp createdAt
    }
```

---

## 5. API Design

### 5.1 RESTful Endpoints

```yaml
Authentication:
  POST   /api/auth/login         # 로그인
  POST   /api/auth/logout        # 로그아웃
  GET    /api/auth/session       # 세션 확인

Drivers:
  GET    /api/drivers            # 기사 목록
  GET    /api/drivers/:id        # 기사 상세
  POST   /api/drivers            # 기사 생성
  PUT    /api/drivers/:id        # 기사 수정
  DELETE /api/drivers/:id        # 기사 삭제
  POST   /api/drivers/import     # CSV 임포트

Vehicles:
  GET    /api/vehicles           # 차량 목록
  GET    /api/vehicles/:id       # 차량 상세
  POST   /api/vehicles           # 차량 생성
  PUT    /api/vehicles/:id       # 차량 수정
  DELETE /api/vehicles/:id       # 차량 삭제

Routes:
  GET    /api/routes             # 노선 목록
  GET    /api/routes/:id         # 노선 상세
  POST   /api/routes             # 노선 생성
  PUT    /api/routes/:id         # 노선 수정
  DELETE /api/routes/:id         # 노선 삭제
  POST   /api/routes/generate    # 월간 운행 생성

Trips:
  GET    /api/trips              # 운행 목록 (날짜 필터)
  GET    /api/trips/:id          # 운행 상세
  POST   /api/trips              # 운행 생성
  PUT    /api/trips/:id          # 운행 수정
  DELETE /api/trips/:id          # 운행 삭제
  POST   /api/trips/bulk-update  # 일괄 수정

Settlements:
  GET    /api/settlements        # 정산 목록
  GET    /api/settlements/:id    # 정산 상세
  POST   /api/settlements        # 정산 생성
  PUT    /api/settlements/:id    # 정산 수정 (DRAFT만)
  POST   /api/settlements/:id/preview    # 미리보기
  POST   /api/settlements/:id/confirm    # 정산 확정
  GET    /api/settlements/:id/export     # Excel 다운로드

Audit:
  GET    /api/audit              # 감사 로그 조회

Dashboard:
  GET    /api/dashboard/metrics  # 대시보드 메트릭
  GET    /api/dashboard/health   # 헬스체크
```

### 5.2 Import Wizard Flow

```typescript
// CSV Import Process
interface ImportFlow {
  // Step 1: Upload
  upload: {
    endpoint: "POST /api/import/upload";
    request: FormData; // file
    response: { fileId: string; headers: string[] };
  };
  
  // Step 2: Mapping
  mapping: {
    endpoint: "POST /api/import/mapping";
    request: {
      fileId: string;
      mappings: Record<string, string>;
    };
    response: { mappingId: string; preview: any[] };
  };
  
  // Step 3: Validation
  validation: {
    endpoint: "POST /api/import/validate";
    request: { mappingId: string };
    response: {
      valid: number;
      invalid: number;
      errors: ValidationError[];
    };
  };
  
  // Step 4: Commit
  commit: {
    endpoint: "POST /api/import/commit";
    request: { mappingId: string };
    response: {
      created: number;
      updated: number;
      skipped: number;
    };
  };
}
```

---

## 6. Workstreams & Milestones

### 6.1 4-Week Sprint Plan

```mermaid
gantt
    title Development Timeline
    dateFormat  YYYY-MM-DD
    section Week 1
    Project Setup           :w1t1, 2025-01-13, 2d
    Database Schema         :w1t2, after w1t1, 2d
    API Scaffolding        :w1t3, after w1t1, 3d
    CSV Templates          :w1t4, after w1t2, 1d
    
    section Week 2
    Driver CRUD            :w2t1, 2025-01-20, 2d
    Vehicle CRUD           :w2t2, after w2t1, 1d
    Route CRUD             :w2t3, after w2t2, 2d
    Trip Management        :w2t4, after w2t3, 2d
    
    section Week 3
    Settlement Logic       :w3t1, 2025-01-27, 3d
    Settlement UI          :w3t2, after w3t1, 2d
    Excel Export           :w3t3, after w3t2, 1d
    RBAC Implementation    :w3t4, 2025-01-27, 2d
    Audit Logging          :w3t5, after w3t4, 1d
    
    section Week 4
    Import Wizard          :w4t1, 2025-02-03, 2d
    Data Migration         :w4t2, after w4t1, 2d
    Testing & QA           :w4t3, after w4t2, 2d
    Documentation          :w4t4, 2025-02-03, 2d
    Deployment             :w4t5, after w4t3, 1d
```

### 6.2 Detailed Workstreams

#### Week 1: Foundation (Jan 13-17)
**Goal**: 인프라 구축 및 기본 구조 확립

**Tasks**:
- [ ] Next.js 14 프로젝트 초기화
- [ ] Docker Compose 설정 (PostgreSQL, Redis, pgAdmin)
- [ ] Prisma 스키마 정의 및 마이그레이션
- [ ] NextAuth.js 설정
- [ ] API Route 구조 생성
- [ ] CSV 템플릿 파일 작성

**Deliverables**:
- Running development environment
- Database schema v1.0
- API endpoint stubs
- CSV templates (drivers.csv, vehicles.csv, routes.csv)

**Definition of Done**:
- Docker containers running successfully
- Database migrations applied
- Basic auth flow working
- API health check endpoint responding

#### Week 2: Core CRUD Operations (Jan 20-24)
**Goal**: 핵심 엔티티 CRUD 구현

**Tasks**:
- [ ] Driver 관리 (CRUD + 검색/필터)
- [ ] Vehicle 관리 (CRUD + 기사 배정)
- [ ] RouteTemplate 관리 (CRUD + 요일 패턴)
- [ ] Trip 관리 (생성/수정 + 상태 변경)
- [ ] 기본 UI 컴포넌트 구현

**Deliverables**:
- Working CRUD APIs for all entities
- Basic UI pages for management
- Data validation rules
- Unit tests for services

**Definition of Done**:
- All CRUD operations tested via Postman/Insomnia
- UI forms with validation
- 80% unit test coverage for services
- No critical bugs in basic operations

#### Week 3: Settlement & Security (Jan 27-31)
**Goal**: 정산 시스템 및 보안 구현

**Tasks**:
- [ ] Settlement 집계 로직 구현
- [ ] Settlement 미리보기 UI
- [ ] Excel export 기능
- [ ] RBAC 미들웨어 구현
- [ ] Audit logging 시스템
- [ ] Permission-based UI rendering

**Deliverables**:
- Settlement calculation engine
- Settlement preview & confirmation flow
- Excel export functionality
- Working RBAC system
- Comprehensive audit logs

**Definition of Done**:
- Settlement calculations match Excel formulas
- Excel exports open correctly
- Role-based access working
- All actions logged in audit table
- No unauthorized access possible

#### Week 4: Polish & Deployment (Feb 3-7)
**Goal**: 임포트 기능, 데이터 이행, 배포

**Tasks**:
- [ ] CSV Import Wizard 구현
- [ ] 데이터 검증 및 시뮬레이션
- [ ] Legacy 데이터 마이그레이션
- [ ] E2E 테스트 작성
- [ ] Performance optimization
- [ ] Production deployment setup

**Deliverables**:
- Working import wizard with validation
- Migrated production data
- Comprehensive test suite
- Performance metrics dashboard
- Deployment documentation
- Release notes v1.0

**Definition of Done**:
- Import success rate > 95%
- All legacy data migrated
- E2E tests passing
- Page load time < 2s
- Zero critical bugs
- Production environment running

---

## 7. Risk Register & Mitigations

### 7.1 Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| **스키마 변경 빈발** | High | High | - Prisma 마이그레이션 전략 수립<br>- 스키마 버저닝<br>- Backward compatibility 유지 |
| **정산 규칙 변동** | High | High | - 규칙 엔진 패턴 적용<br>- 설정 가능한 파라미터화<br>- 정산 버전 관리 |
| **임포트 포맷 다양성** | High | Medium | - 유연한 매핑 시스템<br>- 매핑 프로필 저장<br>- 포맷 자동 감지 |
| **성능 저하** | Medium | High | - 인덱싱 전략<br>- 쿼리 최적화<br>- Redis 캐싱 적용 |
| **데이터 정합성 오류** | Medium | High | - 트랜잭션 보장<br>- 외래키 제약<br>- 일일 정합성 체크 |

### 7.2 Business Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| **사용자 교육 부족** | High | Medium | - 상세 매뉴얼 작성<br>- 동영상 튜토리얼<br>- 샌드박스 환경 제공 |
| **기존 시스템 의존성** | Medium | High | - 병렬 운영 기간<br>- 단계적 전환<br>- Rollback 계획 |
| **요구사항 변경** | Medium | Medium | - 애자일 개발<br>- 주간 리뷰 미팅<br>- Feature flag 활용 |

### 7.3 Operational Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| **데이터 유실** | Low | Critical | - 자동 백업 (일일)<br>- Point-in-time recovery<br>- 다중 백업 위치 |
| **보안 침해** | Low | High | - 정기 보안 감사<br>- 침입 탐지 시스템<br>- 최소 권한 원칙 |
| **시스템 장애** | Low | High | - Health check monitoring<br>- Auto-restart 설정<br>- Failover 계획 |

---

## 8. Implementation Details

### 8.1 Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/logistics
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db
      - redis
    volumes:
      - ./src:/app/src
      - ./public:/app/public
    command: npm run dev

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=logistics
      - TZ=Asia/Seoul
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./.docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - "5050:80"
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@logistics.com
      - PGADMIN_DEFAULT_PASSWORD=admin
    depends_on:
      - db

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./.docker/nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - web

volumes:
  postgres_data:
  redis_data:
```

### 8.2 Environment Configuration

```bash
# .env.staging
NODE_ENV=staging
DATABASE_URL=postgresql://user:password@localhost:5432/logistics_staging
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=https://staging.logistics.com
NEXTAUTH_SECRET=staging-secret-key
IMPORT_MAX_SIZE=10MB
SETTLEMENT_LOCK_DAYS=30
AUDIT_LOG_RETENTION_DAYS=365

# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/logistics_prod
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=https://logistics.com
NEXTAUTH_SECRET=production-secret-key
IMPORT_MAX_SIZE=50MB
SETTLEMENT_LOCK_DAYS=90
AUDIT_LOG_RETENTION_DAYS=1825
```

### 8.3 Settlement Calculation Logic

```typescript
// lib/services/settlement.service.ts
export class SettlementService {
  async calculateMonthlySettlement(
    driverId: string,
    yearMonth: string
  ): Promise<Settlement> {
    // 1. Fetch all trips for the month
    const trips = await prisma.trip.findMany({
      where: {
        driverId,
        date: {
          gte: new Date(`${yearMonth}-01`),
          lt: new Date(`${yearMonth}-01`).addMonths(1)
        }
      }
    });

    // 2. Calculate base fare
    const regularTrips = trips.filter(t => t.status === 'COMPLETED');
    const baseFare = regularTrips.reduce((sum, t) => sum + t.driverFare, 0);

    // 3. Calculate deductions
    const absenceTrips = trips.filter(t => t.status === 'ABSENCE');
    const absenceDeduction = absenceTrips.reduce((sum, t) => 
      sum + (t.deductionAmount || t.driverFare * 0.1), 0
    );

    const substituteTrips = trips.filter(t => t.status === 'SUBSTITUTE');
    const substituteDeduction = substituteTrips.reduce((sum, t) => 
      sum + (t.deductionAmount || t.driverFare * 0.05), 0
    );

    // 4. Create settlement items
    const items: SettlementItem[] = [
      ...regularTrips.map(t => ({
        tripId: t.id,
        type: 'TRIP',
        description: `운행: ${t.routeName}`,
        amount: t.driverFare,
        date: t.date
      })),
      ...absenceTrips.map(t => ({
        tripId: t.id,
        type: 'DEDUCTION',
        description: `결행 공제: ${t.absenceReason}`,
        amount: -t.deductionAmount,
        date: t.date
      })),
      ...substituteTrips.map(t => ({
        tripId: t.id,
        type: 'DEDUCTION',
        description: `대차 공제`,
        amount: -t.deductionAmount,
        date: t.date
      }))
    ];

    // 5. Calculate final amount
    const totalDeductions = absenceDeduction + substituteDeduction;
    const finalAmount = baseFare - totalDeductions;

    // 6. Create settlement
    return prisma.settlement.create({
      data: {
        driverId,
        yearMonth,
        status: 'DRAFT',
        totalTrips: trips.length,
        totalBaseFare: baseFare,
        totalDeductions,
        totalAdditions: 0,
        finalAmount,
        items: {
          create: items
        }
      }
    });
  }
}
```

---

## 9. Quality Assurance

### 9.1 Testing Strategy

```yaml
Unit Tests:
  - Coverage: > 80%
  - Focus: Services, Utils, Calculations
  - Tools: Jest, Testing Library

Integration Tests:
  - Coverage: API endpoints
  - Focus: Database interactions, Auth flow
  - Tools: Supertest, Test containers

E2E Tests:
  - Coverage: Critical user journeys
  - Focus: Import flow, Settlement process
  - Tools: Playwright, Cypress

Performance Tests:
  - Metrics: Response time, Throughput
  - Focus: Settlement calculation, Import processing
  - Tools: K6, Artillery
```

### 9.2 Monitoring & Metrics

```typescript
// Key metrics to track
interface SystemMetrics {
  // Performance
  apiResponseTime: Histogram;      // P50, P95, P99
  databaseQueryTime: Histogram;    // Per query type
  settlementProcessingTime: Gauge; // Monthly average
  
  // Business
  dailyTripsCount: Counter;
  activeDriversCount: Gauge;
  settlementErrorRate: Rate;
  importSuccessRate: Rate;
  
  // System
  memoryUsage: Gauge;
  cpuUsage: Gauge;
  databaseConnections: Gauge;
  errorRate: Rate;
}
```

---

## 10. Migration Strategy

### 10.1 Data Migration Plan

```mermaid
graph LR
    subgraph "Phase 1: Preparation"
        A[Export Legacy Data] --> B[Data Cleaning]
        B --> C[Mapping Tables]
    end
    
    subgraph "Phase 2: Migration"
        C --> D[Drivers Migration]
        D --> E[Vehicles Migration]
        E --> F[Routes Migration]
        F --> G[Historical Trips]
    end
    
    subgraph "Phase 3: Validation"
        G --> H[Data Verification]
        H --> I[Reconciliation]
        I --> J[Sign-off]
    end
```

### 10.2 Rollout Strategy

1. **Week -1**: Staging environment setup
2. **Week 0**: Production environment preparation
3. **Week 1-2**: Parallel run with existing system
4. **Week 3**: Full cutover
5. **Week 4**: Legacy system decommission

---

## 11. Success Criteria

### 11.1 Technical Success Metrics
- [ ] All CRUD operations functional
- [ ] Settlement calculations accurate (100% match with Excel)
- [ ] Import success rate > 95%
- [ ] Page load time < 2 seconds
- [ ] Zero critical bugs in production
- [ ] 99.5% uptime in first month

### 11.2 Business Success Metrics
- [ ] User adoption rate > 80% in first month
- [ ] Settlement processing time reduced by 80%
- [ ] Data entry errors reduced by 90%
- [ ] User satisfaction score > 4.0/5.0

---

## 12. Appendix

### 12.1 Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Monolithic | Simpler deployment, easier maintenance for MVP |
| **Database** | PostgreSQL | ACID compliance, JSON support, mature ecosystem |
| **ORM** | Prisma | Type safety, migrations, great DX |
| **Auth** | NextAuth.js | Flexible, supports multiple providers |
| **Styling** | Tailwind CSS | Rapid development, consistent design |
| **State Management** | React Query | Server state management, caching |
| **Testing** | Jest + Playwright | Comprehensive coverage, good integration |

### 12.2 References

- [SPEC.md](./SPEC.md) - Product Specification
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose)

---

**END OF PLAN**

_This plan is a living document and will be updated as the project progresses._