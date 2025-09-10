# TASKS.md - Implementation Task Tracker

**Project**: Logistics Driver Management MVP  
**Updated**: 2025-01-10  
**Role**: Tech Lead  
**Principle**: 기능 우선, 타입·성능 최적화는 후순위

---

## 📊 Task Overview

| Category | Total | Completed | In Progress | Pending |
|----------|-------|-----------|-------------|---------|
| Database | 1     | 0         | 1           | 0       |
| API      | 5     | 0         | 0           | 5       |
| Frontend | 3     | 0         | 0           | 3       |
| Import   | 2     | 0         | 0           | 2       |
| Ops      | 2     | 0         | 0           | 2       |
| **Total**| **13**| **0**     | **1**       | **12**  |

---

## 🗄️ Database Tasks

### DB-001: Prisma 스키마 확인 & 마이그/시드
**Status**: 🔄 In Progress  
**Priority**: P0 - Critical  
**Estimate**: 2 hours  

**Input**:
- `prisma/schema.prisma` (existing)
- `DATABASE_URL` in `.env`

**Actions**:
```bash
# 1. Database connection test
npx prisma db push --accept-data-loss  # Dev only

# 2. Run migrations
npx prisma migrate dev --name initial

# 3. Seed database
npx prisma db seed

# 4. Verify with Studio
npx prisma studio
```

**Output**:
- Migration files in `prisma/migrations/`
- Initial records:
  - 5+ Drivers
  - 5+ Vehicles (mixed ownership)
  - 3+ RouteTemplates
  - 10+ Trips (various statuses)

**Verification**:
```sql
-- Check counts
SELECT COUNT(*) FROM drivers;
SELECT COUNT(*) FROM vehicles;
SELECT COUNT(*) FROM trips;
```

**Rollback**:
```bash
npx prisma migrate reset  # Warning: Drops all data
```

---

## 🔌 API Tasks

### API-011: Drivers API
**Status**: ⏳ Pending  
**Priority**: P0 - Critical  
**Estimate**: 4 hours  
**Depends On**: DB-001  

**Input**:
- Prisma Client configured
- Driver model in schema

**Actions**:
```typescript
// src/app/api/drivers/route.ts
export async function GET(request: Request) {
  // List with pagination (?page=1&limit=10)
  const drivers = await prisma.driver.findMany({
    where: { isActive: true },
    skip, take, orderBy: { name: 'asc' }
  });
  return NextResponse.json(drivers);
}

export async function POST(request: Request) {
  // Create with Zod validation
  const body = await request.json();
  const validated = driverSchema.parse(body);
  
  // Check phone uniqueness
  const existing = await prisma.driver.findUnique({
    where: { phone: validated.phone }
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Phone already exists' },
      { status: 409 }
    );
  }
  
  const driver = await prisma.driver.create({ data: validated });
  return NextResponse.json(driver, { status: 201 });
}
```

**Zod Schema**:
```typescript
const driverSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/),
  bankName: z.string().optional(),
  accountNumber: z.string().optional()
});
```

**Output**:
- `/api/drivers` - GET list (200)
- `/api/drivers/[id]` - GET detail (200/404)
- `/api/drivers` - POST create (201/400/409)
- `/api/drivers/[id]` - PUT update (200/404)
- `/api/drivers/[id]` - DELETE soft delete (204/404)

**Verification**:
```bash
# Test list
curl http://localhost:3000/api/drivers

# Test create
curl -X POST http://localhost:3000/api/drivers \
  -H "Content-Type: application/json" \
  -d '{"name":"테스트기사","phone":"010-1234-5678"}'

# Test duplicate phone (expect 409)
curl -X POST http://localhost:3000/api/drivers \
  -H "Content-Type: application/json" \
  -d '{"name":"다른기사","phone":"010-1234-5678"}'
```

**Rollback**: Delete created test records via Prisma Studio

---

### API-012: Vehicles API
**Status**: ⏳ Pending  
**Priority**: P0 - Critical  
**Estimate**: 3 hours  
**Depends On**: API-011  

**Input**:
- Vehicle model with ownership enum
- Driver relationship

