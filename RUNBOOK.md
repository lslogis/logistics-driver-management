# 운영 가이드 (Runbook) - 운송기사관리 시스템

**Version**: 1.0.0  
**Last Updated**: 2025-01-10  
**Target Audience**: DevOps, System Administrators, Support Engineers

---

## 🐳 Docker & Environment Setup

### 1.1 로컬 개발 환경

**필수 소프트웨어**:
```bash
Docker: >= 20.10.0
Docker Compose: >= 2.0.0
Node.js: >= 18.17.0 (development only)
```

**환경 설정**:
```bash
# 1. 저장소 클론
git clone [repository-url]
cd logistics-driver-management

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집 (아래 환경변수 섹션 참고)

# 3. Docker Compose 실행
docker-compose up -d

# 4. 데이터베이스 초기화
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed  # 개발환경만

# 5. 애플리케이션 확인
curl http://localhost:3000/api/health
```

### 1.2 필수 환경 변수

**Database Configuration (.env.local)**:
```bash
# PostgreSQL 데이터베이스 연결 (Docker Compose 환경)
DATABASE_URL="postgresql://postgres:password@db:5432/logistics_db"

# 데이터베이스 컨테이너 설정
POSTGRES_DB=logistics_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password_here

# ⚠️ 중요: Docker 환경에서는 호스트명을 'db'로 사용 (docker-compose.yml의 서비스명)
# 로컬 개발: postgresql://postgres:password@localhost:5432/logistics_db
# Docker 환경: postgresql://postgres:password@db:5432/logistics_db
```

**Authentication Configuration**:
```bash
# NextAuth.js JWT 설정
NEXTAUTH_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"

# 환경별 설정
NODE_ENV="development"  # development | production | test
```

**Application Configuration**:
```bash
# 로깅 레벨
LOG_LEVEL="info"        # debug | info | warn | error

# 업로드 디렉토리 (절대경로)
UPLOAD_DIR="/app/uploads"

# CORS 허용 도메인 (쉼표 구분)
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

**Optional Configuration**:
```bash
# Redis 캐싱 (향후 구현)
REDIS_URL="redis://redis:6379"

# 이메일 알림 (향후 구현)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# 외부 서비스 (향후 구현)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project"
```

### 1.3 포트 매핑

```yaml
Default Port Mapping:
  Application (Next.js): 3000
  PostgreSQL: 5432
  Redis (optional): 6379
  Nginx (production): 80, 443

Custom Port Override:
  APP_PORT=3001          # 애플리케이션 포트 변경
  POSTGRES_PORT=5433     # PostgreSQL 포트 변경
  REDIS_PORT=6380        # Redis 포트 변경
```

### 1.4 볼륨 마운트

```yaml
Persistent Volumes:
  ./data/postgres:/var/lib/postgresql/data     # DB 데이터
  ./data/redis:/data                           # Redis 데이터 (선택)
  ./logs:/app/logs                            # 애플리케이션 로그
  ./uploads:/app/uploads                       # 업로드 파일
  ./backups:/backups                          # 백업 파일

Development Volumes:
  .:/app                                      # 소스코드 hot reload
  /app/node_modules                           # node_modules 캐시
```

---

## 💾 백업 및 복구 절차

### 2.1 일일 자동 백업

**백업 스크립트 생성**:
```bash
#!/bin/bash
# backup.sh - 일일 백업 스크립트

BACKUP_DIR="/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="logistics_db"

# PostgreSQL 데이터베이스 백업
docker-compose exec -T db pg_dump -U postgres -d $DB_NAME > "$BACKUP_DIR/db_backup_$DATE.sql"

# 업로드 파일 백업 (CSV 파일 등)
tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" ./uploads/

# 오래된 백업 삭제 (30일 이상)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

**Cron 설정 (자동 백업)**:
```bash
# 매일 오전 2시 백업 실행
0 2 * * * /path/to/logistics-driver-management/backup.sh >> /var/log/backup.log 2>&1
```

### 2.2 수동 백업

**데이터베이스 백업**:
```bash
# 전체 백업 (스키마 + 데이터)
docker-compose exec db pg_dump -U postgres -d logistics_db > backup_full.sql

# 스키마만 백업
docker-compose exec db pg_dump -U postgres -d logistics_db --schema-only > backup_schema.sql

# 데이터만 백업
docker-compose exec db pg_dump -U postgres -d logistics_db --data-only > backup_data.sql

# 특정 테이블만 백업
docker-compose exec db pg_dump -U postgres -d logistics_db -t drivers -t vehicles > backup_masters.sql
```

