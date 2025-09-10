#!/bin/bash
# Database Restore Script
# 백업 파일로부터 데이터베이스를 복원합니다.

set -e

if [ $# -eq 0 ]; then
    echo "❌ Usage: $0 <backup_file>"
    echo "📁 Available backups:"
    ls -la ./backups/logistics_backup_*.sql 2>/dev/null || echo "   No backups found"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Restoring database from: $BACKUP_FILE"
echo "⚠️  This will overwrite the current database!"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# 데이터베이스 초기화
echo "🗑️  Dropping existing database..."
npx prisma migrate reset --force --skip-seed

# 백업 파일에서 복원
echo "📥 Restoring from backup..."
if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" < "$BACKUP_FILE"
    echo "✅ Database restored successfully!"
else
    echo "❌ DATABASE_URL not set. Please configure database connection."
    exit 1
fi

# 프리즈마 클라이언트 재생성
echo "🔧 Regenerating Prisma client..."
npx prisma generate

echo "🎉 Restore completed!"