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

## 4. 상세 사용자 여정 (Detailed User Journeys)

### 4.1 기사 등록 및 관리 워크플로

#### 신규 기사 등록 여정
```
사용자: [Admin/Dispatcher]
시나리오: 새로운 운송기사 등록

1. 로그인 → 메인 대시보드 접근
2. 사이드바 → "기사 관리" 메뉴 클릭
3. 기사 목록 페이지 → "신규 기사 등록" 버튼 클릭
4. 기사 등록 폼 화면:
   ■ 필수 정보 입력
     - 성명 (한글, 2-10자, 중복 허용)
     - 연락처 (010-XXXX-XXXX, 중복 불가)
   ■ 선택 정보 입력
     - 이메일 주소 (validation: email format)
     - 사업자등록번호 (XXX-XX-XXXXX 형식)
     - 상호명 (사업자인 경우)
     - 대표자명 (법인인 경우)
     - 정산용 은행명/계좌번호
     - 특이사항/비고
5. 실시간 검증:
   - 연락처 중복 검사 (API 호출)
   - 사업자번호 유효성 검증 (선택)
6. 저장 시 트랜잭션:
   - Driver 레코드 생성
   - AuditLog 자동 생성 (CREATE action)
   - 성공 시 목록 페이지로 리다이렉트
7. 오류 처리:
   - 네트워크 오류 → 재시도 버튼 제공
   - 유효성 검사 실패 → 인라인 에러 메시지
   - 서버 오류 → 관리자 연락 안내
```

#### 기사 정보 조회/수정 여정
```
사용자: [Admin/Dispatcher]  
시나리오: 등록된 기사 정보 조회 및 수정

1. 기사 목록 페이지 접근
2. 검색/필터링 기능:
   - 이름 검색 (부분 매칭)
   - 연락처 검색 (부분 매칭)
   - 활성상태 필터 (전체/활성/비활성)
   - 차량 배정 상태 필터 (전체/배정됨/미배정)
3. 페이지네이션 (기본 20개/페이지)
4. 기사 상세 정보 클릭:
   - 기본 정보 (읽기 전용)
   - 차량 배정 현황 (링크 제공)
   - 최근 운행 이력 (최근 30일)
   - 월별 정산 이력 (링크 제공)
5. 수정 권한 확인 → "수정" 버튼 클릭
6. 수정 폼:
   - 연락처 외 모든 정보 수정 가능
   - 활성/비활성 토글 (운행 기록 확인 후)
7. 저장 시:
   - 변경사항 감지 (dirty checking)
   - AuditLog 생성 (변경 전/후 값 기록)
   - 낙관적 잠금 (updatedAt 버전 체크)
```

### 4.2 차량 등록 및 기사 배정 워크플로

#### 신규 차량 등록 여정
```
사용자: [Admin]
시나리오: 새로운 운송차량 등록 및 기사 배정

1. 차량 관리 페이지 접근 (권한 확인)
2. "신규 차량 등록" 버튼 클릭
3. 차량 등록 폼:
   ■ 필수 정보
     - 차량번호 (XX가XXXX 형식, 중복 불가)
     - 차종 (1톤/2.5톤/3.5톤/5톤/기타)
     - 소유권 구분 (라디오 버튼):
       • 고정(OWNED): 자사 소유 차량
       • 용차(CHARTER): 임시 임차 차량  
       • 지입(CONSIGNED): 기사 소유, 회사 위탁
   ■ 선택 정보
     - 적재중량 (톤, 소수점 1자리)
     - 제조년도 (YYYY)
     - 비고사항
4. 기사 배정 섹션:
   - 드롭다운: 미배정 기사 목록
   - 검색 기능: 기사명/연락처로 필터링
   - "배정 안함" 옵션 (나중에 배정 가능)
5. 저장 전 확인:
   - 차량번호 중복 검사
   - 선택한 기사의 기존 차량 배정 해제 확인
6. 트랜잭션 처리:
   - Vehicle 레코드 생성
   - Driver 레코드 업데이트 (차량 배정)
   - AuditLog 생성 (차량 생성 + 기사 배정)
```

#### 차량-기사 매핑 관리 여정
```
사용자: [Admin]
시나리오: 기존 차량의 기사 배정 변경

1. 차량 목록 → 특정 차량 선택
2. 차량 상세 정보:
   - 현재 배정 기사 정보
   - 차량 운행 이력 (최근 30일)
   - 정비 이력 (향후 기능)
3. "기사 변경" 버튼 클릭
4. 기사 변경 모달:
   - 현재 기사: [기사명] (연락처)
   - 신규 배정할 기사 선택
   - 변경 사유 입력 (필수)
   - 적용 일자 선택 (기본: 오늘)
5. 변경 시 확인사항:
   - 기존 기사의 미완료 운행 있는지 확인
   - 신규 기사의 다른 차량 배정 해제 확인
6. 배정 변경 처리:
   - 기존 기사 배정 해제 (driverId = null)
   - 신규 기사 배정 (driverId = newDriverId)
   - AuditLog 상세 기록 (변경 사유 포함)
```

### 4.3 고정노선 설정 및 관리 워크플로

#### 노선 템플릿 생성 여정
```
사용자: [Admin/Dispatcher]
시나리오: 정기 운행 노선 템플릿 설정

1. 노선 관리 페이지 접근
2. "새 노선 추가" 버튼 클릭  
3. 노선 기본 정보 입력:
   - 노선명 (예: "서울-부산 일반화물")
   - 상차지 주소/상세 (자동완성 지원)
   - 하차지 주소/상세 (자동완성 지원)
   - 예상 거리 (km, 선택사항)
4. 운임 설정:
   - 기사 운임 (원, 필수)
   - 청구 운임 (원, 필수)
   - 운임 유효성 검사: 기사운임 ≤ 청구운임
5. 운행 패턴 설정:
   - 요일별 체크박스 (월/화/수/목/금/토/일)
   - 운행 시작일 (기본: 다음 월요일)
   - 운행 종료일 (기본: 무제한, 선택 가능)
6. 기본 기사 배정 (선택):
   - 활성 기사 목록에서 선택
   - "매번 지정" 옵션 (기본값)
7. 저장 후 자동 처리:
   - RouteTemplate 레코드 생성
   - 향후 30일간 운행 일정 자동 생성 (배치 작업)
   - 생성된 Trip 레코드 건수 표시
```

