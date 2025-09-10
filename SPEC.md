# 운송기사관리 시스템 (MVP) - 제품 명세서

**Version**: 1.0.0  
**작성일**: 2025-01-10  
**승인자**: [Pending]  
**Status**: Draft

---

## 1. Problem Statement & Users

### 1.1 현재 문제점
- **데이터 분산**: 기사, 차량, 운행 정보가 Excel/JSON 파일로 분산 관리
- **정산 오류**: 수동 계산으로 인한 빈번한 정산 실수
- **이력 추적 불가**: 변경 사항 추적 및 감사 로그 부재
- **협업 어려움**: 실시간 데이터 공유 불가, 파일 버전 충돌
- **권한 관리 부재**: 역할별 접근 제어 없음

### 1.2 사용자 페르소나

#### 배차담당자 (Dispatcher)
- **역할**: 일일 운행 관리, 기사 배정, 결행/대차 처리
- **Pain Points**: 
  - 당일 운행 현황 파악 어려움
  - 대차 기사 수배 시 가용 기사 정보 부족
  - 운행 변경사항 실시간 반영 불가
- **Needs**: 실시간 운행 현황판, 빠른 대차 처리, 모바일 접근

#### 정산담당자 (Accountant)
- **역할**: 월간 정산, 비용 계산, 보고서 생성
- **Pain Points**:
  - Excel 수식 오류로 인한 정산 착오
  - 월말 정산 작업 과부하
  - 이전 정산 내역 조회 어려움
- **Needs**: 자동 정산 계산, 정산 미리보기, Excel 내보내기

#### 운영관리자 (Admin)
- **역할**: 시스템 관리, 마스터 데이터 관리, 권한 설정
- **Pain Points**:
  - 데이터 정합성 관리 어려움
  - 대량 데이터 업로드 시 검증 부재
  - 시스템 사용 현황 파악 불가
- **Needs**: 대량 임포트, 감사 로그, 시스템 헬스체크

---

## 2. Goals (MVP Scope)

### 2.1 핵심 기능
1. **기사 관리**: 등록/수정/비활성화, 연락처 및 계좌 정보
2. **차량 관리**: 차량 등록, 소유권 구분(고정/용차/지입)
3. **고정노선 관리**: 요일별 패턴, 운임 설정(기사/청구)
4. **운행 기록**: 일일 운행 입력, 결행/부재/대차 처리
5. **월 정산**: 기사별/노선별 정산, 미리보기 및 확정
6. **RBAC**: 역할 기반 접근 제어 (admin/dispatcher/accountant)
7. **감사 로그**: 모든 변경사항 추적
8. **임포트/익스포트**: CSV/Excel 대량 처리

### 2.2 기술 요구사항
- Next.js 14 (App Router)
- PostgreSQL + Prisma ORM
- Docker Compose 개발/배포 환경
- TypeScript 전체 적용
- Asia/Seoul 타임존, timestamptz 사용

---

## 3. Non-Goals (Out of Scope)

### MVP에서 제외
- 고객사 포털 (화주 직접 접근)
- 모바일 푸시 알림
- 복잡한 다단계 요율표 자동화
- 실시간 GPS 트래킹
- 전자계약/전자서명
- 외부 ERP 연동
- 다국어 지원

---

## 4. User Journeys

### 4.1 기사 등록 및 관리
```
1. [Admin/Dispatcher] 기사 관리 페이지 접근
2. 신규 기사 정보 입력
   - 필수: 이름, 연락처, 차량번호
   - 선택: 사업자번호, 은행계좌, 비고
3. 중복 검사 (차량번호 기준)
4. 저장 → 감사 로그 기록
5. 기사 목록에서 검색/필터링
6. 필요시 정보 수정 또는 비활성화
```

### 4.2 차량 등록 및 기사 배정
```
1. [Admin] 차량 관리 페이지 접근
2. 차량 정보 입력
   - 차량번호, 차종, 톤수
   - 소유권: 고정(자차)/용차(임시)/지입(계약)
3. 기사 배정 (1:1 관계)
4. 저장 → 감사 로그 기록
5. 차량-기사 매핑 현황 조회
```