**애플리케이션 파일 백업**:
```bash
# 업로드 파일 백업
tar -czf uploads_backup.tar.gz ./uploads/

# 로그 파일 백업
tar -czf logs_backup.tar.gz ./logs/

# 전체 애플리케이션 백업 (코드 제외)
tar -czf app_data_backup.tar.gz ./data/ ./uploads/ ./logs/
```

### 2.3 복구 절차

**데이터베이스 복구**:
```bash
# 1. 애플리케이션 중지
docker-compose stop app

# 2. 데이터베이스 초기화 (주의: 기존 데이터 삭제)
docker-compose exec db dropdb -U postgres logistics_db
docker-compose exec db createdb -U postgres logistics_db

# 3. 백업 파일 복원
docker-compose exec -T db psql -U postgres -d logistics_db < backup_full.sql

# 4. Prisma 클라이언트 재생성
docker-compose exec app npx prisma generate

# 5. 애플리케이션 재시작
docker-compose start app

# 6. 복구 확인
curl http://localhost:3000/api/health
```

**부분 데이터 복구**:
```bash
# 특정 테이블만 복원 (예: drivers 테이블)
docker-compose exec -T db psql -U postgres -d logistics_db -c "TRUNCATE TABLE drivers CASCADE;"
docker-compose exec -T db psql -U postgres -d logistics_db < backup_drivers.sql

# 특정 기간 데이터 복원 (예: 2025년 1월 운행 기록)
docker-compose exec -T db psql -U postgres -d logistics_db -c "
DELETE FROM trips WHERE date >= '2025-01-01' AND date < '2025-02-01';
"
# 그 후 해당 기간 백업 데이터 복원
```

**재해 복구 시나리오**:
```bash
# 1. 전체 시스템 재구축
git clone [repository-url]
cd logistics-driver-management

# 2. 환경 설정 복원
cp .env.backup .env  # 사전에 백업된 환경 설정

# 3. Docker 컨테이너 재시작
docker-compose up -d

# 4. 데이터 복원
docker-compose exec -T db psql -U postgres -d logistics_db < /backups/latest_backup.sql

# 5. 업로드 파일 복원
tar -xzf /backups/uploads_backup_latest.tar.gz

# 6. 서비스 확인
./health_check.sh
```

---

## 🔓 정산 잠금 해제 절차

### 3.1 정산 상태 확인

**정산 상태 조회 (Docker 환경)**:
```bash
# Docker를 통해 PostgreSQL 접근
docker-compose exec -T db psql -U postgres -d logistics_db << 'EOF'

-- 현재 정산 상태 확인  
SELECT 
  s.id,
  s."yearMonth",
  d.name as "driverName",
  s.status,
  s."confirmedAt",
  s."confirmedBy",
  COALESCE(u.name, 'System') as "confirmedByName"
FROM settlements s
JOIN drivers d ON s."driverId" = d.id
LEFT JOIN users u ON s."confirmedBy" = u.id
WHERE s."yearMonth" = '2025-01'
ORDER BY s."confirmedAt" DESC;

-- 잠긴 정산 개수 확인
SELECT 
  status,
  COUNT(*) as count
FROM settlements
WHERE "yearMonth" = '2025-01'
GROUP BY status;

EOF
```

**프로덕션 안전 절차**:
```bash
# 1. 현재 정산 상태 백업
docker-compose exec -T db pg_dump -U postgres -d logistics_db -t settlements > "settlements_backup_$(date +%Y%m%d_%H%M%S).sql"

# 2. 정산 상태 확인 후 잠금 해제 (API 사용 권장)
curl -X POST http://localhost:3000/api/settlements/unlock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_JWT_TOKEN" \
  -d '{
    "yearMonth": "2025-01",
    "reason": "Emergency correction required",
    "approvedBy": "supervisor-name"
  }'
```

### 3.2 비상 잠금 해제

**⚠️ 주의사항**: 정산 잠금 해제는 비즈니스 승인 후에만 실행

