# 운송기사관리 시스템 - 프로젝트 메모리

## 프로젝트 구조 및 개발 규칙

### 디렉토리 구조 (CLAUDE 필수 기억)
```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API Routes
│   │   ├── drivers/       # 기사 CRUD
│   │   ├── vehicles/      # 차량 CRUD  
│   │   ├── routes/        # 노선 CRUD
│   │   ├── trips/         # 운행 CRUD
│   │   ├── settlements/   # 정산 CRUD
│   │   ├── import/        # CSV 임포트
│   │   └── templates/     # CSV 템플릿 다운로드
│   ├── drivers/page.tsx   # 기사 관리 페이지
│   ├── settlements/page.tsx # 정산 관리 페이지
│   ├── import/drivers/page.tsx # 기사 임포트 페이지
│   └── layout.tsx         # 루트 레이아웃
├── components/            # React 컴포넌트 (모든 컴포넌트는 여기!)
│   ├── providers/         # Context Providers
│   ├── Dashboard.tsx      # 대시보드 컴포넌트
│   ├── DriversPage.tsx    # 기사 관리 UI
│   └── SettlementPage.tsx # 정산 관리 UI
├── lib/                   # 서버사이드 유틸리티
│   ├── services/          # 비즈니스 로직 서비스
│   ├── auth/              # 인증/권한 관리
│   ├── validations/       # Zod 스키마
│   └── prisma.ts          # Prisma 클라이언트
├── hooks/                 # React 커스텀 훅
└── middleware.ts          # Next.js 미들웨어
```

**중요한 개발 규칙**:
1. **절대 `/components` 와 `/src/components` 중복 생성 금지**
2. **모든 컴포넌트는 `/src/components/` 에만 작성**
3. **API는 `/src/app/api/` 구조 유지**
4. **페이지는 `/src/app/*/page.tsx` 패턴**
5. **앞으로 모든 개발은 Docker 컨테이너 환경에서 진행**

### 기술 스택
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, React Query
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL 15
- **Auth**: NextAuth.js + JWT + RBAC
- **Container**: Docker + Docker Compose
- **Validation**: Zod (서버+클라이언트)

### 데이터베이스 스키마 (핵심 테이블)
```sql
users          # 사용자 + RBAC 권한
drivers        # 운송기사 마스터 (phone UNIQUE)
vehicles       # 차량 마스터 (plateNumber UNIQUE)
route_templates # 고정노선 템플릿
trips          # 운행 기록 (vehicleId+date+driverId UNIQUE)
settlements    # 월별 정산 (driverId+yearMonth UNIQUE)
settlement_items # 정산 상세 항목
audit_logs     # 전체 감사 로그
```

## 핵심 시스템 구성

### 📊 주요 기능 모듈
1. **기사 관리**: 등록/수정/비활성화, 연락처/계좌 정보
2. **차량 관리**: 등록, 소유권 구분(고정/용차/지입), 기사 배정
3. **노선 관리**: 고정노선 템플릿, 요일별 패턴, 운임 설정
4. **운행 관리**: 일일 운행 기록, 결행/대차 처리, 상태 워크플로우
5. **정산 관리**: 월별 자동 계산, DRAFT→CONFIRMED→PAID 워크플로우
6. **임포트/익스포트**: CSV 대량 처리, Excel 다운로드
7. **감사 시스템**: 모든 변경사항 추적, RBAC 권한 제어

### 🔄 시스템 상태 확인
**구현 상태는 다음 문서들에서 확인**:
- `SPEC.md` - 전체 명세서 및 요구사항
- `TASKS.md` - 현재 진행상황 및 완료 기능
- `PLAN.md` - 개발 계획 및 우선순위

## API 설계 패턴

### 표준 응답 형식
```typescript
// 성공 응답
{
  ok: true,
  data: T
}

// 오류 응답
{
  ok: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### RBAC 권한 매트릭스
| Resource | Admin | Dispatcher | Accountant |
|----------|-------|------------|------------|
| Drivers  | CRUD  | CRU        | R          |
| Vehicles | CRUD  | R          | R          |
| Routes   | CRUD  | CRU        | R          |
| Trips    | CRUD  | CRU        | R          |
| Settlements | CRUD | R        | CRUD       |

### 비즈니스 규칙
1. **운행 중복 방지**: 동일 차량+날짜+기사 운행 불가
2. **정산 월락**: CONFIRMED 상태 정산은 수정 불가
3. **Soft Delete**: 모든 마스터 데이터는 isActive=false로 처리
4. **결행 공제**: 10% 자동 공제, 대차 시 5% 공제

## 환경 설정

### Docker 명령어
```bash
# 개발 환경 시작
docker-compose up -d

# 컨테이너 재시작 (코드 변경 후)
docker-compose restart app

# 마이그레이션 실행
docker-compose exec app npx prisma migrate dev

# 시드 데이터 로딩
docker-compose exec app npx prisma db seed
```

### 주요 환경 변수
```bash
DATABASE_URL="postgresql://postgres:postgres@db:5432/logistics"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="prod-secret"
NODE_ENV="development"
```

## 코딩 컨벤션

### 파일 명명 규칙
- **API Routes**: `/api/[resource]/route.ts`
- **Pages**: `/[resource]/page.tsx`
- **Components**: `PascalCase.tsx`
- **Services**: `[resource].service.ts`
- **Validations**: `[resource].ts` (Zod schemas)

### Import 경로 규칙
- `@/` = `src/` 디렉토리 alias (tsconfig.json 설정)
- 모든 import는 절대경로 사용
- 컴포넌트는 `@/components/`에서 import

## 오류 방지 체크리스트

### 개발 시 필수 확인사항
1. **디렉토리 구조 확인**: `/src/components/`에 작성 여부
2. **API 응답 형식**: `{ok, data, error}` 준수
3. **Zod 스키마**: 서버사이드 검증 적용
4. **감사 로그**: 데이터 변경 시 자동 기록
5. **RBAC 권한**: API 엔드포인트 권한 검증
6. **트랜잭션**: 복합 작업 시 DB 트랜잭션 사용

### 금지 사항
- ❌ 루트 `/components` 디렉토리 생성
- ❌ 상대 경로 import 사용  
- ❌ 직접 SQL 쿼리 (Prisma ORM 사용)
- ❌ 프론트엔드에서 직접 DB 접근
- ❌ 하드코딩된 사용자 권한

## 성능 목표 및 품질 기준

### 성능 목표
- API 응답시간: < 200ms (P95)
- 페이지 로드시간: < 2초
- 정산 계산시간: < 5초 (1000건 기준)
- 동시 사용자: 50명

### 프로젝트 정리사항
- **archive/legacy-spa/**: 이전 React SPA 버전 (사용 안함)
- **현재 시스템**: Next.js 14 App Router만 사용

---

**마지막 업데이트**: 2025-09-11  
**현재 상태**: Phase 1 완료, Phase 2 진행 중