### 4.3 고정노선 설정
```
1. [Admin/Dispatcher] 노선 관리 페이지 접근
2. 노선 템플릿 생성
   - 노선명, 상차지, 하차지
   - 운행 요일 패턴 (월~일 체크박스)
   - 기사 운임 (driverFare)
   - 청구 운임 (billingFare)
3. 기본 기사 배정 (선택)
4. 저장 → 자동으로 월간 운행 생성
```

### 4.4 일일 운행 기록
```
1. [Dispatcher] 운행 관리 페이지 접근
2. 날짜 선택 → 해당일 운행 목록 표시
3. 운행 상태 업데이트
   - 정상 운행: 확인 체크
   - 결행: 사유 입력, 공제액 자동 계산
   - 부재: 대체 기사 선택, 대차비 입력
4. 저장 → 감사 로그 기록
5. 일일 운행 현황 대시보드 확인
```

### 4.5 월 정산 처리
```
1. [Accountant] 정산 관리 페이지 접근
2. 정산 년월 선택
3. 정산 미리보기 생성
   - 기사별 운행 내역
   - 공제/추가 항목
   - 최종 지급액 계산
4. 정산 내역 검토 및 수정
5. 정산 확정 → Settlement 잠금
6. Excel 파일 내보내기
7. 정산 이력 조회
```

### 4.6 CSV 임포트 프로세스
```
1. [Admin] 임포트 페이지 접근
2. CSV 파일 선택 및 업로드
3. 컬럼 매핑 설정
   - 자동 매핑 제안
   - 수동 조정 가능
4. 데이터 검증
   - 필수 필드 검사
   - 중복 검사
   - 참조 무결성 검사
5. 시뮬레이션 결과 표시
   - 신규 추가 건수
   - 업데이트 건수
   - 오류 목록
6. 확인 후 커밋
7. 임포트 감사 로그 기록
```

---

## 5. Business Rules

### 5.1 데이터 무결성 규칙
- **운행 중복 방지**: (vehicleNumber + date + driverId) 조합 유니크
- **기사-차량 관계**: 한 시점에 차량은 한 명의 기사에게만 배정
- **정산 잠금**: 확정된 정산(Settlement)은 수정 불가
- **삭제 제한**: 운행 기록이 있는 기사/차량은 soft delete만 가능

### 5.2 정산 계산 규칙

#### 결행/부재 처리
```typescript
// 결행 시 공제
if (trip.status === 'ABSENCE') {
  deduction = trip.baseFare * 0.1; // 기본운임의 10% 공제
  trip.deductionAmount = deduction;
}

// 대차 운행 시
if (trip.status === 'SUBSTITUTE') {
  trip.substituteFare = negotiatedAmount; // 협의된 대차비
  originalDriver.deduction = trip.baseFare * 0.05; // 원 기사 5% 공제
}
```

#### 월 정산 계산
```typescript
monthlySettlement = {
  totalTrips: regularTrips.length,
  baseFare: sum(regularTrips.driverFare),
  deductions: sum(absenceDeductions + substituteDeductions),
  additions: sum(extraAllowances),
  finalAmount: baseFare - deductions + additions
}
```

### 5.3 Settlement 상태 관리
- **DRAFT**: 임시 저장, 수정 가능
- **CONFIRMED**: 확정, 수정 불가, 재정산 필요시 새 버전 생성
- **PAID**: 지급 완료 표시

---

## 6. Data Contracts (Draft)

### 6.1 Core Entities

