#!/bin/bash
# Database Backup Script
# 데이터베이스를 백업합니다.

set -e

# 환경 변수 설정
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="logistics_backup_${TIMESTAMP}.sql"

# 백업 디렉토리 생성
mkdir -p ${BACKUP_DIR}

echo "📦 Creating database backup..."
echo "🗂️ Backup location: ${BACKUP_DIR}/${BACKUP_FILE}"

# PostgreSQL 백업 (환경에 따라 수정 필요)
if [ -n "$DATABASE_URL" ]; then
    # DATABASE_URL에서 연결 정보 추출
    pg_dump "$DATABASE_URL" > "${BACKUP_DIR}/${BACKUP_FILE}"
    echo "✅ Backup completed: ${BACKUP_FILE}"
    
    # 30일 이상 된 백업 파일 삭제
    find ${BACKUP_DIR} -name "logistics_backup_*.sql" -mtime +30 -delete
    echo "🧹 Old backups (30+ days) cleaned up"
else
    echo "❌ DATABASE_URL not set. Please configure database connection."
    exit 1
fi

echo "📊 Backup size: $(du -h ${BACKUP_DIR}/${BACKUP_FILE} | cut -f1)"