#### 노선별 운행 계획 조회/수정
```
사용자: [Admin/Dispatcher]
시나리오: 생성된 노선의 운행 계획 확인 및 조정

1. 노선 목록 → 특정 노선 선택
2. 노선 상세 화면:
   ■ 기본 정보 (읽기 전용)
   ■ 운행 통계
     - 이번 달 총 운행 횟수
     - 완료/예정/결행 현황
     - 평균 운임
   ■ 향후 운행 일정 (캘린더 뷰)
     - 날짜별 배정 기사 표시
     - 상태별 색상 구분
3. 개별 운행 수정:
   - 날짜 클릭 → 운행 상세 팝업
   - 기사 변경/운임 조정/취소 가능
   - 변경 시 사유 입력 필수
4. 대량 수정 기능:
   - 기간 선택 → 일괄 기사 변경
   - 휴일 일괄 취소
   - 운임 일괄 조정
```

### 4.4 일일 운행 기록 및 상태 관리

#### 당일 운행 현황 관리 여정
```
사용자: [Dispatcher]  
시나리오: 당일 운행 현황 파악 및 상태 업데이트

1. 로그인 → 대시보드 (당일 현황 요약)
2. "운행 관리" 메뉴 → 일일 운행 페이지
3. 날짜 선택 (기본: 오늘):
   - 달력 컴포넌트
   - 이전/다음 날짜 이동 버튼  
4. 당일 운행 목록 조회:
   ■ 필터 옵션
     - 전체/예정/완료/결행/대차
     - 노선별 필터
     - 기사별 필터
   ■ 정렬 옵션
     - 출발 시간순
     - 노선별 그룹핑
     - 기사별 그룹핑
5. 운행 상태 업데이트 (인라인 편집):
   ■ 정상 완료 처리
     - 체크박스 클릭 → COMPLETED 상태로 변경
     - 실제 운임 입력 (기본값: 계획 운임)
   ■ 결행 처리
     - "결행" 버튼 클릭
     - 결행 사유 선택/입력 (필수)
       • 기사 개인사유
       • 차량 고장
       • 날씨
       • 화주 취소  
       • 기타 (직접 입력)
     - 공제액 자동 계산 (기사운임 × 10%)
     - 확인 후 ABSENCE 상태로 변경
   ■ 대차 처리  
     - "대차" 버튼 클릭
     - 원 기사 부재 사유 입력
     - 대체 기사 선택 (활성 기사 중)
     - 대차비 입력 (협의된 금액)
     - 원 기사 공제율 적용 (기사운임 × 5%)
     - SUBSTITUTE 상태로 변경
6. 실시간 현황 업데이트:
   - WebSocket 연결로 실시간 상태 동기화
   - 변경사항 자동 저장
   - 다른 사용자 동시 편집 방지
```

#### 예외 상황 처리 워크플로
```
사용자: [Dispatcher]
시나리오: 긴급 상황 대응 (차량 고장, 기사 응급상황)

1. 긴급 상황 알림 수신:
   - 기사 직접 연락
   - 모바일 앱 알림 (향후 기능)
2. 긴급 대응 모드 진입:
   - 해당 운행 검색/선택
   - "긴급 상황" 플래그 활성화
3. 대체 방안 검토:
   ■ 당일 가용 자원 확인
     - 미배정 기사 목록
     - 여유 차량 목록
     - 당일 완료된 기사 목록
   ■ 고객 협의 옵션
     - 운행 연기
     - 부분 운송
     - 외부 용차 활용
4. 대체 운행 생성:
   - 기존 운행 취소 처리
   - 새 운행 스케줄 생성
   - 관련자 알림 (기사/고객)
5. 사후 처리:
   - 사고 보고서 작성
   - 보험 처리 연계
   - 재발 방지 대책 수립
```

### 4.5 월별 정산 처리 및 확정 워크플로

#### 월 정산 생성 및 검토 여정
```
사용자: [Accountant]
시나리오: 매월 말일 기사별 정산 처리

1. 정산 관리 메뉴 접근 (권한 확인)
2. 정산 대상 월 선택:
   - 년/월 드롭다운 (기본: 이전 월)
   - 정산 가능 기간 제한 (당월-3개월)
3. 정산 대상 기사 확인:
   - 해당 월 운행 기록이 있는 기사 목록
   - 기사별 운행 통계 미리보기
4. 정산 생성 옵션:
   ■ 전체 기사 일괄 생성
   ■ 개별 기사 선택 생성
   ■ 기존 정산 갱신 (DRAFT 상태만)
5. 정산 계산 로직 실행:
   ```typescript
   for each driver in selectedDrivers {
     // 1. 기본 운행 집계
     trips = getTrips(driverId, yearMonth)
     totalTrips = trips.length
     totalBaseFare = sum(trips.driverFare)
     
     // 2. 공제 항목 계산
     absenceDeductions = sum(trips.where(status=ABSENCE).deductionAmount)
     substituteDeductions = sum(trips.where(status=SUBSTITUTE).deductionAmount)
     totalDeductions = absenceDeductions + substituteDeductions
     
     // 3. 추가 지급 항목 (수동 입력)
     totalAdditions = sum(additionalPayments)
     
     // 4. 최종 정산액
     finalAmount = totalBaseFare - totalDeductions + totalAdditions
     
     // 5. Settlement 레코드 생성
     createSettlement(driverId, yearMonth, calculated_values)
     
     // 6. SettlementItem 상세 내역 생성
     for each trip {
       createSettlementItem(trip, "TRIP", trip.driverFare)
     }
     for each deduction {
       createSettlementItem(null, "DEDUCTION", -deduction.amount)
     }
   }
   ```
6. 정산 결과 검토:
   - 기사별 정산 요약 테이블
   - 이상치 탐지 (전월 대비 ±30% 초과)
   - 검증 실패 항목 하이라이트
```

