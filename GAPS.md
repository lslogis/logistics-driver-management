# 🔍 GAPS.md - 구현 격차 상세 분석

**감사 일시**: 2025-09-11  
**기준**: SPEC.md의 MVP 요구사항 대비

---

## 📋 미완료/불완전 항목 상세

### ❌ **완전 미구현 항목**

#### 1. Frontend - Vehicles 관리 페이지
- **경로**: `src/app/vehicles/page.tsx`
- **상태**: 파일 존재하지 않음
- **사유**: Vehicles API는 완전 구현되었으나 프론트엔드 페이지 미구현
- **최소 요구사항**: 
  - 차량 목록 조회 (페이지네이션)
  - 차량 등록 모달 (차량번호, 차종, 소유권)
  - 차량 수정/삭제 기능
  - 기사 배정 기능
  - React Query 연동

#### 2. Frontend - Routes 관리 페이지  
- **경로**: `src/app/routes/page.tsx`
- **상태**: 파일 존재하지 않음
- **사유**: Routes API는 완전 구현되었으나 프론트엔드 페이지 미구현
- **최소 요구사항**:
  - 노선 목록 조회 (페이지네이션)
  - 노선 등록 모달 (노선명, 상차지, 하차지, 요일패턴)
  - 노선 수정/삭제 기능
  - 기사 배정 기능
  - React Query 연동

#### 3. Frontend - Trips 관리 페이지
- **경로**: `src/app/trips/page.tsx`  
- **상태**: 파일 존재하지 않음
- **사유**: Trips API는 완전 구현되었으나 프론트엔드 페이지 미구현
- **최소 요구사항**:
  - 운행 목록 조회 (날짜별 필터)
  - 운행 등록 모달 (기사, 차량, 노선 선택)
  - 운행 상태 변경 (완료, 결행, 대차)
  - 일일 현황 대시보드
  - React Query 연동

---

### ⚠️ **부분 구현 항목**

#### 4. Frontend - Settlements 페이지 API 연동
- **경로**: `src/app/settlements/page.tsx`
- **상태**: UI는 구현되었으나 API 연동 미완료
- **사유**: 페이지는 로딩 상태만 표시하고 실제 데이터 조회하지 않음
- **최소 요구사항**:
  - useQuery로 정산 목록 조회
  - 정산 생성 useMutation 연동
  - 정산 확정 기능 연동
  - Excel 다운로드 기능 연동
  - 에러 처리 및 토스트 알림

#### 5. Frontend - Import 페이지들 API 연동
- **경로**: `src/app/import/drivers/page.tsx`, `src/app/import/trips/page.tsx`
- **상태**: UI는 구현되었으나 API 연동 미완료
- **사유**: 페이지는 존재하지만 파일 업로드 및 처리 로직 미연동
- **최소 요구사항**:
  - 파일 업로드 useMutation 연동
  - 업로드 진행상태 표시
  - 결과 데이터 표시
  - 에러 처리 및 검증 결과 표시

#### 6. API - Authentication 개발환경 설정
- **경로**: NextAuth 설정
- **상태**: 인증 시스템은 구현되었으나 개발환경에서 테스트 어려움
- **사유**: 모든 API 엔드포인트가 인증 필요하여 개발/테스트 시 불편
- **최소 요구사항**:
  - 개발환경에서 인증 우회 옵션
  - 또는 테스트용 계정 자동 생성
  - API 문서화 시 인증 토큰 포함

---

## 📊 격차 영향도 분석

### Critical (즉시 해결 필요)
1. **Vehicles 페이지**: 차량 관리 없이는 운행 배정 불가
2. **Routes 페이지**: 고정노선 관리 없이는 정산 계산 불가  
3. **Settlements API 연동**: 정산은 MVP의 핵심 기능

### High (빠른 시일 내 해결)
1. **Trips 페이지**: 일일 운행 관리의 핵심
2. **Import API 연동**: 대량 데이터 처리 기능

### Medium (개발 효율성)
1. **Authentication 개발환경**: 개발자 생산성 향상

---

## 🎯 해결 전략

### Phase 1: 핵심 페이지 완성 (우선순위)
1. **Vehicles 페이지** → 차량 등록/관리 가능
2. **Routes 페이지** → 노선 등록/관리 가능
3. **Settlements API 연동** → 정산 기능 완성

### Phase 2: 운영 완성
1. **Trips 페이지** → 일일 운행 관리 완성
2. **Import 연동** → 대량 처리 기능 완성

### Phase 3: 개발 경험 개선
1. **Auth 개발환경** → 개발/테스트 편의성 향상

---

## 📋 파일별 정확한 요구사항

```typescript
// 1. src/app/vehicles/page.tsx - 필수 구현
export default function VehiclesPage() {
  // - useQuery: vehicles 목록 조회
  // - useMutation: 차량 등록/수정/삭제
  // - 페이지네이션, 검색, 필터
  // - 모달: 등록/수정/기사배정
}

// 2. src/app/routes/page.tsx - 필수 구현  
export default function RoutesPage() {
  // - useQuery: routes 목록 조회
  // - useMutation: 노선 등록/수정/삭제
  // - 요일패턴 선택 UI
  // - 모달: 등록/수정/기사배정
}

// 3. src/app/trips/page.tsx - 필수 구현
export default function TripsPage() {
  // - useQuery: trips 목록 조회
  // - useMutation: 운행 등록/상태변경
  // - 날짜 필터, 상태 필터
  // - 결행/대차 처리 모달
}

// 4. src/app/settlements/page.tsx - API 연동 추가
// 기존 UI + React Query 연동 필요

// 5. src/app/import/*/page.tsx - API 연동 추가  
// 기존 UI + 파일 업로드 연동 필요
```

---

**총 격차 요약**: 프론트엔드 3개 페이지 신규 구현 + 2개 페이지 API 연동 완성 필요