import { describe, it, expect, beforeEach } from '@jest/globals'
import { DriverService } from '@/lib/services/driver.service'
import { testPrisma, createTestUser } from '../setup'

describe('DriverService', () => {
  let driverService: DriverService
  let testUserId: string

  beforeEach(async () => {
    driverService = new DriverService(testPrisma)
    const testUser = await createTestUser()
    testUserId = testUser.id
  })

  describe('createDriver', () => {
    it('should create a new driver successfully', async () => {
      const driverData = {
        name: '김기사',
        phone: '010-1234-5678',
        businessNumber: '123-45-67890',
        bankName: '국민은행',
        accountNumber: '123456789',
        businessName: '김기사운송',
        representative: '김기사',
        vehicleNumber: '12가3456',
        remarks: null,
        isActive: true
      }

      const driver = await driverService.createDriver(driverData, testUserId)

      expect(driver).toBeDefined()
      expect(driver.name).toBe(driverData.name)
      expect(driver.phone).toBe(driverData.phone)
      expect(driver.businessNumber).toBe(driverData.businessNumber)
      expect(driver.isActive).toBe(true)
    })

    it('should throw error for duplicate business number', async () => {
      const driverData = {
        name: '김기사',
        phone: '010-1234-5678',
        businessNumber: '123-45-67890',
        bankName: '국민은행',
        accountNumber: '123456789',
        businessName: '김기사운송',
        representative: '김기사',
        vehicleNumber: '12가3456',
        remarks: null,
        isActive: true
      }

      await driverService.createDriver(driverData, testUserId)

      const duplicateDriverData = {
        ...driverData,
        name: '박기사',
        phone: '010-9876-5432',
        vehicleNumber: '99다9999'
      }

      await expect(
        driverService.createDriver(duplicateDriverData, testUserId)
      ).rejects.toThrow()
    })
  })

  describe('getDrivers', () => {
    beforeEach(async () => {
      // Create test drivers
      await testPrisma.driver.createMany({
        data: [
          {
            name: '김기사',
            phone: '010-1111-1111',
            businessNumber: '111-11-11111',
            bankName: '국민은행',
            accountNumber: '111111111',
            businessName: '김기사운송',
            representative: '김기사',
            vehicleNumber: '11가1111',
            isActive: true
          },
          {
            name: '박기사',
            phone: '010-2222-2222',
            businessNumber: '222-22-22222',
            bankName: '신한은행',
            accountNumber: '222222222',
            businessName: '박기사운송',
            representative: '박기사',
            vehicleNumber: '22나2222',
            isActive: true
          },
          {
            name: '이기사',
            phone: '010-3333-3333',
            businessNumber: '333-33-33333',
            bankName: '우리은행',
            accountNumber: '333333333',
            businessName: '이기사운송',
            representative: '이기사',
            vehicleNumber: '33다3333',
            isActive: false
          }
        ]
      })
    })

    it('should return all active drivers by default', async () => {
      const result = await driverService.getDrivers({})

      expect(result.drivers).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.drivers.every(driver => driver.isActive)).toBe(true)
    })

    it('should return all drivers when includeInactive is true', async () => {
      const result = await driverService.getDrivers({ includeInactive: true })

      expect(result.drivers).toHaveLength(3)
      expect(result.total).toBe(3)
    })

    it('should filter drivers by search term', async () => {
      const result = await driverService.getDrivers({ search: '김기사' })

      expect(result.drivers).toHaveLength(1)
      expect(result.drivers[0].name).toBe('김기사')
    })

    it('should paginate results correctly', async () => {
      const result = await driverService.getDrivers({ page: 1, limit: 1 })

      expect(result.drivers).toHaveLength(1)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(2)
    })
  })

  describe('getDriverById', () => {
    it('should return driver with vehicles and trips count', async () => {
      const driver = await testPrisma.driver.create({
        data: {
          name: '김기사',
          phone: '010-1234-5678',
          businessNumber: '123-45-67890',
          bankName: '국민은행',
          accountNumber: '123456789',
          businessName: '김기사운송',
          representative: '김기사',
          isActive: true
        }
      })

      const result = await driverService.getDriverById(driver.id)

      expect(result).toBeDefined()
      expect(result!.id).toBe(driver.id)
      expect(result!.name).toBe('김기사')
      expect(result!._count).toBeDefined()
      expect(result!._count.vehicles).toBe(0)
      expect(result!._count.trips).toBe(0)
    })

    it('should return null for non-existent driver', async () => {
      const result = await driverService.getDriverById('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('updateDriver', () => {
    let driverId: string

    beforeEach(async () => {
      const driver = await testPrisma.driver.create({
        data: {
          name: '김기사',
          phone: '010-1234-5678',
          businessNumber: '123-45-67890',
          bankName: '국민은행',
          accountNumber: '123456789',
          businessName: '김기사운송',
          representative: '김기사',
          isActive: true
        }
      })
      driverId = driver.id
    })

    it('should update driver successfully', async () => {
      const updateData = {
        name: '김기사_수정',
        phone: '010-9999-9999',
        bankName: '신한은행'
      }

      const updatedDriver = await driverService.updateDriver(
        driverId,
        updateData,
        testUserId
      )

      expect(updatedDriver.name).toBe('김기사_수정')
      expect(updatedDriver.phone).toBe('010-9999-9999')
      expect(updatedDriver.bankName).toBe('신한은행')
    })

    it('should throw error for non-existent driver', async () => {
      await expect(
        driverService.updateDriver('non-existent-id', { name: '테스트' }, testUserId)
      ).rejects.toThrow()
    })
  })

  describe('toggleDriverStatus', () => {
    let driverId: string

    beforeEach(async () => {
      const driver = await testPrisma.driver.create({
        data: {
          name: '김기사',
          phone: '010-1234-5678',
          businessNumber: '123-45-67890',
          bankName: '국민은행',
          accountNumber: '123456789',
          businessName: '김기사운송',
          representative: '김기사',
          isActive: true
        }
      })
      driverId = driver.id
    })

    it('should toggle driver status from active to inactive', async () => {
      const result = await driverService.toggleDriverStatus(driverId, testUserId)

      expect(result.isActive).toBe(false)
    })

    it('should toggle driver status from inactive to active', async () => {
      // First deactivate
      await driverService.toggleDriverStatus(driverId, testUserId)
      
      // Then reactivate
      const result = await driverService.toggleDriverStatus(driverId, testUserId)

      expect(result.isActive).toBe(true)
    })
  })

  describe('searchDrivers', () => {
    beforeEach(async () => {
      await testPrisma.driver.createMany({
        data: [
          {
            name: '김철수',
            phone: '010-1111-1111',
            businessNumber: '111-11-11111',
            bankName: '국민은행',
            accountNumber: '111111111',
            businessName: '철수운송',
            representative: '김철수',
            isActive: true
          },
          {
            name: '박영희',
            phone: '010-2222-2222',
            businessNumber: '222-22-22222',
            bankName: '신한은행',
            accountNumber: '222222222',
            businessName: '영희운송',
            representative: '박영희',
            isActive: true
          }
        ]
      })
    })

    it('should search drivers by name', async () => {
      const results = await driverService.searchDrivers('철수')

      expect(results).toHaveLength(1)
      expect(results[0].name).toContain('철수')
    })

    it('should search drivers by phone', async () => {
      const results = await driverService.searchDrivers('010-1111')

      expect(results).toHaveLength(1)
      expect(results[0].phone).toContain('010-1111')
    })

    it('should return empty array for no matches', async () => {
      const results = await driverService.searchDrivers('존재하지않는기사')

      expect(results).toHaveLength(0)
    })
  })
})