#### 정산 상세 검토 및 조정
```
사용자: [Accountant]
시나리오: 개별 기사 정산 내역 상세 검토

1. 정산 목록 → 특정 기사 정산 선택
2. 정산 상세 화면:
   ■ 기본 정보
     - 기사명/연락처
     - 정산 대상 기간  
     - 정산 상태 (DRAFT/CONFIRMED/PAID)
   ■ 운행 내역 테이블
     - 날짜별 운행 목록
     - 노선/차량/상태/운임
     - 결행/대차 표시 및 공제액
   ■ 정산 요약
     - 총 운행 횟수
     - 기본 운임 합계
     - 공제 항목 상세
     - 추가 지급 항목
     - 최종 정산액
3. 정산 조정 기능:
   ■ 추가 지급 항목 입력
     - 유류비 지원
     - 안전 운행 인센티브
     - 추석/설날 보너스
     - 기타 수당
   ■ 추가 공제 항목 입력
     - 차량 정비비
     - 과속/사고 벌금
     - 기타 공제 사유
   ■ 수동 조정
     - 운임 조정 (사유 필수)
     - 특별 할인/할증
4. 조정 내역 승인:
   - 조정 사유 상세 기록
   - 승인권자 전자서명 (향후)
   - AuditLog 상세 기록
```

#### 정산 확정 및 지급 처리
```
사용자: [Accountant/Admin]  
시나리오: 검토 완료된 정산 최종 확정

1. DRAFT 상태 정산 목록 조회
2. 개별 또는 일괄 확정 선택:
   ■ 개별 확정
     - 정산 상세 재검토
     - "확정" 버튼 클릭
   ■ 일괄 확정
     - 확정 대상 정산 체크박스 선택
     - "선택 항목 확정" 버튼
3. 확정 전 최종 검증:
   - 필수 항목 누락 확인
   - 계산 오류 재검증
   - 승인 권한 재확인
4. 확정 처리:
   ```sql
   UPDATE settlements 
   SET status = 'CONFIRMED',
       confirmedAt = CURRENT_TIMESTAMP,
       confirmedBy = currentUserId
   WHERE id IN (selectedSettlements)
     AND status = 'DRAFT'
   ```
5. 확정 후 처리:
   - 확정 알림 (기사별 SMS/Email)
   - Excel 파일 자동 생성
   - 회계 시스템 연동 (향후)
   - 지급 스케줄 등록
6. 지급 완료 처리:
   - 은행 이체 완료 후
   - 정산 상태 → PAID 업데이트
   - 지급일 기록 (paidAt)
```

### 4.6 CSV 대량 임포트 위저드 워크플로

#### 임포트 파일 준비 및 업로드
```
사용자: [Admin/Accountant]
시나리오: 기존 Excel 데이터를 시스템으로 이관

1. 임포트 메뉴 접근 (권한 확인)
2. 임포트 유형 선택:
   - 기사 정보 (drivers)
   - 차량 정보 (vehicles)  
   - 노선 템플릿 (routes)
   - 운행 기록 (trips)
3. 템플릿 다운로드:
   - 표준 CSV 템플릿 제공
   - 필수/선택 필드 가이드
   - 샘플 데이터 포함
4. 파일 업로드:
   - 드래그&드롭 지원
   - CSV 파일만 허용 (최대 10MB)
   - UTF-8 인코딩 강제
5. 파일 기본 검증:
   - 헤더 행 존재 확인
   - 컬럼 수 일치 확인
   - 레코드 수 체크 (최대 5000건)
```

#### 데이터 매핑 및 검증 단계
```
단계 1: 컬럼 매핑
- 업로드된 CSV의 컬럼명 표시
- 시스템 필드와 자동 매핑 시도
- 매핑 실패 컬럼 수동 지정
- "매핑하지 않음" 옵션 제공

단계 2: 데이터 미리보기
- 처음 10개 레코드 테이블 표시
- 매핑된 필드별 데이터 확인
- 데이터 타입 자동 감지
- 이상값 하이라이트

단계 3: 상세 검증
■ 필수 필드 검사
  - 누락된 필수 값 탐지
  - 공백/NULL 값 처리 옵션
■ 데이터 타입 검증  
  - 숫자 형식 검사
  - 날짜 형식 검사 (YYYY-MM-DD)
  - 이메일 형식 검사
■ 중복 데이터 검사
  - 업로드 파일 내 중복
  - 기존 DB 데이터와 중복
  - 중복 처리 정책 선택:
    • 건너뛰기
    • 덮어쓰기  
    • 오류로 처리
■ 참조 무결성 검사
  - 외래키 관계 검증
  - 존재하지 않는 참조 데이터 탐지
  - 자동 생성 옵션 제공
```