**단일 정산 잠금 해제**:
```sql
-- 1. 현재 상태 백업
CREATE TEMP TABLE settlement_backup AS
SELECT * FROM settlements WHERE id = 'settlement_id_here';

-- 2. 잠금 해제 (CONFIRMED → DRAFT)
UPDATE settlements 
SET 
  status = 'DRAFT',
  confirmedAt = NULL,
  confirmedBy = NULL,
  updatedAt = CURRENT_TIMESTAMP
WHERE id = 'settlement_id_here';

-- 3. 감사 로그 기록
INSERT INTO audit_logs (
  userId, userName, action, entityType, entityId,
  changes, metadata, createdAt
) VALUES (
  'admin-user-id',
  'System Administrator',
  'UPDATE',
  'Settlement',
  'settlement_id_here',
  '{"status": {"from": "CONFIRMED", "to": "DRAFT"}, "reason": "Emergency unlock by admin"}',
  '{"emergency": true, "approvedBy": "supervisor-name", "reason": "correction required"}',
  CURRENT_TIMESTAMP
);
```

**대량 정산 잠금 해제**:
```sql
-- 특정 월의 모든 CONFIRMED 정산을 DRAFT로 변경
BEGIN;

-- 백업 테이블 생성
CREATE TEMP TABLE settlement_unlock_backup AS
SELECT * FROM settlements 
WHERE yearMonth = '2025-01' AND status = 'CONFIRMED';

-- 일괄 잠금 해제
UPDATE settlements 
SET 
  status = 'DRAFT',
  confirmedAt = NULL,
  confirmedBy = NULL,
  updatedAt = CURRENT_TIMESTAMP
WHERE yearMonth = '2025-01' AND status = 'CONFIRMED';

-- 감사 로그 기록
INSERT INTO audit_logs (
  userId, userName, action, entityType, entityId,
  changes, metadata, createdAt
)
SELECT 
  'admin-user-id',
  'System Administrator',
  'UPDATE',
  'Settlement',
  id,
  '{"status": {"from": "CONFIRMED", "to": "DRAFT"}, "reason": "Bulk unlock for corrections"}',
  '{"emergency": true, "yearMonth": "2025-01", "count": ' || (SELECT COUNT(*) FROM settlement_unlock_backup) || '}',
  CURRENT_TIMESTAMP
FROM settlement_unlock_backup;

COMMIT;
```

### 3.3 정산 재계산

**정산 재계산 스크립트**:
```sql
-- 특정 기사의 특정 월 정산 재계산
WITH trip_summary AS (
  SELECT 
    driverId,
    COUNT(*) as totalTrips,
    SUM(driverFare) as totalBaseFare,
    SUM(COALESCE(deductionAmount, 0)) as totalDeductions
  FROM trips 
  WHERE driverId = 'driver_id_here'
    AND date >= '2025-01-01' AND date < '2025-02-01'
    AND status IN ('COMPLETED', 'ABSENCE', 'SUBSTITUTE')
  GROUP BY driverId
)
UPDATE settlements s
SET 
  totalTrips = ts.totalTrips,
  totalBaseFare = ts.totalBaseFare,
  totalDeductions = ts.totalDeductions,
  finalAmount = ts.totalBaseFare - ts.totalDeductions + totalAdditions,
  updatedAt = CURRENT_TIMESTAMP
FROM trip_summary ts
WHERE s.driverId = ts.driverId 
  AND s.yearMonth = '2025-01';
```

---

## 📥 CSV 임포트 재처리 절차

### 4.1 실패한 임포트 조회

**임포트 이력 확인**:
```sql
-- 임포트 감사 로그 조회
SELECT 
  id,
  userName,
  action,
  entityType,
  metadata->>'importFile' as fileName,
  metadata->>'recordCount' as recordCount,
  metadata->>'successCount' as successCount,
  metadata->>'errorCount' as errorCount,
  createdAt
FROM audit_logs 
WHERE action = 'IMPORT'
  AND createdAt >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY createdAt DESC;

-- 오류가 있는 임포트 상세 조회
SELECT 
  *
FROM audit_logs 
WHERE action = 'IMPORT'
  AND metadata->>'errorCount' != '0'
ORDER BY createdAt DESC;
```

### 4.2 임포트 데이터 롤백

**⚠️ 주의사항**: 롤백은 데이터 정합성을 위해 신중히 실행