**Actions**:
```typescript
// Handle ownership enum
const vehicleSchema = z.object({
  plateNumber: z.string().min(7).max(12),
  vehicleType: z.string(),
  ownership: z.enum(['OWNED', 'CHARTER', 'CONSIGNED']),
  driverId: z.string().uuid().nullable()
});

// Check plate uniqueness
const existing = await prisma.vehicle.findUnique({
  where: { plateNumber: validated.plateNumber }
});
```

**Output**:
- CRUD endpoints with ownership validation
- Driver assignment/unassignment

**Verification**:
```bash
# Create vehicle
curl -X POST http://localhost:3000/api/vehicles \
  -d '{"plateNumber":"12가3456","vehicleType":"1톤","ownership":"OWNED"}'

# Update driver assignment
curl -X PUT http://localhost:3000/api/vehicles/[id] \
  -d '{"driverId":"[driver-uuid]"}'
```

---

### API-013: Routes API
**Status**: ⏳ Pending  
**Priority**: P1 - High  
**Estimate**: 3 hours  
**Depends On**: DB-001  

**Input**:
- RouteTemplate model
- weekdayPattern as int[]
- Decimal fare fields

**Actions**:
```typescript
const routeSchema = z.object({
  name: z.string(),
  loadingPoint: z.string(),
  unloadingPoint: z.string(),
  weekdayPattern: z.array(z.number().min(0).max(6)),
  driverFare: z.number().positive(),
  billingFare: z.number().positive()
});

// Ensure driverFare <= billingFare
if (validated.driverFare > validated.billingFare) {
  return NextResponse.json(
    { error: 'Driver fare cannot exceed billing fare' },
    { status: 400 }
  );
}
```

**Output**:
- CRUD with weekday pattern validation
- Fare validation logic

**Verification**:
```bash
# Create route with weekday pattern
curl -X POST http://localhost:3000/api/routes \
  -d '{"name":"서울-부산","weekdayPattern":[1,2,3,4,5],"driverFare":100000,"billingFare":120000}'
```

---

### API-014: Trips API
**Status**: ⏳ Pending  
**Priority**: P1 - High  
**Estimate**: 5 hours  
**Depends On**: API-011, API-012, API-013  

**Input**:
- Trip model with status enum
- Unique constraint (vehicleId, date, driverId)

**Actions**:
```typescript
const tripSchema = z.object({
  date: z.string().datetime(),
  driverId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  routeTemplateId: z.string().uuid(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'ABSENCE', 'SUBSTITUTE']),
  deductionAmount: z.number().optional(),
  substituteDriverId: z.string().uuid().optional(),
  absenceReason: z.string().optional()
});

// Validate status-specific fields
if (status === 'ABSENCE' && !absenceReason) {
  return NextResponse.json(
    { error: 'Absence reason required' },
    { status: 400 }
  );
}

if (status === 'SUBSTITUTE' && !substituteDriverId) {
  return NextResponse.json(
    { error: 'Substitute driver required' },
    { status: 400 }
  );
}

// Check unique constraint
const existing = await prisma.trip.findFirst({
  where: { vehicleId, date, driverId }
});
if (existing) {
  return NextResponse.json(
    { error: 'Trip already exists for this vehicle/date/driver' },
    { status: 409 }
  );
}
```

**Output**:
- CRUD with unique constraint validation
- Status-specific field validation

**Verification**:
```bash
# Create trip
curl -X POST http://localhost:3000/api/trips \
  -d '{"date":"2025-01-15T09:00:00Z","driverId":"[id]","vehicleId":"[id]","status":"COMPLETED"}'

# Test duplicate (expect 409)
curl -X POST http://localhost:3000/api/trips \
  -d '{"date":"2025-01-15T09:00:00Z","driverId":"[same-id]","vehicleId":"[same-id]","status":"COMPLETED"}'
```

---

### API-015: Settlements API
**Status**: ⏳ Pending  
**Priority**: P1 - High  
**Estimate**: 6 hours  
**Depends On**: API-014  

**Input**:
- Settlement model
- `tests/settlement.test.ts` logic