#### Driver (기사)
```typescript
interface Driver {
  id: string;           // UUID
  name: string;         // 기사명
  phone: string;        // 연락처
  email?: string;       // 이메일
  businessNumber?: string; // 사업자번호
  companyName?: string;    // 상호명
  bankName?: string;       // 은행명
  accountNumber?: string;  // 계좌번호
  isActive: boolean;       // 활성 상태
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### Vehicle (차량)
```typescript
interface Vehicle {
  id: string;              // UUID
  plateNumber: string;     // 차량번호
  vehicleType: string;     // 차종 (1톤, 2.5톤, 5톤 등)
  ownership: 'OWNED' | 'CHARTER' | 'CONSIGNED'; // 고정/용차/지입
  driverId?: string;       // 배정된 기사 ID
  isActive: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### RouteTemplate (노선 템플릿)
```typescript
interface RouteTemplate {
  id: string;
  name: string;           // 노선명
  loadingPoint: string;   // 상차지
  unloadingPoint: string; // 하차지
  distance?: number;      // 거리(km)
  driverFare: number;     // 기사 운임
  billingFare: number;    // 청구 운임
  weekdayPattern: number[]; // 요일 패턴 [1,2,3,4,5] = 월~금
  defaultDriverId?: string;
  isActive: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### Trip (운행)
```typescript
interface Trip {
  id: string;
  date: Date;              // 운행일
  routeTemplateId?: string; // 고정노선 ID
  driverId: string;
  vehicleId: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE';
  
  // 운임 정보
  driverFare: number;      // 기사 운임
  billingFare: number;     // 청구 운임
  
  // 결행/대차 정보
  absenceReason?: string;
  substituteDriverId?: string;
  deductionAmount?: number;
  substituteFare?: number;
  
  // 커스텀 운행 정보
  customRoute?: {
    loadingPoint: string;
    unloadingPoint: string;
    description: string;
  };
  
  remarks?: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  createdBy: string;       // 작성자 ID
}
```

#### Settlement (정산)
```typescript
interface Settlement {
  id: string;
  yearMonth: string;       // YYYY-MM
  driverId: string;
  status: 'DRAFT' | 'CONFIRMED' | 'PAID';
  
  // 집계 정보
  totalTrips: number;
  totalBaseFare: number;
  totalDeductions: number;
  totalAdditions: number;
  finalAmount: number;
  
  // 확정 정보
  confirmedAt?: DateTime;
  confirmedBy?: string;
  paidAt?: DateTime;
  