**특정 임포트 배치 롤백**:
```sql
-- 1. 롤백할 임포트 식별
SELECT * FROM audit_logs 
WHERE id = 'audit_log_id_here' AND action = 'IMPORT';

-- 2. 해당 배치로 생성된 레코드 확인
SELECT COUNT(*) FROM drivers 
WHERE createdAt BETWEEN '2025-01-10 10:00:00' AND '2025-01-10 10:05:00';

-- 3. 롤백 실행 (예: drivers 테이블)
BEGIN;

-- 생성된 레코드 삭제
DELETE FROM drivers 
WHERE createdAt BETWEEN '2025-01-10 10:00:00' AND '2025-01-10 10:05:00'
  AND createdBy = 'import-user-id';

-- 감사 로그 기록
INSERT INTO audit_logs (
  userId, userName, action, entityType, entityId,
  changes, metadata, createdAt
) VALUES (
  'admin-user-id',
  'System Administrator', 
  'DELETE',
  'Driver',
  'BULK_ROLLBACK',
  '{"action": "rollback", "originalImport": "audit_log_id_here"}',
  '{"rollback": true, "reason": "data correction", "recordCount": ' || ROW_COUNT || '}',
  CURRENT_TIMESTAMP
);

COMMIT;
```

### 4.3 데이터 정제 및 재임포트

**CSV 파일 검증**:
```bash
#!/bin/bash
# validate_csv.sh - CSV 파일 검증 스크립트

CSV_FILE="$1"
ENTITY_TYPE="$2"  # drivers, vehicles, routes, trips

# 기본 검증
if [ ! -f "$CSV_FILE" ]; then
  echo "Error: File $CSV_FILE not found"
  exit 1
fi

# 파일 인코딩 확인
file_encoding=$(file -bi "$CSV_FILE" | cut -d';' -f2 | cut -d'=' -f2)
if [ "$file_encoding" != "utf-8" ]; then
  echo "Warning: File encoding is $file_encoding, converting to UTF-8"
  iconv -f "$file_encoding" -t UTF-8 "$CSV_FILE" > "${CSV_FILE}.utf8"
  CSV_FILE="${CSV_FILE}.utf8"
fi

# 헤더 검증
case $ENTITY_TYPE in
  "drivers")
    expected_headers="name,phone,email,businessNumber,companyName,bankName,accountNumber"
    ;;
  "vehicles")
    expected_headers="plateNumber,vehicleType,ownership,driverId"
    ;;
  "routes")
    expected_headers="name,loadingPoint,unloadingPoint,driverFare,billingFare,weekdayPattern"
    ;;
  "trips")
    expected_headers="date,driverId,vehicleId,routeTemplateId,status,driverFare,billingFare"
    ;;
esac

actual_headers=$(head -1 "$CSV_FILE")
if [ "$actual_headers" != "$expected_headers" ]; then
  echo "Error: Header mismatch"
  echo "Expected: $expected_headers"
  echo "Actual: $actual_headers"
  exit 1
fi

# 레코드 수 확인
record_count=$(wc -l < "$CSV_FILE")
record_count=$((record_count - 1))  # 헤더 제외
echo "CSV validation passed: $record_count records"
```

**재임포트 실행**:
```bash
# 1. CSV 파일 검증
./validate_csv.sh drivers_corrected.csv drivers

# 2. 백업 생성
docker-compose exec db pg_dump -U postgres -d logistics_db -t drivers > backup_before_reimport.sql

# 3. 문제 데이터 삭제 (필요시)
docker-compose exec -T db psql -U postgres -d logistics_db -c "
DELETE FROM drivers WHERE phone IN ('invalid-phone-1', 'invalid-phone-2');
"

# 4. 재임포트 실행 (API 호출)
curl -X POST http://localhost:3000/api/import/drivers \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@drivers_corrected.csv"

# 5. 임포트 결과 확인
curl http://localhost:3000/api/audit?action=IMPORT&limit=1
```

---

## 🔍 시스템 모니터링 및 헬스체크

### 5.1 헬스체크 엔드포인트

**기본 헬스체크**:
```bash
# 1. 시스템 헬스체크 (구현된 API 사용)
curl -f http://localhost:3000/api/admin/health || echo "❌ Application unhealthy"

# 2. 간단한 헬스체크 (HEAD 방식)
curl -I http://localhost:3000/api/admin/health || echo "❌ Quick health check failed"

# 3. 컨테이너 상태 확인
docker-compose ps

# 4. 데이터베이스 직접 연결 테스트
docker-compose exec db pg_isready -U postgres || echo "❌ Database unhealthy"

# 5. 애플리케이션 로그 확인
docker-compose logs --tail=50 app
```