**Actions**:
```typescript
// GET /api/settlements?yearMonth=2025-01&driverId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearMonth = searchParams.get('yearMonth');
  const driverId = searchParams.get('driverId');
  
  const settlements = await prisma.settlement.findMany({
    where: { yearMonth, driverId },
    include: { items: true }
  });
  return NextResponse.json(settlements);
}

// POST /api/settlements/preview
export async function POST(request: Request) {
  const { yearMonth, driverId } = await request.json();
  
  // Get trips for the month
  const trips = await prisma.trip.findMany({
    where: {
      driverId,
      date: {
        gte: new Date(`${yearMonth}-01`),
        lt: new Date(`${yearMonth}-01`).addMonths(1)
      }
    }
  });
  
  // Calculate using settlement.test.ts logic
  const regularTrips = trips.filter(t => t.status === 'COMPLETED');
  const baseFare = regularTrips.reduce((sum, t) => sum + t.driverFare, 0);
  
  const absenceTrips = trips.filter(t => t.status === 'ABSENCE');
  const absenceDeduction = absenceTrips.reduce((sum, t) => 
    sum + (t.deductionAmount || t.driverFare * 0.1), 0
  );
  
  const substituteTrips = trips.filter(t => t.status === 'SUBSTITUTE');
  const substituteDeduction = substituteTrips.reduce((sum, t) => 
    sum + (t.deductionAmount || t.driverFare * 0.05), 0
  );
  
  return NextResponse.json({
    yearMonth,
    driverId,
    totalTrips: trips.length,
    totalBaseFare: baseFare,
    totalDeductions: absenceDeduction + substituteDeduction,
    finalAmount: baseFare - absenceDeduction - substituteDeduction
  });
}

// POST /api/settlements/finalize
export async function POST(request: Request) {
  const { settlementId } = await request.json();
  
  // Check if already confirmed
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId }
  });
  
  if (settlement?.status === 'CONFIRMED') {
    return NextResponse.json(
      { error: 'Settlement already confirmed' },
      { status: 400 }
    );
  }
  
  // Update to CONFIRMED with lock
  const updated = await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      confirmedBy: userId // from session
    }
  });
  
  return NextResponse.json(updated);
}

// POST /api/settlements/export (stub)
export async function POST(request: Request) {
  return NextResponse.json({ 
    message: 'Export stub - Excel generation pending' 
  });
}
```

**Output**:
- List by yearMonth/driver
- Preview calculation
- Finalize with lock
- Export stub

**Verification**:
```bash
# Preview
curl -X POST http://localhost:3000/api/settlements/preview \
  -d '{"yearMonth":"2025-01","driverId":"[id]"}'

# Finalize
curl -X POST http://localhost:3000/api/settlements/finalize \
  -d '{"settlementId":"[id]"}'

# Test already confirmed (expect 400)
curl -X POST http://localhost:3000/api/settlements/finalize \
  -d '{"settlementId":"[same-id]"}'
```

---

## 🎨 Frontend Tasks

### FE-101: DriversPage 연동
**Status**: ⏳ Pending  
**Priority**: P2 - Medium  
**Estimate**: 4 hours  
**Depends On**: API-011  

**Input**:
- `src/app/drivers/page.tsx`
- Remove `sample-data.ts`

**Actions**:
```typescript
// React Query setup
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { data: drivers, isLoading } = useQuery({
  queryKey: ['drivers'],
  queryFn: () => fetch('/api/drivers').then(res => res.json())
});

const createMutation = useMutation({
  mutationFn: (data) => fetch('/api/drivers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  onSuccess: () => {
    queryClient.invalidateQueries(['drivers']);
    setModalOpen(false);
  },
  onError: (error) => {
    toast.error(error.message);
  }
});
```

**Output**:
- Real-time driver list
- Create/Edit/Delete modals
- Error toast notifications

**Verification**:
- Create driver → appears in list
- Edit driver → updates immediately
- Delete driver → removes from list

---

### FE-111: TripsPage 연동
**Status**: ⏳ Pending  
**Priority**: P2 - Medium  
**Estimate**: 5 hours  
**Depends On**: API-014  

