#!/bin/bash
# Database Reset Script
# 데이터베이스를 초기 상태로 리셋하고 시드 데이터를 로드합니다.

set -e

echo "🔄 Resetting database..."

# 기존 마이그레이션과 데이터 삭제
echo "📤 Dropping existing database..."
npx prisma migrate reset --force

# 프리즈마 클라이언트 재생성
echo "🔧 Regenerating Prisma client..."
npx prisma generate

# 시드 데이터 로드
echo "🌱 Loading seed data..."
npm run db:seed

echo "✅ Database reset completed successfully!"
echo "🌍 You can view the data at: http://localhost:5555"
echo "🚀 Run 'npm run db:studio' to open Prisma Studio"