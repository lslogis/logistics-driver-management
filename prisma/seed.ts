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

  // 2. 기사 생성 (10명)
  console.log('🚛 Creating drivers...')
  const driversData = [
    {
      name: '김철수',
      phone: '010-1234-5678',
      email: 'kim@example.com',
      businessNumber: '123-45-67890',
      companyName: '철수운송',
      bankName: '국민은행',
      accountNumber: '123456-78-901234'
    },
    {
      name: '이영희',
      phone: '010-2345-6789',
      email: 'lee@example.com',
      businessNumber: '234-56-78901',
      companyName: '영희물류',
      bankName: '신한은행',
      accountNumber: '234567-89-012345'
    },
    {
      name: '박민수',
      phone: '010-3456-7890',
      businessNumber: '345-67-89012',
      companyName: '민수택배',
      bankName: '우리은행',
      accountNumber: '345678-90-123456'
    },
    {
      name: '최정훈',
      phone: '010-4567-8901',
      businessNumber: '456-78-90123',
      companyName: '정훈로지스',
      bankName: '하나은행',
      accountNumber: '456789-01-234567'
    },
    {
      name: '한상민',
      phone: '010-5678-9012',
      businessNumber: '567-89-01234',
      companyName: '상민운수',
      bankName: '기업은행',
      accountNumber: '567890-12-345678'
    },
    {
      name: '윤서진',
      phone: '010-6789-0123',
      businessNumber: '678-90-12345',
      companyName: '서진화물',
      bankName: '농협은행',
      accountNumber: '678901-23-456789'
    },
    {
      name: '강동원',
      phone: '010-7890-1234',
      businessNumber: '789-01-23456',
      companyName: '동원배송',
      bankName: '카카오뱅크',
      accountNumber: '3333-01-1234567'
    },
    {
      name: '송혜교',
      phone: '010-8901-2345',
      businessNumber: '890-12-34567',
      companyName: '혜교퀵서비스',
      bankName: '토스뱅크',
      accountNumber: '1000-1234-567890'
    },
    {
      name: '정우성',
      phone: '010-9012-3456',
      businessNumber: '901-23-45678',
      companyName: '우성글로벌',
      bankName: '수협은행',
      accountNumber: '789012-34-567890'
    },
    {
      name: '김태희',
      phone: '010-0123-4567',
      businessNumber: '012-34-56789',
      companyName: '태희익스프레스',
      bankName: '신협',
      accountNumber: '890123-45-678901'
    }
  ]

  const drivers = []
  for (const driverData of driversData) {
    const driver = await prisma.driver.upsert({
      where: { phone: driverData.phone },
      update: {},
      create: driverData
    })
    drivers.push(driver)
  }

  // 3. 차량 생성 (12대 - 기사보다 많게)
  console.log('🚗 Creating vehicles...')
  const vehiclesData = [
    { plateNumber: '12가3456', vehicleType: '1톤', ownership: VehicleOwnership.OWNED, driverId: drivers[0].id },
    { plateNumber: '23나4567', vehicleType: '2.5톤', ownership: VehicleOwnership.CHARTER, driverId: drivers[1].id },
    { plateNumber: '34다5678', vehicleType: '5톤', ownership: VehicleOwnership.CONSIGNED, driverId: drivers[2].id },
    { plateNumber: '45라6789', vehicleType: '1톤', ownership: VehicleOwnership.OWNED, driverId: drivers[3].id },
    { plateNumber: '56마7890', vehicleType: '2.5톤', ownership: VehicleOwnership.OWNED, driverId: drivers[4].id },
    { plateNumber: '67바8901', vehicleType: '5톤', ownership: VehicleOwnership.CHARTER, driverId: drivers[5].id },
    { plateNumber: '78사9012', vehicleType: '1톤', ownership: VehicleOwnership.CONSIGNED, driverId: drivers[6].id },
    { plateNumber: '89아0123', vehicleType: '11톤', ownership: VehicleOwnership.OWNED, driverId: drivers[7].id },
    { plateNumber: '90자1234', vehicleType: '2.5톤', ownership: VehicleOwnership.CHARTER, driverId: drivers[8].id },
    { plateNumber: '01차2345', vehicleType: '5톤', ownership: VehicleOwnership.OWNED, driverId: drivers[9].id },
    { plateNumber: '11카3456', vehicleType: '1톤', ownership: VehicleOwnership.OWNED, driverId: null }, // 미배정
    { plateNumber: '22타4567', vehicleType: '2.5톤', ownership: VehicleOwnership.CHARTER, driverId: null } // 미배정
  ]

  const vehicles = []
  for (const vehicleData of vehiclesData) {
    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber: vehicleData.plateNumber },
      update: {},
      create: vehicleData
    })
    vehicles.push(vehicle)
  }

  // 4. 노선 템플릿 생성 (7개)
  console.log('🛣️ Creating route templates...')
  const routesData = [
    {
      name: '서울-부산',
      loadingPoint: '서울물류센터',
      unloadingPoint: '부산신항',
      distance: 450.5,
      driverFare: 280000,
      billingFare: 350000,
      weekdayPattern: [1, 2, 3, 4, 5], // 월~금
      defaultDriverId: drivers[0].id
    },
    {
      name: '서울-대구',
      loadingPoint: '서울물류센터',
      unloadingPoint: '대구공단',
      distance: 280.3,
      driverFare: 200000,
      billingFare: 250000,
      weekdayPattern: [1, 3, 5], // 월, 수, 금
      defaultDriverId: drivers[1].id
    },
    {
      name: '인천-광주',
      loadingPoint: '인천항',
      unloadingPoint: '광주터미널',
      distance: 350.2,
      driverFare: 230000,
      billingFare: 300000,
      weekdayPattern: [2, 4], // 화, 목
      defaultDriverId: drivers[2].id
    },
    {
      name: '서울-전주',
      loadingPoint: '서울역',
      unloadingPoint: '전주시장',
      distance: 190.7,
      driverFare: 150000,
      billingFare: 200000,
      weekdayPattern: [1, 2, 3, 4, 5, 6], // 월~토
      defaultDriverId: drivers[3].id
    },
    {
      name: '부천-천안',
      loadingPoint: '부천공단',
      unloadingPoint: '천안아산역',
      distance: 85.4,
      driverFare: 80000,
      billingFare: 120000,
      weekdayPattern: [1, 2, 3, 4, 5], // 월~금
      defaultDriverId: drivers[4].id
    },
    {
      name: '의정부-춘천',
      loadingPoint: '의정부터미널',
      unloadingPoint: '춘천시외버스터미널',
      distance: 65.8,
      driverFare: 70000,
      billingFare: 100000,
      weekdayPattern: [6], // 토요일만
      defaultDriverId: drivers[5].id
    },
    {
      name: '수원-평택',
      loadingPoint: '수원역',
      unloadingPoint: '평택항',
      distance: 45.2,
      driverFare: 50000,
      billingFare: 75000,
      weekdayPattern: [1, 3, 5], // 월, 수, 금
      defaultDriverId: drivers[6].id
    }
  ]

  const routeTemplates = []
  for (const routeData of routesData) {
    const route = await prisma.routeTemplate.upsert({
      where: { name: routeData.name },
      update: {},
      create: routeData
    })
    routeTemplates.push(route)
  }

  // 5. 샘플 운행 기록 생성 (최근 1개월)
  console.log('📅 Creating sample trips...')
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1) // 한 달 전
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0) // 전달 마지막 날

  let tripCount = 0
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay()
    
    // 각 노선의 요일 패턴에 맞는 운행 생성
    for (const route of routeTemplates) {
      if (route.weekdayPattern.includes(dayOfWeek) && route.defaultDriverId) {
        // 90% 확률로 정상 운행, 5% 결행, 5% 대차
        const random = Math.random()
        let status: TripStatus = TripStatus.COMPLETED
        let absenceReason: string | null = null
        let deductionAmount: number | null = null
        let substituteDriverId: string | null = null
        let substituteFare: number | null = null

        if (random < 0.05) {
          // 결행 처리
          status = TripStatus.ABSENCE
          absenceReason = '차량 고장'
          deductionAmount = Number(route.driverFare) * 0.1 // 10% 공제
        } else if (random < 0.1) {
          // 대차 처리
          status = TripStatus.SUBSTITUTE
          // 다른 기사를 대차 기사로 설정
          const availableDrivers = drivers.filter(d => d.id !== route.defaultDriverId)
          if (availableDrivers.length > 0) {
            substituteDriverId = availableDrivers[Math.floor(Math.random() * availableDrivers.length)].id
            substituteFare = Number(route.driverFare) * 0.8 // 80% 지급
            deductionAmount = Number(route.driverFare) * 0.05 // 원 기사 5% 공제
          }
        }

        // 기사에게 배정된 차량 찾기
        const assignedVehicle = vehicles.find(v => v.driverId === route.defaultDriverId)
        if (assignedVehicle) {
          try {
            await prisma.trip.create({
              data: {
                date: new Date(date),
                driverId: route.defaultDriverId,
                vehicleId: assignedVehicle.id,
                routeTemplateId: route.id,
                status,
                driverFare: route.driverFare,
                billingFare: route.billingFare,
                absenceReason,
                deductionAmount,
                substituteDriverId,
                substituteFare,
                createdBy: adminUser.id
              }
            })
            tripCount++
          } catch (error) {
            // 중복 제약 위반 등의 경우 무시
            console.log(`Skipped duplicate trip for ${route.name} on ${date.toISOString().split('T')[0]}`)
          }
        }
      }
    }
  }

  console.log(`✅ Database seeding completed!`)
  console.log(`📊 Created:`)
  console.log(`   - ${3} users`)
  console.log(`   - ${drivers.length} drivers`)
  console.log(`   - ${vehicles.length} vehicles`)
  console.log(`   - ${routeTemplates.length} route templates`)
  console.log(`   - ${tripCount} sample trips`)
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