#### 시뮬레이션 및 커밋 처리
```
단계 4: 시뮬레이션 실행
- 실제 DB 변경 없이 처리 과정 시뮬레이션
- 처리 결과 요약:
  • 신규 생성: N건
  • 업데이트: N건  
  • 건너뜀: N건
  • 오류: N건
- 오류 상세 리포트:
  • 행 번호
  • 오류 유형
  • 오류 메시지
  • 수정 제안

단계 5: 최종 확인 및 커밋
■ 처리 결과 재확인
  - 변경 사항 요약 테이블
  - 위험도 평가 (HIGH/MEDIUM/LOW)
  - 롤백 가능성 안내
■ 백업 생성 옵션
  - 영향받는 테이블 자동 백업
  - 백업 파일명 자동 생성
■ 커밋 실행
  ```typescript
  BEGIN TRANSACTION;
  try {
    for each validRecord in importData {
      if (isNew) {
        await createRecord(record)
      } else if (isUpdate) {
        await updateRecord(record)
      }
      // AuditLog 기록
      await createAuditLog({
        action: 'IMPORT',
        entityType: importType,
        entityId: record.id,
        metadata: {
          importFile: filename,
          rowNumber: index,
          operation: isNew ? 'CREATE' : 'UPDATE'
        }
      })
    }
    COMMIT;
    showSuccess(importSummary)
  } catch (error) {
    ROLLBACK;
    showError(error.message)
  }
  ```

단계 6: 결과 리포트 및 후속 조치
- 임포트 완료 리포트 생성
- 성공/실패 통계
- 실패 레코드 재처리 옵션
- 관련 데이터 정합성 검사 제안
```

---

## 5. 핵심 비즈니스 규칙 (Core Business Rules)

### 5.1 데이터 무결성 및 중복키 관리

#### 필수 유니크 제약조건
```sql
-- 운행 중복 방지 (핵심 비즈니스 룰)
UNIQUE INDEX trips_unique_vehicle_date_driver 
ON trips (vehicleId, date, driverId);

-- 기사 연락처 유일성
UNIQUE INDEX drivers_phone_unique 
ON drivers (phone) WHERE isActive = true;

-- 차량번호 유일성
UNIQUE INDEX vehicles_plate_unique 
ON vehicles (plateNumber) WHERE isActive = true;

-- 월별 기사 정산 유일성 (정산 중복 방지)
UNIQUE INDEX settlements_unique_driver_month 
ON settlements (driverId, yearMonth);

-- 노선명 유일성
UNIQUE INDEX route_templates_name_unique 
ON route_templates (name) WHERE isActive = true;
```

#### 참조 무결성 규칙
- **Cascade Delete**: `trips` → `drivers/vehicles` (운행 기록 함께 삭제)
- **Set Null**: `vehicles.driverId` → `drivers` (기사 삭제 시 차량 배정 해제)
- **Restrict Delete**: 운행 기록이 있는 기사/차량은 물리적 삭제 불가
- **Soft Delete**: `isActive = false`로 논리적 삭제만 허용

#### 데이터 일관성 검증
```typescript
// 운행 생성 시 검증 로직
async function validateTripCreation(tripData: TripCreateInput) {
  // 1. 기사-차량 배정 확인
  const vehicle = await getVehicle(tripData.vehicleId)
  if (vehicle.driverId !== tripData.driverId) {
    throw new BusinessRuleError('DRIVER_VEHICLE_MISMATCH', 
      '해당 차량에 배정되지 않은 기사입니다.')
  }
  
  // 2. 동일 날짜 운행 중복 확인
  const existingTrip = await findTrip({
    vehicleId: tripData.vehicleId,
    date: tripData.date,
    driverId: tripData.driverId
  })
  if (existingTrip) {
    throw new BusinessRuleError('DUPLICATE_TRIP',
      '동일 차량, 동일 기사, 동일 날짜의 운행이 이미 존재합니다.')
  }
  
  // 3. 기사 활성 상태 확인
  const driver = await getDriver(tripData.driverId)
  if (!driver.isActive) {
    throw new BusinessRuleError('INACTIVE_DRIVER',
      '비활성화된 기사는 운행에 배정할 수 없습니다.')
  }
  
  // 4. 운임 유효성 검사
  if (tripData.driverFare > tripData.billingFare) {
    throw new BusinessRuleError('INVALID_FARE',
      '기사 운임이 청구 운임보다 클 수 없습니다.')
  }
}
```

### 5.2 정산 계산 규칙 및 공제 처리

#### 결행 및 대차 공제 규칙
```typescript
// 정산 계산 핵심 로직
interface DeductionRule {
  absenceRate: 0.10;    // 결행 시 10% 공제
  substituteRate: 0.05; // 대차 시 5% 공제 (원 기사)
}

// 결행 처리 (ABSENCE)
function processAbsence(trip: Trip): SettlementDeduction {
  const deductionAmount = trip.driverFare * DeductionRule.absenceRate
  
  return {
    tripId: trip.id,
    type: 'DEDUCTION',
    description: `결행 공제 (${trip.date}, ${trip.absenceReason})`,
    amount: -deductionAmount, // 음수로 저장
    deductionRate: DeductionRule.absenceRate
  }
}

// 대차 처리 (SUBSTITUTE)  
function processSubstitute(trip: Trip): {
  originalDriverDeduction: SettlementDeduction,
  substituteDriverPayment: SettlementItem
} {
  const originalDeduction = trip.driverFare * DeductionRule.substituteRate
  
  return {
    // 원래 기사 공제
    originalDriverDeduction: {
      tripId: trip.id,
      type: 'DEDUCTION', 
      description: `대차 공제 (${trip.date}, 대체기사: ${trip.substituteDriver.name})`,
      amount: -originalDeduction,
      deductionRate: DeductionRule.substituteRate
    },
    // 대체 기사 지급
    substituteDriverPayment: {
      tripId: trip.id,
      type: 'TRIP',
      description: `대차 운행 (${trip.date})`,
      amount: trip.substituteFare || 0
    }
  }
}
```

