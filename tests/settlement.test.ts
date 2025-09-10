import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { PrismaClient, TripStatus, SettlementStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { SettlementService } from '../src/lib/services/settlement.service'

// Test database instance
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/logistics_test'
    }
  }
})

const settlementService = new SettlementService(prisma)

describe('Settlement Calculation Service', () => {
  let testDriverId: string
  let testRouteId: string
  let testVehicleId: string
  let testUserId: string

  beforeEach(async () => {
    // Setup test data
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test Admin',
        role: 'ADMIN'
      }
    })
    testUserId = testUser.id

    const testDriver = await prisma.driver.create({
      data: {
        name: '테스트기사',
        phone: '010-1111-1111',
        bankName: '테스트은행',
        accountNumber: '123-456-789'
      }
    })
    testDriverId = testDriver.id

    const testVehicle = await prisma.vehicle.create({
      data: {
        plateNumber: '테스트1234',
        vehicleType: '1톤',
        ownership: 'OWNED',
        driverId: testDriverId
      }
    })
    testVehicleId = testVehicle.id

    const testRoute = await prisma.routeTemplate.create({
      data: {
        name: '테스트노선',
        loadingPoint: '출발지',
        unloadingPoint: '도착지',
        driverFare: new Decimal('100000'),
        billingFare: new Decimal('120000'),
        weekdayPattern: [1, 2, 3, 4, 5],
        defaultDriverId: testDriverId
      }
    })
    testRouteId = testRoute.id
  })

  afterEach(async () => {
    // Cleanup test data
    await prisma.trip.deleteMany()
    await prisma.routeTemplate.deleteMany()
    await prisma.vehicle.deleteMany()
    await prisma.driver.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('기본 정산 계산', () => {
    test('정상 운행만 있는 경우', async () => {
      // Given: 3번의 정상 운행
      const testDate = new Date('2025-01-15')
      for (let i = 0; i < 3; i++) {
        await prisma.trip.create({
          data: {
            date: new Date(testDate.getTime() + i * 24 * 60 * 60 * 1000),
            driverId: testDriverId,
            vehicleId: testVehicleId,
            routeTemplateId: testRouteId,
            status: TripStatus.COMPLETED,
            driverFare: new Decimal('100000'),
            billingFare: new Decimal('120000')
          }
        })
      }

      // When: 정산 계산
      const result = await settlementService.calculateMonthlySettlement(
        testDriverId,
        '2025-01'
      )

      // Then: 결과 검증
      expect(result.totalTrips).toBe(3)
      expect(result.totalBaseFare).toEqual(new Decimal('300000'))
      expect(result.totalDeductions).toEqual(new Decimal('0'))
      expect(result.totalAdditions).toEqual(new Decimal('0'))
      expect(result.finalAmount).toEqual(new Decimal('300000'))
      expect(result.items).toHaveLength(3)
      expect(result.items.every(item => item.type === 'TRIP')).toBe(true)
    })

    test('결행이 있는 경우 - 10% 공제', async () => {
      // Given: 정상 운행 2번, 결행 1번
      const testDate = new Date('2025-01-15')
      
      // 정상 운행 2번
      for (let i = 0; i < 2; i++) {
        await prisma.trip.create({
          data: {
            date: new Date(testDate.getTime() + i * 24 * 60 * 60 * 1000),
            driverId: testDriverId,
            vehicleId: testVehicleId,
            routeTemplateId: testRouteId,
            status: TripStatus.COMPLETED,
            driverFare: new Decimal('100000'),
            billingFare: new Decimal('120000')
          }
        })
      }

      // 결행 1번
      await prisma.trip.create({
        data: {
          date: new Date(testDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteId,
          status: TripStatus.ABSENCE,
          absenceReason: '차량 고장',
          driverFare: new Decimal('100000'),
          billingFare: new Decimal('120000'),
          deductionAmount: new Decimal('10000') // 10% 공제
        }
      })

      // When: 정산 계산
      const result = await settlementService.calculateMonthlySettlement(
        testDriverId,
        '2025-01'
      )

      // Then: 결과 검증
      expect(result.totalTrips).toBe(3)
      expect(result.totalBaseFare).toEqual(new Decimal('300000'))
      expect(result.totalDeductions).toEqual(new Decimal('10000'))
      expect(result.totalAdditions).toEqual(new Decimal('0'))
      expect(result.finalAmount).toEqual(new Decimal('290000'))
      
      // 아이템 검증
      expect(result.items).toHaveLength(4) // 정상 2 + 결행 1 + 공제 1
      const deductionItem = result.items.find(item => item.type === 'DEDUCTION')
      expect(deductionItem).toBeDefined()
      expect(deductionItem!.amount).toEqual(new Decimal('-10000'))
    })

    test('대차가 있는 경우 - 5% 공제', async () => {
      // Given: 대차 기사 생성
      const substituteDriver = await prisma.driver.create({
        data: {
          name: '대차기사',
          phone: '010-2222-2222',
          bankName: '대차은행',
          accountNumber: '987-654-321'
        }
      })

      // 정상 운행 1번, 대차 1번
      const testDate = new Date('2025-01-15')
      
      await prisma.trip.create({
        data: {
          date: testDate,
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteId,
          status: TripStatus.COMPLETED,
          driverFare: new Decimal('100000'),
          billingFare: new Decimal('120000')
        }
      })

      await prisma.trip.create({
        data: {
          date: new Date(testDate.getTime() + 24 * 60 * 60 * 1000),
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteId,
          status: TripStatus.SUBSTITUTE,
          substituteDriverId: substituteDriver.id,
          driverFare: new Decimal('100000'),
          billingFare: new Decimal('120000'),
          deductionAmount: new Decimal('5000'), // 5% 공제
          substituteFare: new Decimal('80000') // 대차 기사 80%
        }
      })

      // When: 정산 계산
      const result = await settlementService.calculateMonthlySettlement(
        testDriverId,
        '2025-01'
      )

      // Then: 결과 검증
      expect(result.totalTrips).toBe(2)
      expect(result.totalBaseFare).toEqual(new Decimal('200000'))
      expect(result.totalDeductions).toEqual(new Decimal('5000'))
      expect(result.finalAmount).toEqual(new Decimal('195000'))
    })
  })

  describe('경계 케이스 테스트', () => {
    test('운행이 없는 월의 정산', async () => {
      // Given: 운행 기록이 없음

      // When: 정산 계산
      const result = await settlementService.calculateMonthlySettlement(
        testDriverId,
        '2025-01'
      )

      // Then: 모든 값이 0
      expect(result.totalTrips).toBe(0)
      expect(result.totalBaseFare).toEqual(new Decimal('0'))
      expect(result.totalDeductions).toEqual(new Decimal('0'))
      expect(result.totalAdditions).toEqual(new Decimal('0'))
      expect(result.finalAmount).toEqual(new Decimal('0'))
      expect(result.items).toHaveLength(0)
    })

    test('SCHEDULED 상태 운행은 정산에서 제외', async () => {
      // Given: SCHEDULED 상태 운행
      await prisma.trip.create({
        data: {
          date: new Date('2025-01-15'),
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteId,
          status: TripStatus.SCHEDULED,
          driverFare: new Decimal('100000'),
          billingFare: new Decimal('120000')
        }
      })

      // When: 정산 계산
      const result = await settlementService.calculateMonthlySettlement(
        testDriverId,
        '2025-01'
      )

      // Then: 정산에 포함되지 않음
      expect(result.totalTrips).toBe(0)
      expect(result.items).toHaveLength(0)
    })

    test('잘못된 입력값 처리', async () => {
      // When & Then: 잘못된 driverId
      await expect(
        settlementService.calculateMonthlySettlement('invalid-id', '2025-01')
      ).rejects.toThrow('Driver not found')

      // When & Then: 잘못된 yearMonth 형식
      await expect(
        settlementService.calculateMonthlySettlement(testDriverId, '2025-1')
      ).rejects.toThrow('yearMonth must be in YYYY-MM format')

      // When & Then: 빈 값
      await expect(
        settlementService.calculateMonthlySettlement('', '2025-01')
      ).rejects.toThrow('driverId and yearMonth are required')
    })

    test('월경계 운행 처리', async () => {
      // Given: 2025-01-31과 2025-02-01 운행
      await prisma.trip.create({
        data: {
          date: new Date('2025-01-31'),
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteId,
          status: TripStatus.COMPLETED,
          driverFare: new Decimal('100000'),
          billingFare: new Decimal('120000')
        }
      })

      await prisma.trip.create({
        data: {
          date: new Date('2025-02-01'),
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteId,
          status: TripStatus.COMPLETED,
          driverFare: new Decimal('100000'),
          billingFare: new Decimal('120000')
        }
      })

      // When: 1월 정산 계산
      const result = await settlementService.calculateMonthlySettlement(
        testDriverId,
        '2025-01'
      )

      // Then: 1월 운행만 포함
      expect(result.totalTrips).toBe(1)
      expect(result.finalAmount).toEqual(new Decimal('100000'))
    })

    test('소수점 운임 처리', async () => {
      // Given: 소수점이 있는 운임
      await prisma.trip.create({
        data: {
          date: new Date('2025-01-15'),
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteId,
          status: TripStatus.ABSENCE,
          absenceReason: '테스트',
          driverFare: new Decimal('123456.78'),
          billingFare: new Decimal('150000.00'),
          deductionAmount: new Decimal('12345.68') // 정확히 10%
        }
      })

      // When: 정산 계산
      const result = await settlementService.calculateMonthlySettlement(
        testDriverId,
        '2025-01'
      )

      // Then: 소수점 계산 정확성 검증
      expect(result.totalBaseFare).toEqual(new Decimal('123456.78'))
      expect(result.totalDeductions).toEqual(new Decimal('12345.68'))
      expect(result.finalAmount).toEqual(new Decimal('111111.10'))
    })
  })

  describe('정산 상태 관리', () => {
    test('정산 확정 처리', async () => {
      // Given: DRAFT 정산 생성
      const settlement = await prisma.settlement.create({
        data: {
          yearMonth: '2025-01',
          driverId: testDriverId,
          status: SettlementStatus.DRAFT,
          totalTrips: 1,
          totalBaseFare: new Decimal('100000'),
          finalAmount: new Decimal('100000'),
          createdBy: testUserId
        }
      })

      // When: 정산 확정
      await settlementService.confirmSettlement(settlement.id, testUserId)

      // Then: 상태 변경 확인
      const confirmed = await prisma.settlement.findUnique({
        where: { id: settlement.id }
      })
      
      expect(confirmed!.status).toBe(SettlementStatus.CONFIRMED)
      expect(confirmed!.confirmedAt).toBeDefined()
      expect(confirmed!.confirmedBy).toBe(testUserId)
    })

    test('이미 확정된 정산 재확정 방지', async () => {
      // Given: CONFIRMED 정산
      const settlement = await prisma.settlement.create({
        data: {
          yearMonth: '2025-01',
          driverId: testDriverId,
          status: SettlementStatus.CONFIRMED,
          confirmedAt: new Date(),
          confirmedBy: testUserId,
          totalTrips: 1,
          totalBaseFare: new Decimal('100000'),
          finalAmount: new Decimal('100000')
        }
      })

      // When & Then: 재확정 시도 시 에러
      await expect(
        settlementService.confirmSettlement(settlement.id, testUserId)
      ).rejects.toThrow('Settlement is already CONFIRMED')
    })

    test('비상 잠금 해제 (관리자 전용)', async () => {
      // Given: CONFIRMED 정산
      const settlement = await prisma.settlement.create({
        data: {
          yearMonth: '2025-01',
          driverId: testDriverId,
          status: SettlementStatus.CONFIRMED,
          confirmedAt: new Date(),
          confirmedBy: testUserId,
          totalTrips: 1,
          totalBaseFare: new Decimal('100000'),
          finalAmount: new Decimal('100000')
        }
      })

      // When: 비상 잠금 해제
      await settlementService.emergencyUnlock(
        settlement.id,
        testUserId,
        '데이터 수정 필요'
      )

      // Then: 상태 변경 및 감사 로그 확인
      const unlocked = await prisma.settlement.findUnique({
        where: { id: settlement.id }
      })
      
      expect(unlocked!.status).toBe(SettlementStatus.DRAFT)
      expect(unlocked!.confirmedAt).toBeNull()
      expect(unlocked!.confirmedBy).toBeNull()

      // 감사 로그 확인
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: 'Settlement',
          entityId: settlement.id,
          action: 'UPDATE'
        }
      })
      
      expect(auditLog).toBeDefined()
      expect(auditLog!.metadata).toHaveProperty('emergency', true)
    })

    test('비관리자의 비상 잠금 해제 시도 방지', async () => {
      // Given: 일반 사용자와 CONFIRMED 정산
      const normalUser = await prisma.user.create({
        data: {
          email: 'normal@example.com',
          name: 'Normal User',
          role: 'DISPATCHER'
        }
      })

      const settlement = await prisma.settlement.create({
        data: {
          yearMonth: '2025-01',
          driverId: testDriverId,
          status: SettlementStatus.CONFIRMED,
          confirmedAt: new Date(),
          confirmedBy: testUserId,
          totalTrips: 1,
          totalBaseFare: new Decimal('100000'),
          finalAmount: new Decimal('100000')
        }
      })

      // When & Then: 일반 사용자의 잠금 해제 시도 시 에러
      await expect(
        settlementService.emergencyUnlock(
          settlement.id,
          normalUser.id,
          '권한 없는 시도'
        )
      ).rejects.toThrow('Only administrators can perform emergency unlock')
    })
  })

  describe('복합 시나리오 테스트', () => {
    test('모든 상태가 섞인 복잡한 월 정산', async () => {
      // Given: 다양한 상태의 운행들
      const testDate = new Date('2025-01-15')
      
      // 정상 운행 3번
      for (let i = 0; i < 3; i++) {
        await prisma.trip.create({
          data: {
            date: new Date(testDate.getTime() + i * 24 * 60 * 60 * 1000),
            driverId: testDriverId,
            vehicleId: testVehicleId,
            routeTemplateId: testRouteId,
            status: TripStatus.COMPLETED,
            driverFare: new Decimal('100000'),
            billingFare: new Decimal('120000')
          }
        })
      }

      // 결행 2번
      for (let i = 3; i < 5; i++) {
        await prisma.trip.create({
          data: {
            date: new Date(testDate.getTime() + i * 24 * 60 * 60 * 1000),
            driverId: testDriverId,
            vehicleId: testVehicleId,
            routeTemplateId: testRouteId,
            status: TripStatus.ABSENCE,
            absenceReason: '차량 정비',
            driverFare: new Decimal('100000'),
            billingFare: new Decimal('120000'),
            deductionAmount: new Decimal('10000')
          }
        })
      }

      // 대차 1번
      const substituteDriver = await prisma.driver.create({
        data: {
          name: '대차기사',
          phone: '010-3333-3333'
        }
      })

      await prisma.trip.create({
        data: {
          date: new Date(testDate.getTime() + 5 * 24 * 60 * 60 * 1000),
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteId,
          status: TripStatus.SUBSTITUTE,
          substituteDriverId: substituteDriver.id,
          driverFare: new Decimal('100000'),
          billingFare: new Decimal('120000'),
          deductionAmount: new Decimal('5000'),
          substituteFare: new Decimal('80000')
        }
      })

      // SCHEDULED 1번 (제외되어야 함)
      await prisma.trip.create({
        data: {
          date: new Date(testDate.getTime() + 6 * 24 * 60 * 60 * 1000),
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteId,
          status: TripStatus.SCHEDULED,
          driverFare: new Decimal('100000'),
          billingFare: new Decimal('120000')
        }
      })

      // When: 정산 계산
      const result = await settlementService.calculateMonthlySettlement(
        testDriverId,
        '2025-01'
      )

      // Then: 종합 검증
      expect(result.totalTrips).toBe(6) // SCHEDULED 제외
      expect(result.totalBaseFare).toEqual(new Decimal('600000'))
      expect(result.totalDeductions).toEqual(new Decimal('25000')) // 10000*2 + 5000
      expect(result.totalAdditions).toEqual(new Decimal('0'))
      expect(result.finalAmount).toEqual(new Decimal('575000'))
      
      // 아이템 검증
      expect(result.items).toHaveLength(9) // 6 TRIP + 2 결행공제 + 1 대차공제
      
      const tripItems = result.items.filter(item => item.type === 'TRIP')
      const deductionItems = result.items.filter(item => item.type === 'DEDUCTION')
      
      expect(tripItems).toHaveLength(6)
      expect(deductionItems).toHaveLength(3)
      
      // 공제 금액 합계 검증
      const totalDeductionAmount = deductionItems.reduce(
        (sum, item) => sum.add(item.amount.abs()),
        new Decimal('0')
      )
      expect(totalDeductionAmount).toEqual(new Decimal('25000'))
    })
  })
})