**상세 헬스체크 스크립트**:
```bash
#!/bin/bash
# health_check.sh - 종합 시스템 헬스체크

echo "=== System Health Check ==="
echo "Timestamp: $(date)"

# 1. Docker 컨테이너 상태
echo -e "\n1. Container Status:"
docker-compose ps

# 2. 애플리케이션 응답
echo -e "\n2. Application Health:"
if curl -f -s http://localhost:3000/api/health > /dev/null; then
  echo "✅ Application: Healthy"
else
  echo "❌ Application: Unhealthy"
fi

# 3. 데이터베이스 연결
echo -e "\n3. Database Connection:"
if docker-compose exec -T db pg_isready -U postgres > /dev/null; then
  echo "✅ PostgreSQL: Connected"
else
  echo "❌ PostgreSQL: Connection failed"
fi

# 4. 디스크 사용량
echo -e "\n4. Disk Usage:"
df -h ./data/

# 5. 메모리 사용량
echo -e "\n5. Memory Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# 6. 최근 에러 로그
echo -e "\n6. Recent Errors:"
if [ -f "./logs/error.log" ]; then
  tail -5 ./logs/error.log
else
  echo "No error log found"
fi

echo -e "\n=== Health Check Complete ==="
```

### 5.2 로그 모니터링

**로그 파일 위치**:
```yaml
Application Logs:
  ./logs/app.log        # 애플리케이션 일반 로그
  ./logs/error.log      # 에러 로그
  ./logs/audit.log      # 감사 로그 (별도 파일로 저장 시)
  
Container Logs:
  docker-compose logs app     # 애플리케이션 컨테이너 로그
  docker-compose logs db      # 데이터베이스 컨테이너 로그
  docker-compose logs redis   # Redis 컨테이너 로그 (선택)
```

**로그 모니터링 스크립트**:
```bash
#!/bin/bash
# log_monitor.sh - 실시간 로그 모니터링

# 에러 로그 실시간 모니터링
tail -f ./logs/error.log | while read line; do
  if [[ $line == *"ERROR"* ]] || [[ $line == *"CRITICAL"* ]]; then
    echo "$(date): ALERT - $line"
    # 필요시 알림 전송 (이메일, Slack 등)
  fi
done &

# 데이터베이스 연결 실패 모니터링
docker-compose logs -f db | while read line; do
  if [[ $line == *"connection"* ]] && [[ $line == *"failed"* ]]; then
    echo "$(date): DB CONNECTION ALERT - $line"
  fi
done &

echo "Log monitoring started. Press Ctrl+C to stop."
wait
```

### 5.3 성능 모니터링

**데이터베이스 성능 쿼리**:
```sql
-- 느린 쿼리 조회 (PostgreSQL)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- 활성 세션 수 확인
SELECT count(*) as active_connections
FROM pg_stat_activity 
WHERE state = 'active';

-- 테이블별 사용량 통계
SELECT 
  schemaname,
  tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

**애플리케이션 메트릭** (향후 구현):
```javascript
// 예상 메트릭 수집 코드
const metrics = {
  requestCount: 0,
  errorCount: 0,
  responseTimeSum: 0,
  activeUsers: new Set(),
  databaseConnections: 0
};

// API 응답 시간 측정
function measureResponseTime(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.responseTimeSum += duration;
    metrics.requestCount++;
  });
  next();
}
```

---

## 🚨 트러블슈팅 가이드

### 6.1 일반적인 문제 및 해결방법

**문제: 애플리케이션이 시작되지 않음**
```bash
# 원인 확인
docker-compose logs app

# 일반적인 해결방법
1. 환경 변수 확인: cat .env
2. 데이터베이스 연결 확인: docker-compose exec db pg_isready
3. 마이그레이션 실행: docker-compose exec app npx prisma migrate deploy
4. 컨테이너 재시작: docker-compose restart app
```

**문제: 데이터베이스 연결 실패**
```bash
# PostgreSQL 연결 테스트
docker-compose exec db psql -U postgres -d logistics_db -c "SELECT 1;"