  items: SettlementItem[];
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### SettlementItem (정산 항목)
```typescript
interface SettlementItem {
  id: string;
  settlementId: string;
  tripId?: string;         // 운행 연결
  type: 'TRIP' | 'DEDUCTION' | 'ADDITION' | 'ADJUSTMENT';
  description: string;
  amount: number;          // 양수: 수입, 음수: 공제
  date: Date;
  createdAt: DateTime;
}
```

### 6.2 Audit Log Schema
```typescript
interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'EXPORT' | 'CONFIRM';
  entityType: string;      // 'Driver', 'Vehicle', 'Trip', etc.
  entityId: string;
  changes?: JSON;          // 변경 전/후 값
  metadata?: {
    ip?: string;
    userAgent?: string;
    importFile?: string;
    recordCount?: number;
  };
  createdAt: DateTime;
}
```

---

## 7. RBAC & Audit

### 7.1 역할별 권한 매트릭스

| Resource | Action | Admin | Dispatcher | Accountant |
|----------|--------|-------|------------|------------|
| **Driver** | Create | ✅ | ✅ | ❌ |
| | Read | ✅ | ✅ | ✅ |
| | Update | ✅ | ✅ | ❌ |
| | Delete | ✅ | ❌ | ❌ |
| **Vehicle** | Create | ✅ | ❌ | ❌ |
| | Read | ✅ | ✅ | ✅ |
| | Update | ✅ | ❌ | ❌ |
| | Delete | ✅ | ❌ | ❌ |
| **RouteTemplate** | Create | ✅ | ✅ | ❌ |
| | Read | ✅ | ✅ | ✅ |
| | Update | ✅ | ✅ | ❌ |
| | Delete | ✅ | ❌ | ❌ |
| **Trip** | Create | ✅ | ✅ | ❌ |
| | Read | ✅ | ✅ | ✅ |
| | Update | ✅ | ✅ | ❌ |
| | Delete | ✅ | ✅ | ❌ |
| **Settlement** | Create | ✅ | ❌ | ✅ |
| | Read | ✅ | ✅ | ✅ |
| | Update (Draft) | ✅ | ❌ | ✅ |
| | Confirm | ✅ | ❌ | ✅ |
| | Delete | ✅ | ❌ | ❌ |
| **Import/Export** | Execute | ✅ | ❌ | ✅ |
| **Audit Log** | Read | ✅ | ❌ | ❌ |
| **System Config** | Manage | ✅ | ❌ | ❌ |

### 7.2 감사 로그 이벤트

#### 필수 추적 이벤트
1. **인증 이벤트**: 로그인, 로그아웃, 권한 변경
2. **데이터 변경**: 모든 CREATE, UPDATE, DELETE
3. **정산 이벤트**: 정산 생성, 수정, 확정
4. **대량 작업**: CSV 임포트, Excel 익스포트
5. **시스템 설정**: 권한 변경, 설정 변경

#### 로그 보존 정책
- 일반 로그: 1년
- 정산 관련 로그: 5년
- 인증/권한 로그: 3년

---

## 8. Non-Functional Requirements (NFRs)

### 8.1 성능 요구사항
- **페이지 로드**: < 2초 (P95)
- **월 정산 생성**: < 5초 (1000건 기준)
- **CSV 임포트**: < 10초 (5000건 기준)
- **동시 사용자**: 50명 동시 접속 지원
- **데이터베이스 쿼리**: < 100ms (P95)

### 8.2 가용성 & 신뢰성
- **가용성 목표**: 99.5% (월 3.6시간 다운타임 허용)
- **백업 정책**: 일일 자동 백업, 30일 보관
- **트랜잭션 보장**: 정산 처리 시 ACID 보장
- **재시도 로직**: 외부 서비스 연동 시 3회 재시도

### 8.3 보안 요구사항
- **인증**: JWT 기반, 1일 만료
- **세션 관리**: 30분 미활동 시 자동 로그아웃
- **암호화**: 비밀번호 bcrypt, 통신 HTTPS
- **SQL Injection 방지**: Prepared Statement 사용
- **XSS 방지**: 입력값 sanitization

### 8.4 모니터링 & 로깅
- **Application Metrics**:
  - Request rate, Error rate, Response time
  - Active users, Database connections
- **Business Metrics**:
  - Daily trips count
  - Settlement processing time
  - Import success/failure rate
- **Error Tracking**: Sentry 또는 유사 도구
- **로그 레벨**: Development(DEBUG), Production(INFO)

### 8.5 확장성
- **수평 확장**: 컨테이너 기반 스케일링 가능
- **데이터베이스**: Read replica 구성 가능
- **캐싱**: Redis 캐싱 레이어 추가 가능
- **CDN**: 정적 자원 CDN 적용 가능

---

## 9. Technical Architecture

### 9.1 Technology Stack
```yaml
Frontend:
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - React Query (데이터 페칭)
  - React Hook Form (폼 처리)

Backend:
  - Next.js API Routes
  - Prisma ORM
  - PostgreSQL 15
  - NextAuth.js (인증)

Infrastructure:
  - Docker & Docker Compose
  - Nginx (reverse proxy)
  - Redis (캐싱, 선택)

Development:
  - ESLint & Prettier
  - Husky (git hooks)
  - Jest & React Testing Library
```

### 9.2 Database Schema (Simplified)
```sql
-- 핵심 테이블 관계
drivers (1) <-> (0..1) vehicles
drivers (1) <-> (n) trips
drivers (1) <-> (n) settlements
route_templates (1) <-> (n) trips
settlements (1) <-> (n) settlement_items
trips (1) <-> (0..1) settlement_items
```

### 9.3 API Design Pattern
```typescript
// RESTful API 구조
GET    /api/drivers           // 목록 조회
GET    /api/drivers/:id       // 상세 조회
POST   /api/drivers           // 생성
PUT    /api/drivers/:id       // 수정
DELETE /api/drivers/:id       // 삭제

// 특수 엔드포인트
POST   /api/import/csv        // CSV 임포트
GET    /api/export/excel      // Excel 익스포트
POST   /api/settlements/:id/confirm  // 정산 확정
GET    /api/dashboard/metrics // 대시보드 메트릭
```

---

## 10. Migration & Deployment

### 10.1 데이터 마이그레이션
1. 기존 Excel/JSON 데이터 매핑 테이블 작성
2. 데이터 정제 및 검증 스크립트 개발
3. 단계별 마이그레이션 (기사 → 차량 → 노선 → 운행)
4. 병렬 운영 기간 (2주) 데이터 동기화
5. 최종 전환 및 기존 시스템 폐기

### 10.2 배포 전략
```yaml
Development:
  - Local Docker Compose
  - Hot reload 개발 환경
  - Mock 데이터 시딩

Staging:
  - Docker Compose on VM
  - Production 유사 환경
  - 실제 데이터 샘플

Production:
  - Docker Swarm or K8s
  - Blue-Green 배포
  - Database migration 자동화
```

---

## 11. [ASK] Open Questions

### 비즈니스 관련
1. **정산 주기**: 월 단위 외에 주 단위, 분기 단위 정산도 필요한가요?
2. **공제율**: 결행/대차 시 공제율(10%, 5%)이 고정인가요? 설정 가능해야 하나요?
3. **차량 관리**: 차량 정비 이력, 보험 만료일 등 추가 정보 관리가 필요한가요?
4. **운임 설정**: 거리별, 시간대별 차등 운임 적용이 필요한가요?
5. **휴일 처리**: 공휴일/임시휴일 자동 인식 및 할증 적용이 필요한가요?

### 기술 관련
6. **인증 방식**: 자체 인증 vs OAuth (Google/Kakao) 연동 중 선호하는 방식은?
7. **알림**: Email 외에 SMS, 카카오톡 알림이 필요한가요?
8. **백업**: 자동 백업 주기와 보관 기간은? (현재: 일일, 30일)
9. **모니터링**: 선호하는 모니터링 도구가 있나요? (Grafana, DataDog, etc.)
10. **클라우드**: 온프레미스 vs 클라우드(AWS/GCP/Azure) 배포 환경은?

### 운영 관련
11. **교육**: 사용자 교육 자료 및 매뉴얼 작성 범위는?
12. **지원**: 시스템 운영 지원 레벨은? (업무시간/24x7)
13. **데이터 보관**: 삭제된 데이터의 보관 기간은?
14. **감사**: 외부 감사 대응을 위한 특별 요구사항이 있나요?
15. **언어**: 다국어 지원 계획이 있나요? (현재: 한국어만)

---

## 12. Success Metrics

### 12.1 비즈니스 KPI
- 정산 처리 시간: 기존 대비 80% 단축
- 정산 오류율: < 0.1%
- 데이터 입력 시간: 50% 감소
- 시스템 만족도: NPS 40 이상

### 12.2 기술 KPI
- 시스템 가용성: > 99.5%
- 평균 응답 시간: < 200ms
- 동시 사용자: 50명 이상
- 데이터 정합성: 100%

---

## 13. Timeline (Tentative)

```
Phase 1 (Week 1-2): Foundation
- Project setup & infrastructure
- Database schema & Prisma setup
- Authentication & RBAC

Phase 2 (Week 3-4): Core Features
- Driver & Vehicle management
- Route template management
- Basic CRUD operations

Phase 3 (Week 5-6): Trip Management
- Trip recording & status
- Absence/Substitute handling
- Daily dashboard

Phase 4 (Week 7-8): Settlement
- Settlement calculation
- Preview & confirmation
- Excel export

Phase 5 (Week 9-10): Import/Export & Audit
- CSV import wizard
- Audit logging
- Admin dashboard

Phase 6 (Week 11-12): Testing & Deployment
- Integration testing
- Performance optimization
- Production deployment
```

---

**END OF SPECIFICATION**

_This specification is subject to change based on stakeholder feedback and technical constraints._