**Input**:
- Table/Calendar toggle preserved
- Date filter

**Actions**:
```typescript
// Handle unique constraint errors
const createTripMutation = useMutation({
  mutationFn: (data) => fetch('/api/trips', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  onError: (error) => {
    if (error.status === 409) {
      toast.error('이미 등록된 운행입니다');
    } else {
      toast.error('운행 등록 실패');
    }
  }
});
```

**Output**:
- Date-filtered trip list
- Unique constraint error handling
- Status update dropdowns

**Verification**:
- Create duplicate trip → error message
- Change status → updates in DB

---

### FE-121: SettlementPage 연동
**Status**: ⏳ Pending  
**Priority**: P2 - Medium  
**Estimate**: 4 hours  
**Depends On**: API-015  

**Input**:
- Month/Driver selectors
- Preview/Finalize flow

**Actions**:
```typescript
// Preview calculation
const previewMutation = useMutation({
  mutationFn: ({ yearMonth, driverId }) => 
    fetch('/api/settlements/preview', {
      method: 'POST',
      body: JSON.stringify({ yearMonth, driverId })
    }).then(res => res.json())
});

// Finalize with confirmation
const finalizeMutation = useMutation({
  mutationFn: (settlementId) => 
    fetch('/api/settlements/finalize', {
      method: 'POST',
      body: JSON.stringify({ settlementId })
    }),
  onSuccess: () => {
    setLocked(true);
    toast.success('정산이 확정되었습니다');
  }
});
```

**Output**:
- Month selector → Preview button
- Preview results display
- Finalize button → Lock status
- Export stub button

**Verification**:
- Preview shows correct calculations
- Finalize locks the settlement
- Locked settlements show read-only UI

---

## 📥 Import Tasks

### IMP-201: CSV Import (drivers)
**Status**: ⏳ Pending  
**Priority**: P3 - Low  
**Estimate**: 4 hours  
**Depends On**: API-011  

**Input**:
- `templates/csv/drivers.csv`

**Actions**:
```typescript
// Parse CSV
import { parse } from 'csv-parse';

const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true
});

// Validate each row
const errors = [];
const valid = [];

for (const [index, row] of records.entries()) {
  try {
    const validated = driverSchema.parse(row);
    valid.push(validated);
  } catch (error) {
    errors.push({ row: index + 1, error: error.message });
  }
}

// Simulation response
if (errors.length > 0) {
  return NextResponse.json({
    success: false,
    errors,
    validCount: valid.length,
    errorCount: errors.length
  });
}

// Commit with transaction
const result = await prisma.$transaction(async (tx) => {
  const created = [];
  for (const driver of valid) {
    const existing = await tx.driver.findUnique({
      where: { phone: driver.phone }
    });
    if (!existing) {
      created.push(await tx.driver.create({ data: driver }));
    }
  }
  return created;
});

// Audit log
await prisma.auditLog.create({
  data: {
    action: 'IMPORT',
    entityType: 'Driver',
    metadata: { count: result.length },
    userId
  }
});
```

**Output**:
- Validation report JSON
- Success/error counts
- Audit log entry

**Verification**:
```bash
# Test with sample CSV
curl -X POST http://localhost:3000/api/import/drivers \
  -F "file=@templates/csv/drivers.csv"
```

**Rollback**: Transaction auto-rollback on error

---

### IMP-202: CSV Import (trips)
**Status**: ⏳ Pending  
**Priority**: P3 - Low  
**Estimate**: 5 hours  
**Depends On**: API-014  

**Input**:
- `templates/csv/trips.csv`

**Actions**:
```typescript
// Handle unique constraint violations
const errors = [];
const created = [];

for (const trip of valid) {
  try {
    // Check unique constraint
    const existing = await tx.trip.findFirst({
      where: {
        vehicleId: trip.vehicleId,
        date: trip.date,
        driverId: trip.driverId
      }
    });
    
    if (existing) {
      errors.push({
        row: trip.rowNumber,
        error: 'Duplicate trip'
      });
    } else {
      created.push(await tx.trip.create({ data: trip }));
    }
  } catch (error) {
    errors.push({
      row: trip.rowNumber,
      error: error.message
    });
  }
}

// Partial success option
if (errors.length > 0 && !allowPartial) {
  throw new Error('Import failed with errors');
}
```