# 해결방법
1. 컨테이너 상태 확인: docker-compose ps db
2. 네트워크 확인: docker network ls
3. 포트 충돌 확인: netstat -tlnp | grep 5432
4. 데이터 볼륨 확인: docker volume ls
```

**문제: JWT 토큰 오류**
```bash
# JWT 토큰 검증
echo $NEXTAUTH_SECRET | wc -c  # 32자 이상이어야 함

# 해결방법
1. NEXTAUTH_SECRET 재설정
2. 기존 세션 정리: 브라우저 쿠키 삭제
3. 애플리케이션 재시작
```

### 6.2 응급 복구 절차

**서비스 완전 다운 시**:
```bash
# 1. 긴급 재시작
docker-compose down
docker-compose up -d

# 2. 데이터 무결성 확인
./health_check.sh

# 3. 백업에서 복구 (필요시)
# (섹션 2.3 복구 절차 참고)
```

**데이터 손실 의심 시**:
```bash
# 1. 즉시 서비스 중단
docker-compose stop app

# 2. 현재 상태 백업
docker-compose exec db pg_dump -U postgres -d logistics_db > emergency_backup.sql

# 3. 데이터 무결성 검사
docker-compose exec -T db psql -U postgres -d logistics_db -c "
SELECT tablename, n_live_tup 
FROM pg_stat_user_tables 
WHERE n_live_tup > 0
ORDER BY tablename;
"

# 4. 필요시 최신 백업에서 복구
```

---

## 📞 연락처 및 에스컬레이션

### 7.1 운영팀 연락처

```yaml
Primary Support:
  DevOps Engineer: [연락처]
  Database Administrator: [연락처]
  System Administrator: [연락처]

Emergency Contacts:
  On-Call Engineer: [24/7 연락처]
  Technical Lead: [연락처]
  Project Manager: [연락처]

Business Stakeholders:
  Operations Manager: [연락처]
  Finance Manager: [연락처] (정산 관련)
```

### 7.2 에스컬레이션 절차

**Severity Levels**:
- **P0 (Critical)**: 서비스 완전 중단, 데이터 손실
- **P1 (High)**: 주요 기능 장애, 성능 심각한 저하
- **P2 (Medium)**: 부분 기능 장애, 일부 사용자 영향
- **P3 (Low)**: 미미한 문제, 기능적 개선 요청

**응답 시간 목표**:
- P0: 15분 이내 응답, 1시간 이내 해결 착수
- P1: 1시간 이내 응답, 4시간 이내 해결
- P2: 4시간 이내 응답, 24시간 이내 해결
- P3: 24시간 이내 응답, 5일 이내 해결

---

## 📋 일일/주간 점검 체크리스트

### 7.3 일일 점검 (Daily)

- [ ] 애플리케이션 헬스체크 실행
- [ ] 데이터베이스 연결 상태 확인
- [ ] 자동 백업 실행 결과 확인
- [ ] 에러 로그 리뷰 (Critical/Error 레벨)
- [ ] 디스크 사용량 확인 (80% 초과 시 알림)
- [ ] 활성 사용자 수 모니터링

### 7.4 주간 점검 (Weekly)

- [ ] 백업 파일 무결성 테스트 (랜덤 복구 테스트)
- [ ] 데이터베이스 성능 리포트 생성
- [ ] 보안 로그 분석 (비정상 로그인 시도)
- [ ] 시스템 리소스 사용량 트렌드 분석
- [ ] CSV 임포트 성공률 분석
- [ ] 정산 처리 시간 성능 분석

### 7.5 월간 점검 (Monthly)

- [ ] 전체 시스템 백업 및 복구 테스트
- [ ] 보안 업데이트 적용
- [ ] 데이터베이스 VACUUM/ANALYZE 실행
- [ ] 사용량 증가 추세 분석 및 용량 계획
- [ ] 감사 로그 아카이브 (1년 이상 보관)
- [ ] 재해복구 계획 리뷰 및 업데이트

---

**Runbook 버전**: 1.0.0  
**마지막 업데이트**: 2025-01-10  
**다음 리뷰 예정**: Week 2 Sprint 완료 후

> ⚠️ **중요**: 이 문서는 운영 중 발생할 수 있는 상황에 대한 가이드입니다. 실제 운영 환경에서는 조직의 정책과 절차에 따라 조정하여 사용하시기 바랍니다.