# Today's Implementation Tasks

## DB-001 Prisma 초기화
- Do: .env.local에 DATABASE_URL 설정 → npm i → npm run db:migrate → npm run db:seed
- Verify: npm run db:studio로 drivers/vehicles 테이블 보임

## API-011 Drivers API
- Do: /api/drivers (GET list/detail, POST, PUT, DELETE) + Zod DTO + 오류모델(400/404/409)
- Verify: curl 스모크(아래 implement에 제공)

## API-012 Vehicles API
- Do: /api/vehicles CRUD (ownership enum 반영, plateNumber unique)
- Verify: curl 스모크

## FE-101 DriversPage 연동
- Do: sample-data.ts 의존 제거, React Query로 /api/drivers 호출, 목록/생성/수정/삭제 동작
- Verify: 생성 후 즉시 리스트 반영(optimistic optional)