**Output**:
- Unique constraint violation report
- Partial success option
- Rollback on critical errors

**Verification**:
- Import 100 trips → success count
- Import duplicates → error report

---

## 🔧 Operations Tasks

### OPS-301: /admin/health
**Status**: ⏳ Pending  
**Priority**: P3 - Low  
**Estimate**: 2 hours  

**Actions**:
```typescript
// src/app/admin/health/route.ts
export async function GET() {
  const dbCheck = await prisma.$queryRaw`SELECT 1`;
  const migrations = await prisma.$queryRaw`
    SELECT migration_name, finished_at 
    FROM _prisma_migrations 
    ORDER BY finished_at DESC 
    LIMIT 1
  `;
  
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    database: 'connected',
    lastMigration: migrations[0]?.migration_name,
    logLevel: process.env.LOG_LEVEL || 'info'
  });
}
```

**Verification**:
```bash
curl http://localhost:3000/admin/health
# Expected: {"status":"healthy","timestamp":"...","database":"connected"}
```

---

### OPS-310: RUNBOOK & RELEASE_NOTES
**Status**: ⏳ Pending  
**Priority**: P3 - Low  
**Estimate**: 3 hours  

**RUNBOOK.md**:
```markdown
# Deployment Runbook

## Quick Start
\`\`\`bash
# 1. Clone repository
git clone [repo-url]
cd logistics-driver-management

# 2. Environment setup
cp .env.example .env
# Edit DATABASE_URL, NEXTAUTH_SECRET

# 3. Start services
docker-compose up -d

# 4. Database setup
npx prisma migrate deploy
npx prisma db seed

# 5. Verify
curl http://localhost:3000/admin/health
\`\`\`

## Environment Variables
- DATABASE_URL: PostgreSQL connection string
- NEXTAUTH_SECRET: Random 64+ character string
- NEXTAUTH_URL: Application URL

## Backup/Restore
\`\`\`bash
# Backup
docker exec postgres pg_dump -U user logistics > backup.sql

# Restore
docker exec -i postgres psql -U user logistics < backup.sql
\`\`\`

## Schema Version
Check current: SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1;
```

**RELEASE_NOTES.md**:
```markdown
# Release Notes v1.0.0

## Features
- Driver management CRUD
- Vehicle management with ownership types
- Route templates with weekday patterns
- Trip recording with unique constraints
- Settlement calculation and locking
- CSV import for bulk data

## Known Issues
- Excel export is stub only
- No email notifications yet

## Breaking Changes
- None (initial release)
```

**Verification**:
- Follow RUNBOOK on fresh environment
- Successful startup = RUNBOOK works

---

## 📊 Task Priority Matrix

| Priority | Tasks | Total Hours |
|----------|-------|-------------|
| **P0 - Critical** | DB-001, API-011, API-012 | 9 hours |
| **P1 - High** | API-013, API-014, API-015 | 14 hours |
| **P2 - Medium** | FE-101, FE-111, FE-121 | 13 hours |
| **P3 - Low** | IMP-201, IMP-202, OPS-301, OPS-310 | 14 hours |
| **Total** | 13 tasks | **50 hours** |

---

## 🎯 Definition of Done

### Per Task
- [ ] Code compiles without errors
- [ ] Basic happy path works
- [ ] Error cases return proper status codes
- [ ] Verification steps pass
- [ ] Rollback documented (if applicable)

### Sprint Complete
- [ ] All P0 tasks complete
- [ ] Database has sample data
- [ ] APIs respond to curl tests
- [ ] Frontend shows real data
- [ ] docker-compose up works

---

## 🚀 Quick Commands

```bash
# Start everything
docker-compose up

# Reset database
npx prisma migrate reset

# Test API
curl http://localhost:3000/api/drivers

# Check health
curl http://localhost:3000/admin/health

# View database
npx prisma studio
```

---

**Last Updated**: 2025-01-10  
**Next Review**: After P0 tasks complete