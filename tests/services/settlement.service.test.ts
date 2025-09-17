import { describe, it, expect, beforeEach } from '@jest/globals'
import { SettlementService } from '@/lib/services/settlement.service'
import { TripStatus, SettlementStatus, SettlementItemType } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { testPrisma, createTestUser, createTestDriver } from '../setup'

describe('SettlementService', () => {
  let settlementService: SettlementService
  let testUserId: string
  let testDriverId: string
  let testVehicleId: string
  let testRouteTemplateId: string
  let adminUserId: string

  beforeEach(async () => {
    settlementService = new SettlementService(testPrisma)
    const testUser = await createTestUser()
    const testDriver = await createTestDriver()
    testUserId = testUser.id
    testDriverId = testDriver.id

    // Create admin user
    const adminUser = await testPrisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Admin User',
        password: 'hashed-admin-password',
        role: 'ADMIN',
        isActive: true
      }
    })
    adminUserId = adminUser.id

    // Create test vehicle
    const testVehicle = await testPrisma.vehicle.create({
      data: {
        plateNumber: '12가3456',
        vehicleType: 'TRUCK',
        ownership: 'OWNED',
        capacity: 5000,
        year: 2020,
        isActive: true
      }
    })
    testVehicleId = testVehicle.id

    // Create test route template
    const testRouteTemplate = await testPrisma.routeTemplate.create({
      data: {
        name: '서울-부산',
        loadingPoint: '서울',
        unloadingPoint: '부산',
        distance: 400,
        estimatedTime: 300,
        driverFare: '200000',
        billingFare: '250000',
        isActive: true
      }
    })
    testRouteTemplateId = testRouteTemplate.id
  })

  describe('calculateMonthlySettlement', () => {
    beforeEach(async () => {
      // Create substitute driver for testing
      const substituteDriver = await testPrisma.driver.create({
        data: {
          name: '대차기사',
          phone: '010-9999-9999',
          businessNumber: '999-99-99999',
          bankName: '테스트은행',
          accountNumber: '999999999',
          businessName: '대차운송',
          representative: '대차기사',
          isActive: true
        }
      })

      // Create various trip scenarios for 2024-01
      await testPrisma.trip.createMany({
        data: [
          // 정상 완료 운행
          {
            date: new Date('2024-01-01'),
            routeType: 'fixed',
            driverId: testDriverId,
            vehicleId: testVehicleId,
            routeTemplateId: testRouteTemplateId,
            status: 'COMPLETED',
            driverFare: '200000',
            billingFare: '250000'
          },
          {
            date: new Date('2024-01-02'),
            routeType: 'fixed',
            driverId: testDriverId,
            vehicleId: testVehicleId,
            routeTemplateId: testRouteTemplateId,
            status: 'COMPLETED',
            driverFare: '200000',
            billingFare: '250000'
          },
          // 결행 운행 (10% 공제)
          {
            date: new Date('2024-01-03'),
            routeType: 'fixed',
            driverId: testDriverId,
            vehicleId: testVehicleId,
            routeTemplateId: testRouteTemplateId,
            status: 'ABSENCE',
            absenceReason: '기사 개인사정',
            deductionAmount: '20000', // 10% of 200000
            driverFare: '200000',
            billingFare: '250000'
          },
          // 대차 운행 (5% 공제)
          {
            date: new Date('2024-01-04'),
            routeType: 'fixed',
            driverId: testDriverId,
            vehicleId: testVehicleId,
            routeTemplateId: testRouteTemplateId,
            status: 'SUBSTITUTE',
            substituteDriverId: substituteDriver.id,
            substituteFare: '160000', // 80% of 200000
            deductionAmount: '10000', // 5% of 200000
            driverFare: '200000',
            billingFare: '250000'
          },
          // 예정 운행 (정산에 포함되지 않음)
          {
            date: new Date('2024-01-05'),
            routeType: 'fixed',
            driverId: testDriverId,
            vehicleId: testVehicleId,
            routeTemplateId: testRouteTemplateId,
            status: 'SCHEDULED',
            driverFare: '200000',
            billingFare: '250000'
          }
        ]
      })
    })

    it('should calculate settlement correctly for various trip statuses', async () => {
      const result = await settlementService.calculateMonthlySettlement(testDriverId, '2024-01')

      // 총 4건 운행 (SCHEDULED 제외)
      expect(result.totalTrips).toBe(4)
      
      // 기본 운임 총합: 200,000 × 4 = 800,000
      expect(result.totalBaseFare.toString()).toBe('800000')
      
      // 총 공제액: 결행 20,000 + 대차 10,000 = 30,000
      expect(result.totalDeductions.toString()).toBe('30000')
      
      // 추가 항목 (테스트에선 없음)
      expect(result.totalAdditions.toString()).toBe('0')
      
      // 최종 정산액: 800,000 - 30,000 + 0 = 770,000
      expect(result.finalAmount.toString()).toBe('770000')

      // 정산 항목 검증
      expect(result.items).toHaveLength(6) // 4개 운행 + 2개 공제
      
      // COMPLETED trips
      const completedItems = result.items.filter(item => 
        item.type === SettlementItemType.TRIP && 
        item.description.includes('정상운행')
      )
      expect(completedItems).toHaveLength(2)
      
      // ABSENCE trip and deduction
      const absenceTrip = result.items.find(item => 
        item.type === SettlementItemType.TRIP && 
        item.description.includes('결행운행')
      )
      expect(absenceTrip).toBeDefined()
      expect(absenceTrip!.amount.toString()).toBe('200000')
      
      const absenceDeduction = result.items.find(item => 
        item.type === SettlementItemType.DEDUCTION && 
        item.description.includes('결행공제')
      )
      expect(absenceDeduction).toBeDefined()
      expect(absenceDeduction!.amount.toString()).toBe('-20000')
      
      // SUBSTITUTE trip and deduction
      const substituteTrip = result.items.find(item => 
        item.type === SettlementItemType.TRIP && 
        item.description.includes('대차운행')
      )
      expect(substituteTrip).toBeDefined()
      expect(substituteTrip!.amount.toString()).toBe('200000')
      
      const substituteDeduction = result.items.find(item => 
        item.type === SettlementItemType.DEDUCTION && 
        item.description.includes('대차공제')
      )
      expect(substituteDeduction).toBeDefined()
      expect(substituteDeduction!.amount.toString()).toBe('-10000')
    })

    it('should handle custom route trips', async () => {
      // Create custom route trip
      await testPrisma.trip.create({
        data: {
          date: new Date('2024-02-01'),
          routeType: 'custom',
          driverId: testDriverId,
          vehicleId: testVehicleId,
          customRoute: {
            loadingPoint: '광주',
            unloadingPoint: '대구',
            distance: 200
          },
          status: 'COMPLETED',
          driverFare: '150000',
          billingFare: '180000'
        }
      })

      const result = await settlementService.calculateMonthlySettlement(testDriverId, '2024-02')

      expect(result.totalTrips).toBe(1)
      expect(result.totalBaseFare.toString()).toBe('150000')
      expect(result.finalAmount.toString()).toBe('150000')

      const customItem = result.items.find(item => 
        item.description.includes('커스텀노선')
      )
      expect(customItem).toBeDefined()
      expect(customItem!.amount.toString()).toBe('150000')
    })

    it('should handle absence trips without explicit deduction amount', async () => {
      // Create absence trip without deductionAmount (should use 10% default)
      await testPrisma.trip.create({
        data: {
          date: new Date('2024-03-01'),
          routeType: 'fixed',
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteTemplateId,
          status: 'ABSENCE',
          absenceReason: '기사 사정',
          driverFare: '200000',
          billingFare: '250000'
          // deductionAmount not specified
        }
      })

      const result = await settlementService.calculateMonthlySettlement(testDriverId, '2024-03')

      expect(result.totalTrips).toBe(1)
      expect(result.totalBaseFare.toString()).toBe('200000')
      expect(result.totalDeductions.toString()).toBe('20000') // 10% of 200000
      expect(result.finalAmount.toString()).toBe('180000')
    })

    it('should handle substitute trips without explicit deduction amount', async () => {
      const substituteDriver = await testPrisma.driver.create({
        data: {
          name: '대차기사2',
          phone: '010-8888-8888',
          businessNumber: '888-88-88888',
          bankName: '테스트은행',
          accountNumber: '888888888',
          businessName: '대차운송2',
          representative: '대차기사2',
          isActive: true
        }
      })

      // Create substitute trip without deductionAmount (should use 5% default)
      await testPrisma.trip.create({
        data: {
          date: new Date('2024-04-01'),
          routeType: 'fixed',
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteTemplateId,
          status: 'SUBSTITUTE',
          substituteDriverId: substituteDriver.id,
          substituteFare: '160000',
          driverFare: '200000',
          billingFare: '250000'
          // deductionAmount not specified
        }
      })

      const result = await settlementService.calculateMonthlySettlement(testDriverId, '2024-04')

      expect(result.totalTrips).toBe(1)
      expect(result.totalBaseFare.toString()).toBe('200000')
      expect(result.totalDeductions.toString()).toBe('10000') // 5% of 200000
      expect(result.finalAmount.toString()).toBe('190000')
    })

    it('should return empty result for month with no trips', async () => {
      const result = await settlementService.calculateMonthlySettlement(testDriverId, '2024-12')

      expect(result.totalTrips).toBe(0)
      expect(result.totalBaseFare.toString()).toBe('0')
      expect(result.totalDeductions.toString()).toBe('0')
      expect(result.totalAdditions.toString()).toBe('0')
      expect(result.finalAmount.toString()).toBe('0')
      expect(result.items).toHaveLength(0)
    })

    it('should throw error for invalid yearMonth format', async () => {
      await expect(
        settlementService.calculateMonthlySettlement(testDriverId, '2024/01')
      ).rejects.toThrow('yearMonth must be in YYYY-MM format')

      await expect(
        settlementService.calculateMonthlySettlement(testDriverId, '24-01')
      ).rejects.toThrow('yearMonth must be in YYYY-MM format')

      await expect(
        settlementService.calculateMonthlySettlement(testDriverId, '2024-1')
      ).rejects.toThrow('yearMonth must be in YYYY-MM format')
    })

    it('should throw error for empty parameters', async () => {
      await expect(
        settlementService.calculateMonthlySettlement('', '2024-01')
      ).rejects.toThrow('driverId and yearMonth are required')

      await expect(
        settlementService.calculateMonthlySettlement(testDriverId, '')
      ).rejects.toThrow('driverId and yearMonth are required')
    })

    it('should throw error for non-existent driver', async () => {
      await expect(
        settlementService.calculateMonthlySettlement('non-existent-id', '2024-01')
      ).rejects.toThrow('Driver not found: non-existent-id')
    })
  })

  describe('createSettlementPreview', () => {
    it('should create settlement preview correctly', async () => {
      // Create test trip
      await testPrisma.trip.create({
        data: {
          date: new Date('2024-05-01'),
          routeType: 'fixed',
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteTemplateId,
          status: 'COMPLETED',
          driverFare: '200000',
          billingFare: '250000'
        }
      })

      const preview = await settlementService.createSettlementPreview(testDriverId, '2024-05')

      expect(preview.totalTrips).toBe(1)
      expect(preview.totalBaseFare.toString()).toBe('200000')
      expect(preview.finalAmount.toString()).toBe('200000')
      expect(preview.items).toHaveLength(1)
    })
  })

  describe('confirmSettlement', () => {
    let settlementId: string

    beforeEach(async () => {
      // Create draft settlement
      const settlement = await testPrisma.settlement.create({
        data: {
          driverId: testDriverId,
          yearMonth: '2024-06',
          status: SettlementStatus.DRAFT,
          totalBaseFare: '200000',
          totalDeductions: '0',
          totalAdditions: '0',
          finalAmount: '200000',
          createdBy: testUserId
        }
      })
      settlementId = settlement.id
    })

    it('should confirm draft settlement successfully', async () => {
      await expect(
        settlementService.confirmSettlement(settlementId, testUserId)
      ).resolves.not.toThrow()

      // Verify settlement is confirmed
      const confirmedSettlement = await testPrisma.settlement.findUnique({
        where: { id: settlementId }
      })

      expect(confirmedSettlement!.status).toBe(SettlementStatus.CONFIRMED)
      expect(confirmedSettlement!.confirmedBy).toBe(testUserId)
      expect(confirmedSettlement!.confirmedAt).toBeDefined()
    })

    it('should throw error for non-existent settlement', async () => {
      await expect(
        settlementService.confirmSettlement('non-existent-id', testUserId)
      ).rejects.toThrow('Settlement not found: non-existent-id')
    })

    it('should throw error for already confirmed settlement', async () => {
      // First confirm the settlement
      await settlementService.confirmSettlement(settlementId, testUserId)

      // Try to confirm again
      await expect(
        settlementService.confirmSettlement(settlementId, testUserId)
      ).rejects.toThrow('Settlement is already CONFIRMED')
    })
  })

  describe('emergencyUnlock', () => {
    let settlementId: string

    beforeEach(async () => {
      // Create confirmed settlement
      const settlement = await testPrisma.settlement.create({
        data: {
          driverId: testDriverId,
          yearMonth: '2024-07',
          status: SettlementStatus.CONFIRMED,
          totalBaseFare: '200000',
          totalDeductions: '0',
          totalAdditions: '0',
          finalAmount: '200000',
          confirmedBy: testUserId,
          confirmedAt: new Date(),
          createdBy: testUserId
        }
      })
      settlementId = settlement.id
    })

    it('should unlock confirmed settlement by admin', async () => {
      const reason = '정산 오류 수정을 위한 긴급 잠금 해제'

      await expect(
        settlementService.emergencyUnlock(settlementId, adminUserId, reason)
      ).resolves.not.toThrow()

      // Verify settlement is unlocked
      const unlockedSettlement = await testPrisma.settlement.findUnique({
        where: { id: settlementId }
      })

      expect(unlockedSettlement!.status).toBe(SettlementStatus.DRAFT)
      expect(unlockedSettlement!.confirmedBy).toBeNull()
      expect(unlockedSettlement!.confirmedAt).toBeNull()

      // Verify audit log is created
      const auditLog = await testPrisma.auditLog.findFirst({
        where: {
          entityType: 'Settlement',
          entityId: settlementId,
          action: 'UPDATE'
        }
      })

      expect(auditLog).toBeDefined()
      expect(auditLog!.userId).toBe(adminUserId)
      expect(auditLog!.metadata).toMatchObject({
        emergency: true,
        reason
      })
    })

    it('should throw error for non-admin user', async () => {
      await expect(
        settlementService.emergencyUnlock(settlementId, testUserId, 'test')
      ).rejects.toThrow('Only administrators can perform emergency unlock')
    })

    it('should throw error for non-existent user', async () => {
      await expect(
        settlementService.emergencyUnlock(settlementId, 'non-existent-id', 'test')
      ).rejects.toThrow('Only administrators can perform emergency unlock')
    })

    it('should throw error for non-existent settlement', async () => {
      await expect(
        settlementService.emergencyUnlock('non-existent-id', adminUserId, 'test')
      ).rejects.toThrow('Settlement not found: non-existent-id')
    })
  })

  describe('edge cases and precision tests', () => {
    it('should handle very large amounts correctly', async () => {
      // Create trip with large amount
      await testPrisma.trip.create({
        data: {
          date: new Date('2024-08-01'),
          routeType: 'fixed',
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteTemplateId,
          status: 'COMPLETED',
          driverFare: '9999999999', // 9.9 billion
          billingFare: '9999999999'
        }
      })

      const result = await settlementService.calculateMonthlySettlement(testDriverId, '2024-08')

      expect(result.totalBaseFare.toString()).toBe('9999999999')
      expect(result.finalAmount.toString()).toBe('9999999999')
    })

    it('should handle decimal precision in calculations', async () => {
      // Create trip with amount that results in non-round percentage
      await testPrisma.trip.create({
        data: {
          date: new Date('2024-09-01'),
          routeType: 'fixed',
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteTemplateId,
          status: 'ABSENCE',
          absenceReason: '정밀도 테스트',
          driverFare: '333333', // 10% = 33333.3
          billingFare: '400000'
          // Let it calculate default 10% deduction
        }
      })

      const result = await settlementService.calculateMonthlySettlement(testDriverId, '2024-09')

      // Should handle decimal precision correctly
      expect(result.totalBaseFare.toString()).toBe('333333')
      expect(result.totalDeductions.toString()).toBe('33333.3') // 10% of 333333
      expect(result.finalAmount.toString()).toBe('299999.7') // 333333 - 33333.3
    })

    it('should handle zero amounts', async () => {
      // Create trip with zero fare (edge case)
      await testPrisma.trip.create({
        data: {
          date: new Date('2024-10-01'),
          routeType: 'fixed',
          driverId: testDriverId,
          vehicleId: testVehicleId,
          routeTemplateId: testRouteTemplateId,
          status: 'COMPLETED',
          driverFare: '0',
          billingFare: '0'
        }
      })

      const result = await settlementService.calculateMonthlySettlement(testDriverId, '2024-10')

      expect(result.totalTrips).toBe(1)
      expect(result.totalBaseFare.toString()).toBe('0')
      expect(result.finalAmount.toString()).toBe('0')
    })
  })
})