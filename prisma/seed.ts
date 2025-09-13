import { PrismaClient, UserRole, VehicleOwnership, TripStatus, SettlementStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. 사용자 생성
  console.log('👤 Creating users...')
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@logistics.com' },
    update: {},
    create: {
      email: 'admin@logistics.com',
      name: '관리자',
      password: await hash('admin123!', 12),
      role: UserRole.ADMIN,
      isActive: true
    }
  })

  const dispatcherUser = await prisma.user.upsert({
    where: { email: 'dispatcher@logistics.com' },
    update: {},
    create: {
      email: 'dispatcher@logistics.com',
      name: '배차담당자',
      password: await hash('dispatcher123!', 12),
      role: UserRole.DISPATCHER,
      isActive: true
    }
  })

  const accountantUser = await prisma.user.upsert({
    where: { email: 'accountant@logistics.com' },
    update: {},
    create: {
      email: 'accountant@logistics.com',
      name: '정산담당자',
      password: await hash('accountant123!', 12),
      role: UserRole.ACCOUNTANT,
      isActive: true
    }
  })

  // 2. 기사 생성 (빈 배열)
  console.log('🚛 Skipping drivers creation...')
  const drivers = []

  // 3. 차량 생성 (빈 배열)
  console.log('🚗 Skipping vehicles creation...')
  const vehicles = []

  // 4. 노선 템플릿 생성 (빈 배열)
  console.log('🛣️ Skipping route templates creation...')
  const routeTemplates = []

  // 5. 샘플 운행 기록 생성 (건너뛰기)
  console.log('📅 Skipping sample trips creation...')
  const tripCount = 0

  console.log(`✅ Database seeding completed!`)
  console.log(`📊 Created:`)
  console.log(`   - 3 users (admin, dispatcher, accountant)`)
  console.log(`   - 0 drivers (skipped)`)
  console.log(`   - 0 vehicles (skipped)`)
  console.log(`   - 0 route templates (skipped)`)
  console.log(`   - 0 sample trips (skipped)`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })