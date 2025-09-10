# TASKS.md - Batch-2 Implementation

**Date**: 2024-12-10  
**Status**: Batch-2 Completed ✅ | Batch-3 Added  
**Docker Environment**: ✅ All development in containers

---

## ✅ Completed Tasks (Batch-2)

### API-013: Routes API ✅
**Completed**: 2025-01-10  
- Implemented `/api/routes` CRUD operations
- Added Zod validation and proper error responses
- RBAC implemented for all operations
- Response format: `{ok: boolean, data?: T, error?: {...}}`

### API-014: Trips API ✅
**Completed**: 2025-01-10  
- Implemented `/api/trips` CRUD operations  
- Added unique validation (vehicleId, date, driverId)
- Status-specific field validation working
- Complex relationships properly handled

### FE-111: TripsPage 연동 ✅
**Completed**: 2025-01-10  
- Connected to `/api/trips` with React Query
- All mutations updated for new API response format
- Error handling and toast notifications working

### FE-112: RoutesPage 연동 ✅
**Completed**: 2025-01-10  
- Created new RoutesPage with full React Query integration
- Weekday pattern selection UI implemented
- CRUD operations working with proper error handling

---

## 🔄 Batch-3 Tasks (To Implement)

## API-015: Settlements API
**Priority**: High  
**Estimated**: 4-5 hours  

**Do**:
- GET /api/settlements?yearMonth=&driverId=
- POST /api/settlements/preview - 정산 미리보기
- POST /api/settlements/finalize - 월 정산 확정 (confirmedAt/by 기록)
- POST /api/settlements/export - 엑셀 export 스텁
- Schema: Settlement with confirmedAt, confirmedBy for month lock

**Verify**:
- tests/settlement.test.ts 통과
- 경계케이스 3종: 월 중복 락, 미래 월 차단, 빈 데이터 처리

---

## FE-121: SettlementPage 연동
**Priority**: High  
**Estimated**: 3-4 hours  

**Do**:
- 월 선택 UI → preview API 호출 → 합계 표시
- Finalize 버튼 → 확정 후 UI 락
- 확정된 월은 읽기 전용 표시
- Export 버튼 (스텁 연결)

**Verify**:
- Preview → Finalize flow 정상 동작
- 확정된 월 재수정 불가 확인
- UI 상태 전환 자연스러움

---

## IMP-201: CSV Import (drivers)
**Priority**: Medium  
**Estimated**: 3-4 hours  

**Do**:
- POST /api/import/drivers
- 템플릿 헤더 고정 검증
- 시뮬레이션 모드 → 검증 결과 반환
- 커밋 모드 → 실제 저장 + 감사로그
- Duplicate handling: 이름+전화번호 기준

**Verify**:
- Valid CSV 정상 import
- Invalid data rejection with clear errors
- Audit log properly recorded

---

## IMP-202: CSV Import (trips)
**Priority**: Medium  
**Estimated**: 4-5 hours  

**Do**:
- POST /api/import/trips
- Unique constraint 충돌 리포트
- 전체 실패 우선 (부분 성공은 후순위)
- Validation: 날짜, 기사, 차량 존재 확인
- Response: 성공/실패 건수 + 상세 에러

**Verify**:
- Valid CSV import 성공
- Duplicate detection and reporting
- Foreign key validation working

---

## OPS-301: /admin/health
**Priority**: Low  
**Estimated**: 1-2 hours  

**Do**:
- GET /admin/health endpoint
- Return: version, migration status, timestamp
- Database connection check
- Simple JSON response (no auth required)

**Verify**:
- Endpoint accessible
- All status fields populated
- Database connectivity reflected

---

## Implementation Notes

**Environment**: Docker containers at http://localhost:3000  
**Database**: PostgreSQL via Docker, pgAdmin at :5050  
**API Format**: `{ok: boolean, data?: T, error?: {code, message, details?}}`  
**Commit Strategy**: One commit per completed task with clear messages

**Dependencies**:
- API-015 → FE-121 (Settlements API before frontend)
- Database migrations may be needed for Settlement lock fields

**Testing**:
- Use curl commands for API testing
- Manual frontend testing for UI flows
- Verify error scenarios and edge cases