#### 월 정산 자동 계산 알고리즘
```typescript
// 월 정산 생성 로직
async function calculateMonthlySettlement(
  driverId: string, 
  yearMonth: string
): Promise<SettlementCalculation> {
  
  // 1. 기본 운행 데이터 집계
  const trips = await getDriverTrips(driverId, yearMonth)
  const completedTrips = trips.filter(t => t.status === 'COMPLETED')
  const absenceTrips = trips.filter(t => t.status === 'ABSENCE')  
  const substituteTrips = trips.filter(t => 
    t.status === 'SUBSTITUTE' && t.driverId === driverId
  )
  
  // 2. 기본 운임 합계
  const totalBaseFare = completedTrips.reduce((sum, trip) => 
    sum + trip.driverFare, 0
  )
  
  // 3. 공제 항목 계산
  const absenceDeductions = absenceTrips.reduce((sum, trip) => 
    sum + (trip.driverFare * DeductionRule.absenceRate), 0
  )
  
  const substituteDeductions = substituteTrips.reduce((sum, trip) =>
    sum + (trip.driverFare * DeductionRule.substituteRate), 0
  )
  
  const totalDeductions = absenceDeductions + substituteDeductions
  
  // 4. 추가 지급 항목 (수동 입력분)
  const additionalPayments = await getAdditionalPayments(driverId, yearMonth)
  const totalAdditions = additionalPayments.reduce((sum, payment) => 
    sum + payment.amount, 0
  )
  
  // 5. 최종 정산액 계산
  const finalAmount = totalBaseFare - totalDeductions + totalAdditions
  
  // 6. 정산 유효성 검증
  if (finalAmount < 0) {
    throw new BusinessRuleError('NEGATIVE_SETTLEMENT', 
      '최종 정산액이 음수입니다. 공제 항목을 확인해주세요.')
  }
  
  return {
    driverId,
    yearMonth,
    totalTrips: trips.length,
    totalBaseFare,
    totalDeductions,
    totalAdditions,
    finalAmount,
    calculatedAt: new Date(),
    status: 'DRAFT'
  }
}
```

### 5.3 정산 상태 관리 및 월락(Locking) 규칙

#### 정산 상태 전이 규칙
```typescript
enum SettlementStatus {
  DRAFT = 'DRAFT',         // 초안 - 수정 가능
  CONFIRMED = 'CONFIRMED', // 확정 - 수정 불가 (월락)
  PAID = 'PAID'           // 지급완료 - 최종 상태
}

// 상태 전이 매트릭스
const VALID_STATUS_TRANSITIONS = {
  DRAFT: ['CONFIRMED'],           // 초안 → 확정만 가능
  CONFIRMED: ['PAID'],            // 확정 → 지급완료만 가능  
  PAID: []                        // 지급완료 → 변경 불가
}

// 정산 확정 처리 (월락 적용)
async function confirmSettlement(
  settlementId: string,
  confirmedBy: string
): Promise<Settlement> {
  
  const settlement = await getSettlement(settlementId)
  
  // 1. 상태 전이 검증
  if (settlement.status !== 'DRAFT') {
    throw new BusinessRuleError('INVALID_STATUS_TRANSITION',
      'DRAFT 상태의 정산만 확정할 수 있습니다.')
  }
  
  // 2. 권한 검증
  if (!hasPermission(currentUser.role, 'settlements', 'confirm')) {
    throw new AuthorizationError('정산 확정 권한이 없습니다.')
  }
  
  // 3. 데이터 무결성 최종 검증
  await validateSettlementCalculation(settlement)
  
  // 4. 월락 적용 (확정 처리)
  const confirmedSettlement = await updateSettlement(settlementId, {
    status: 'CONFIRMED',
    confirmedAt: new Date(),
    confirmedBy: confirmedBy,
    // 확정 후에는 금액 필드 수정 불가 (DB trigger로 보호)
  })
  
  // 5. 감사 로그 기록
  await createAuditLog({
    action: 'CONFIRM',
    entityType: 'Settlement',
    entityId: settlementId,
    userId: confirmedBy,
    changes: {
      status: { from: 'DRAFT', to: 'CONFIRMED' }
    },
    metadata: {
      finalAmount: settlement.finalAmount,
      confirmationReason: 'MONTHLY_SETTLEMENT_APPROVAL'
    }
  })
  
  return confirmedSettlement
}
```

#### 월락 해제 규칙 (비상 상황)
```typescript
// 비상 상황에서만 가능한 월락 해제
async function emergencyUnlockSettlement(
  settlementId: string,
  unlockReason: string,
  authorizedBy: string
): Promise<Settlement> {
  
  // 1. 최고 권한자만 가능
  if (currentUser.role !== 'ADMIN') {
    throw new AuthorizationError('관리자만 정산 잠금 해제가 가능합니다.')
  }
  
  // 2. 비상 해제 사유 필수
  if (!unlockReason || unlockReason.length < 10) {
    throw new BusinessRuleError('UNLOCK_REASON_REQUIRED',
      '잠금 해제 사유를 상세히 입력해주세요 (최소 10자).')
  }
  
  // 3. 잠금 해제 처리
  const unlockedSettlement = await updateSettlement(settlementId, {
    status: 'DRAFT',
    confirmedAt: null,
    confirmedBy: null,
    unlockedAt: new Date(),
    unlockedBy: authorizedBy,
    unlockReason: unlockReason
  })
  
  // 4. 긴급 감사 로그
  await createAuditLog({
    action: 'UPDATE',
    entityType: 'Settlement', 
    entityId: settlementId,
    userId: authorizedBy,
    changes: {
      status: { from: 'CONFIRMED', to: 'DRAFT' },
      emergency: true
    },
    metadata: {
      unlockReason,
      securityLevel: 'CRITICAL',
      requiresApproval: true
    }
  })
  
  return unlockedSettlement
}
```

### 5.4 운행 상태 변경 규칙

#### 운행 상태 전이 매트릭스
```typescript
enum TripStatus {
  SCHEDULED = 'SCHEDULED',   // 예정
  COMPLETED = 'COMPLETED',   // 완료
  ABSENCE = 'ABSENCE',       // 결행  
  SUBSTITUTE = 'SUBSTITUTE'  // 대차
}

// 허용된 상태 변경 경로
const TRIP_STATUS_TRANSITIONS = {
  SCHEDULED: ['COMPLETED', 'ABSENCE', 'SUBSTITUTE'],
  COMPLETED: ['ABSENCE'],     // 완료 → 결행 (사후 발견)
  ABSENCE: ['COMPLETED'],     // 결행 → 완료 (오입력 수정)
  SUBSTITUTE: ['COMPLETED']   // 대차 → 완료 (대차 완료)
}

// 상태 변경 시 자동 처리
async function updateTripStatus(
  tripId: string, 
  newStatus: TripStatus,
  metadata?: TripStatusChangeMetadata
): Promise<Trip> {
  
  const trip = await getTrip(tripId)
  
  // 1. 상태 전이 유효성 검사
  const allowedStatuses = TRIP_STATUS_TRANSITIONS[trip.status]
  if (!allowedStatuses.includes(newStatus)) {
    throw new BusinessRuleError('INVALID_STATUS_CHANGE',
      `${trip.status}에서 ${newStatus}로 변경할 수 없습니다.`)
  }
  
  // 2. 상태별 필수 정보 검증
  switch (newStatus) {
    case 'ABSENCE':
      if (!metadata?.absenceReason) {
        throw new BusinessRuleError('ABSENCE_REASON_REQUIRED',
          '결행 사유를 입력해주세요.')
      }
      break
      
    case 'SUBSTITUTE':
      if (!metadata?.substituteDriverId || !metadata?.substituteFare) {
        throw new BusinessRuleError('SUBSTITUTE_INFO_REQUIRED',
          '대체 기사와 대차비를 입력해주세요.')
      }
      break
  }
  
  // 3. 정산 영향 계산
  const settlementImpact = calculateSettlementImpact(trip, newStatus, metadata)
  
  // 4. 운행 상태 업데이트
  const updatedTrip = await updateTrip(tripId, {
    status: newStatus,
    ...metadata,
    deductionAmount: settlementImpact.deductionAmount,
    updatedAt: new Date()
  })
  
  // 5. 관련 정산 자동 업데이트 (DRAFT 상태만)
  await updateRelatedSettlements(trip.driverId, trip.date)
  
  return updatedTrip
}
```

### 5.5 차량 소유권별 비즈니스 규칙

#### 소유권 구분별 처리 규칙
```typescript
enum VehicleOwnership {
  OWNED = 'OWNED',         // 고정 (자차)
  CHARTER = 'CHARTER',     // 용차 (임시)
  CONSIGNED = 'CONSIGNED'  // 지입 (기사소유)
}

// 소유권별 정산 규칙
const OWNERSHIP_SETTLEMENT_RULES = {
  OWNED: {
    // 자차: 회사 소유, 기사는 운임만 지급
    driverFareRate: 1.0,      // 기사 운임 100% 지급
    companyDeduction: 0.0,    // 회사 공제 없음
    maintenanceCost: 'COMPANY' // 정비비 회사 부담
  },
  
  CHARTER: {
    // 용차: 임시 임차, 추가 비용 발생
    driverFareRate: 0.9,      // 기사 운임 90% 지급
    companyDeduction: 0.1,    // 회사 10% 공제 (임차료)
    maintenanceCost: 'SHARED' // 정비비 공동 부담
  },
  
  CONSIGNED: {
    // 지입: 기사 소유 차량, 회사는 중개만
    driverFareRate: 0.95,     // 기사 운임 95% 지급  
    companyDeduction: 0.05,   // 회사 5% 공제 (관리비)
    maintenanceCost: 'DRIVER' // 정비비 기사 부담
  }
}

// 소유권별 정산 계산
function calculateOwnershipAdjustment(
  trip: Trip,
  vehicle: Vehicle
): OwnershipAdjustment {
  
  const rules = OWNERSHIP_SETTLEMENT_RULES[vehicle.ownership]
  const adjustedFare = trip.driverFare * rules.driverFareRate
  const companyDeduction = trip.driverFare * rules.companyDeduction
  
  return {
    originalFare: trip.driverFare,
    adjustedFare: adjustedFare,
    ownershipDeduction: companyDeduction,
    ownershipType: vehicle.ownership,
    adjustmentReason: `${vehicle.ownership} 차량 소유권 조정`
  }
}
```

### 5.6 데이터 보존 및 삭제 정책

#### 데이터 라이프사이클 관리
```typescript
// 데이터 보존 기간 정책
const DATA_RETENTION_POLICY = {
  // 운행 기록: 5년 보존
  trips: {
    retentionPeriod: '5 years',
    archiveAfter: '3 years',
    deleteAfter: '5 years'
  },
  
  // 정산 기록: 7년 보존 (세법 준수)
  settlements: {
    retentionPeriod: '7 years', 
    archiveAfter: '3 years',
    deleteAfter: '7 years'
  },
  
  // 감사 로그: 등급별 차등 보존
  auditLogs: {
    general: { retentionPeriod: '1 year' },
    financial: { retentionPeriod: '5 years' },
    security: { retentionPeriod: '3 years' }
  },
  
  // 마스터 데이터: 영구 보존 (soft delete)
  drivers: { retentionPeriod: 'permanent', deletionPolicy: 'soft' },
  vehicles: { retentionPeriod: 'permanent', deletionPolicy: 'soft' }
}

// Soft Delete 구현
async function softDeleteDriver(driverId: string): Promise<void> {
  // 1. 미완료 운행 확인
  const pendingTrips = await getTripsByDriver(driverId, {
    status: ['SCHEDULED']
  })
  
  if (pendingTrips.length > 0) {
    throw new BusinessRuleError('CANNOT_DELETE_ACTIVE_DRIVER',
      '예정된 운행이 있는 기사는 삭제할 수 없습니다.')
  }
  
  // 2. Soft Delete 처리
  await updateDriver(driverId, {
    isActive: false,
    deactivatedAt: new Date(),
    deactivationReason: 'USER_REQUESTED_DELETION'
  })
  
  // 3. 차량 배정 해제
  await updateVehicles({ driverId: driverId }, { driverId: null })
  
  // 4. 감사 로그
  await createAuditLog({
    action: 'DELETE',
    entityType: 'Driver',
    entityId: driverId,
    metadata: { deletionType: 'SOFT_DELETE' }
  })
}
```

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

### 8.4 포괄적 모니터링 & 로깅 요구사항

#### 애플리케이션 메트릭 (Application Metrics)
```typescript
// 시스템 성능 지표
interface ApplicationMetrics {
  // HTTP 메트릭
  http: {
    requestRate: number;           // 초당 요청 수 (RPS)
    errorRate: number;             // 에러 비율 (%)
    responseTime: {
      p50: number;                 // 50% 응답시간 (ms)
      p95: number;                 // 95% 응답시간 (ms) 
      p99: number;                 // 99% 응답시간 (ms)
    };
    statusCodes: {
      '2xx': number;               // 성공 응답 수
      '4xx': number;               // 클라이언트 오류 수
      '5xx': number;               // 서버 오류 수
    };
  };
  
  // 데이터베이스 메트릭
  database: {
    activeConnections: number;     // 활성 연결 수
    connectionPoolUtilization: number; // 연결 풀 사용률 (%)
    queryDuration: {
      avg: number;                 // 평균 쿼리 시간 (ms)
      max: number;                 // 최대 쿼리 시간 (ms)
    };
    slowQueries: number;           // 느린 쿼리 수 (>1s)
    deadlocks: number;             // 데드락 발생 수
  };
  
  // 시스템 리소스
  system: {
    cpuUsage: number;              // CPU 사용률 (%)
    memoryUsage: number;           // 메모리 사용률 (%)
    diskUsage: number;             // 디스크 사용률 (%)
    diskIO: {
      read: number;                // 디스크 읽기 IOPS
      write: number;               // 디스크 쓰기 IOPS
    };
  };
  
  // 사용자 활동
  users: {
    activeUsers: number;           // 활성 사용자 수
    concurrentSessions: number;    // 동시 세션 수
    loginRate: number;             // 로그인 비율 (/hour)
    sessionDuration: number;       // 평균 세션 지속시간 (min)
  };
}
```

#### 비즈니스 메트릭 (Business Metrics)
```typescript
// 업무 성과 지표
interface BusinessMetrics {
  // 일일 운행 통계
  dailyOperations: {
    totalTrips: number;            // 총 운행 수
    completedTrips: number;        // 완료된 운행 수
    absenceTrips: number;          // 결행된 운행 수
    substituteTrips: number;       // 대차 운행 수
    completionRate: number;        // 운행 완료율 (%)
    
    // 운행 상태별 비율
    statusDistribution: {
      scheduled: number;           // 예정 (%)
      completed: number;           // 완료 (%)
      absence: number;             // 결행 (%)
      substitute: number;          // 대차 (%)
    };
  };
  
  // 정산 처리 성과
  settlements: {
    processingTime: {
      draft: number;               // 정산 생성 시간 (ms)
      calculation: number;         // 계산 시간 (ms)
      confirmation: number;        // 확정 시간 (ms)
    };
    monthlyVolume: number;         // 월별 정산 건수
    errorRate: number;             // 정산 오류율 (%)
    automationRate: number;        // 자동화 처리 비율 (%)
  };
  
  // 임포트/익스포트 성과
  dataOperations: {
    importSuccess: number;         // 성공한 임포트 수
    importFailure: number;         // 실패한 임포트 수
    importDuration: number;        // 평균 임포트 시간 (s)
    recordsProcessed: number;      // 처리된 레코드 수
    dataQualityScore: number;      // 데이터 품질 점수 (0-100)
  };
  
  // 사용자 활동 패턴
  userEngagement: {
    pageViews: number;             // 페이지 뷰 수
    featureUsage: {                // 기능별 사용 빈도
      driverManagement: number;
      tripManagement: number;
      settlementProcessing: number;
      reportGeneration: number;
    };
    errorEncounters: number;       // 사용자 오류 발생 수
  };
}
```

#### 에러 추적 및 알림 (Error Tracking & Alerting)
```typescript
// 에러 분류 및 심각도
enum ErrorSeverity {
  CRITICAL = 'CRITICAL',         // 즉시 대응 필요
  HIGH = 'HIGH',                 // 1시간 내 대응
  MEDIUM = 'MEDIUM',             // 24시간 내 대응  
  LOW = 'LOW'                    // 주간 리뷰
}

interface ErrorTrackingConfig {
  // 자동 에러 감지
  detection: {
    responseTimeThreshold: 5000;   // 응답시간 임계값 (ms)
    errorRateThreshold: 5.0;       // 에러율 임계값 (%)
    databaseTimeoutThreshold: 3000; // DB 타임아웃 임계값 (ms)
    memoryUsageThreshold: 85.0;    // 메모리 사용률 임계값 (%)
  };
  
  // 알림 설정
  alerting: {
    channels: ['email', 'slack', 'sms'];
    escalation: {
      critical: {
        immediate: ['devops-team', 'tech-lead'];
        after30min: ['management'];
      };
      high: {
        immediate: ['dev-team'];
        after2hours: ['tech-lead'];
      };
    };
  };
  
  // 에러 분류
  categories: {
    'AUTHENTICATION_FAILURE': ErrorSeverity.HIGH;
    'DATABASE_CONNECTION_LOST': ErrorSeverity.CRITICAL;
    'SETTLEMENT_CALCULATION_ERROR': ErrorSeverity.HIGH;
    'CSV_IMPORT_FAILURE': ErrorSeverity.MEDIUM;
    'PERMISSION_DENIED': ErrorSeverity.MEDIUM;
  };
}
```

#### 구조화된 로깅 정책
```typescript
// 로그 레벨 및 구조
enum LogLevel {
  ERROR = 'error',     // 에러 및 예외상황
  WARN = 'warn',       // 경고 (잠재적 문제)
  INFO = 'info',       // 일반 정보 (비즈니스 이벤트)
  DEBUG = 'debug'      // 디버깅 정보 (개발환경만)
}

interface LogEntry {
  timestamp: string;           // ISO 8601 format
  level: LogLevel;
  service: string;             // 서비스명
  operation: string;           // 수행된 작업
  userId?: string;             // 사용자 ID (있는 경우)
  sessionId?: string;          // 세션 ID
  requestId?: string;          // 요청 추적 ID
  
  // 컨텍스트 정보
  context: {
    entityType?: string;       // 엔티티 타입 (Driver, Trip 등)
    entityId?: string;         // 엔티티 ID
    action?: string;           // 수행된 액션
    result?: 'SUCCESS' | 'FAILURE';
    duration?: number;         // 처리 시간 (ms)
  };
  
  // 메시지 및 상세
  message: string;             // 로그 메시지
  details?: any;               // 추가 상세 정보
  error?: {                    // 에러 정보 (에러 로그인 경우)
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  
  // 메타데이터
  metadata?: {
    userAgent?: string;
    ip?: string;
    correlationId?: string;
    tags?: string[];
  };
}
```

#### 로깅 카테고리별 상세 정책
```typescript
// 카테고리별 로깅 규칙
const LOGGING_POLICIES = {
  // 인증 및 권한
  authentication: {
    events: ['LOGIN', 'LOGOUT', 'AUTH_FAILURE', 'PERMISSION_DENIED'],
    level: LogLevel.INFO,
    retention: '3 years',
    sensitiveFields: ['password', 'token'],
    requiredFields: ['userId', 'ip', 'userAgent', 'result']
  },
  
  // 비즈니스 로직
  business: {
    events: ['SETTLEMENT_CREATED', 'TRIP_STATUS_CHANGED', 'PAYMENT_PROCESSED'],
    level: LogLevel.INFO,
    retention: '5 years',
    requiredFields: ['entityType', 'entityId', 'action', 'userId', 'result']
  },
  
  // 데이터 변경
  dataChanges: {
    events: ['CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'EXPORT'],
    level: LogLevel.INFO,
    retention: '7 years',
    includeChangeset: true,
    requiredFields: ['entityType', 'entityId', 'changes', 'userId']
  },
  
  // 시스템 에러
  errors: {
    events: ['EXCEPTION', 'TIMEOUT', 'CONNECTION_FAILURE'],
    level: LogLevel.ERROR,
    retention: '2 years',
    includeStackTrace: true,
    autoAlert: true,
    requiredFields: ['error.name', 'error.message', 'context']
  },
  
  // 성능 모니터링
  performance: {
    events: ['SLOW_QUERY', 'HIGH_MEMORY', 'RESPONSE_TIME_EXCEEDED'],
    level: LogLevel.WARN,
    retention: '6 months',
    includeMetrics: true,
    requiredFields: ['operation', 'duration', 'threshold']
  }
}
```

#### 로그 수집 및 분석 파이프라인
```yaml
LogPipeline:
  Collection:
    - Application Logs (JSON format)
    - Database Logs (PostgreSQL)
    - Container Logs (Docker)
    - Reverse Proxy Logs (Nginx)
    
  Processing:
    - Log Parsing & Enrichment
    - Correlation ID tracking
    - Sensitive data masking
    - Error categorization
    
  Storage:
    - Primary: Elasticsearch (6 months hot data)
    - Archive: S3/MinIO (long-term retention)
    - Real-time: Redis (recent logs cache)
    
  Analysis:
    - Kibana Dashboards
    - Custom metrics extraction
    - Anomaly detection
    - Trend analysis
    
  Alerting:
    - Real-time error alerts
    - Threshold-based warnings
    - Business metrics monitoring
    - SLA breach notifications
```

#### 모니터링 대시보드 구성
```typescript
// 대시보드 위젯 구성
interface MonitoringDashboard {
  // 실시간 시스템 현황
  systemOverview: {
    widgets: [
      'current_active_users',
      'response_time_chart',
      'error_rate_gauge',
      'database_connections_graph'
    ];
    refreshInterval: 30; // seconds
  };
  
  // 비즈니스 운영 현황
  businessOperations: {
    widgets: [
      'daily_trips_summary',
      'settlement_processing_status',
      'driver_utilization_chart',
      'revenue_metrics'
    ];
    refreshInterval: 300; // 5 minutes
  };
  
  // 시스템 헬스 체크
  healthCheck: {
    widgets: [
      'service_uptime_status',
      'database_health_indicator',
      'external_service_status',
      'resource_utilization_heatmap'
    ];
    refreshInterval: 60; // 1 minute
  };
  
  // 에러 및 알림
  errorTracking: {
    widgets: [
      'recent_errors_table',
      'error_trends_chart',
      'alert_history',
      'performance_issues_list'
    ];
    refreshInterval: 30; // seconds
  };
}
```

#### 성능 임계값 및 SLA 정의
```typescript
// 서비스 수준 협약 (SLA) 메트릭
interface SLATargets {
  availability: {
    target: 99.5;                  // 가용성 목표 (%)
    measurement: 'monthly';
    downtime_allowance: 3.6;       // 월간 허용 다운타임 (hours)
  };
  
  performance: {
    api_response_time: {
      p95: 200;                    // 95% 응답시간 < 200ms
      p99: 500;                    // 99% 응답시간 < 500ms
    };
    page_load_time: {
      p95: 2000;                   // 95% 페이지 로드 < 2s
    };
    settlement_processing: {
      calculation: 5000;           // 정산 계산 < 5s
      generation: 10000;           // 정산 생성 < 10s
    };
  };
  
  reliability: {
    error_rate: {
      max: 1.0;                    // 최대 에러율 < 1%
      critical_apis: 0.1;          // 핵심 API 에러율 < 0.1%
    };
    data_consistency: {
      settlement_accuracy: 99.99;   // 정산 정확도 > 99.99%
      audit_completeness: 100.0;    // 감사 로그 완전성 100%
    };
  };
}
```

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