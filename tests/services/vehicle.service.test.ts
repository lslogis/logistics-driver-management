import { describe, it, expect, beforeEach } from '@jest/globals'
import { VehicleService } from '@/lib/services/vehicle.service'
import { testPrisma, createTestUser, createTestDriver } from '../setup'

describe('VehicleService', () => {
  let vehicleService: VehicleService
  let testUserId: string
  let testDriverId: string

  beforeEach(async () => {
    vehicleService = new VehicleService(testPrisma)
    const testUser = await createTestUser()
    const testDriver = await createTestDriver()
    testUserId = testUser.id
    testDriverId = testDriver.id
  })

  describe('createVehicle', () => {
    it('should create a new vehicle successfully', async () => {
      const vehicleData = {
        plateNumber: '12가3456',
        vehicleType: 'TRUCK' as const,
        ownership: 'OWNED' as const,
        capacity: 5000,
        year: 2020
      }

      const vehicle = await vehicleService.createVehicle(vehicleData, testUserId)

      expect(vehicle).toBeDefined()
      expect(vehicle.plateNumber).toBe(vehicleData.plateNumber)
      expect(vehicle.vehicleType).toBe(vehicleData.vehicleType)
      expect(vehicle.ownership).toBe(vehicleData.ownership)
      expect(vehicle.capacity).toBe(vehicleData.capacity)
      expect(vehicle.isActive).toBe(true)
    })

    it('should throw error for duplicate plate number', async () => {
      const vehicleData = {
        plateNumber: '12가3456',
        vehicleType: 'TRUCK' as const,
        ownership: 'OWNED' as const,
        capacity: 5000,
        year: 2020
      }

      await vehicleService.createVehicle(vehicleData, testUserId)

      const duplicateVehicleData = {
        ...vehicleData,
        vehicleType: 'VAN' as const
      }

      await expect(
        vehicleService.createVehicle(duplicateVehicleData, testUserId)
      ).rejects.toThrow()
    })
  })

  describe('getVehicles', () => {
    beforeEach(async () => {
      // Create test vehicles
      await testPrisma.vehicle.createMany({
        data: [
          {
            plateNumber: '11가1111',
            vehicleType: 'TRUCK',
            ownership: 'OWNED',
            capacity: 5000,
            year: 2020,
            isActive: true
          },
          {
            plateNumber: '22나2222',
            vehicleType: 'VAN',
            ownership: 'CHARTER',
            capacity: 2000,
            year: 2021,
            isActive: true,
            driverId: testDriverId
          },
          {
            plateNumber: '33다3333',
            vehicleType: 'TRUCK',
            ownership: 'OWNED',
            capacity: 10000,
            year: 2019,
            isActive: false
          }
        ]
      })
    })

    it('should return all active vehicles by default', async () => {
      const result = await vehicleService.getVehicles({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      expect(result.vehicles).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.vehicles.every(vehicle => vehicle.isActive)).toBe(true)
    })

    it('should return all vehicles when includeInactive is true', async () => {
      const result = await vehicleService.getVehicles({ 
        includeInactive: true,
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      expect(result.vehicles).toHaveLength(3)
      expect(result.total).toBe(3)
    })

    it('should filter vehicles by search term', async () => {
      const result = await vehicleService.getVehicles({ 
        search: '11가1111',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      expect(result.vehicles).toHaveLength(1)
      expect(result.vehicles[0].plateNumber).toBe('11가1111')
    })

    it('should filter vehicles by type', async () => {
      const result = await vehicleService.getVehicles({ 
        vehicleType: 'TRUCK',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      expect(result.vehicles).toHaveLength(1)
      expect(result.vehicles[0].vehicleType).toBe('TRUCK')
      expect(result.vehicles[0].plateNumber).toBe('11가1111')
    })

    it('should filter vehicles by ownership', async () => {
      const result = await vehicleService.getVehicles({ 
        ownership: 'CHARTER',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      expect(result.vehicles).toHaveLength(1)
      expect(result.vehicles[0].ownership).toBe('CHARTER')
      expect(result.vehicles[0].plateNumber).toBe('22나2222')
    })

    it('should show assigned driver information', async () => {
      const result = await vehicleService.getVehicles({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      const assignedVehicle = result.vehicles.find(v => v.plateNumber === '22나2222')

      expect(assignedVehicle).toBeDefined()
      expect(assignedVehicle!.driver).toBeDefined()
      expect(assignedVehicle!.driver!.name).toBe('테스트 기사')
    })
  })

  describe('getVehicleById', () => {
    it('should return vehicle with driver and trips count', async () => {
      const vehicle = await testPrisma.vehicle.create({
        data: {
          plateNumber: '44라4444',
          vehicleType: 'TRUCK',
          ownership: 'OWNED',
          capacity: 7000,
          year: 2022,
          isActive: true,
          driverId: testDriverId
        }
      })

      const result = await vehicleService.getVehicleById(vehicle.id)

      expect(result).toBeDefined()
      expect(result!.id).toBe(vehicle.id)
      expect(result!.plateNumber).toBe('44라4444')
      expect(result!.driver).toBeDefined()
      expect(result!.driver!.name).toBe('테스트 기사')
      expect(result!._count).toBeDefined()
      expect(result!._count.trips).toBe(0)
    })

    it('should return null for non-existent vehicle', async () => {
      const result = await vehicleService.getVehicleById('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('updateVehicle', () => {
    let vehicleId: string

    beforeEach(async () => {
      const vehicle = await testPrisma.vehicle.create({
        data: {
          plateNumber: '55마5555',
          vehicleType: 'TRUCK',
          ownership: 'OWNED',
          capacity: 8000,
          year: 2021,
          isActive: true
        }
      })
      vehicleId = vehicle.id
    })

    it('should update vehicle successfully', async () => {
      const updateData = {
        capacity: 9000,
        year: 2022,
        ownership: 'CHARTER' as const
      }

      const updatedVehicle = await vehicleService.updateVehicle(
        vehicleId,
        updateData,
        testUserId
      )

      expect(updatedVehicle.capacity).toBe(9000)
      expect(updatedVehicle.year).toBe(2022)
      expect(updatedVehicle.ownership).toBe('CHARTER')
    })

    it('should throw error for non-existent vehicle', async () => {
      await expect(
        vehicleService.updateVehicle('non-existent-id', { capacity: 5000 }, testUserId)
      ).rejects.toThrow()
    })
  })

  describe('assignDriverToVehicle', () => {
    let vehicleId: string

    beforeEach(async () => {
      const vehicle = await testPrisma.vehicle.create({
        data: {
          plateNumber: '66바6666',
          vehicleType: 'VAN',
          ownership: 'OWNED',
          capacity: 3000,
          year: 2023,
          isActive: true
        }
      })
      vehicleId = vehicle.id
    })

    it('should assign driver to vehicle successfully', async () => {
      const result = await vehicleService.assignDriverToVehicle(
        vehicleId,
        testDriverId,
        testUserId
      )

      expect(result.driver).toBeDefined()
      expect(result.driver!.id).toBe(testDriverId)
      expect(result.driver!.name).toBe('테스트 기사')
    })

    it('should unassign driver when driverId is null', async () => {
      // First assign a driver
      await vehicleService.assignDriverToVehicle(vehicleId, testDriverId, testUserId)
      
      // Then unassign
      const result = await vehicleService.assignDriverToVehicle(
        vehicleId,
        null,
        testUserId
      )

      expect(result.driver).toBeNull()
    })

    it('should throw error for non-existent vehicle', async () => {
      await expect(
        vehicleService.assignDriverToVehicle('non-existent-id', testDriverId, testUserId)
      ).rejects.toThrow()
    })

    it('should throw error for non-existent driver', async () => {
      await expect(
        vehicleService.assignDriverToVehicle(vehicleId, 'non-existent-driver', testUserId)
      ).rejects.toThrow()
    })
  })

  describe('toggleVehicleStatus', () => {
    let vehicleId: string

    beforeEach(async () => {
      const vehicle = await testPrisma.vehicle.create({
        data: {
          plateNumber: '77사7777',
          vehicleType: 'TRUCK',
          ownership: 'OWNED',
          capacity: 12000,
          year: 2020,
          isActive: true
        }
      })
      vehicleId = vehicle.id
    })

    it('should toggle vehicle status from active to inactive', async () => {
      const result = await vehicleService.toggleVehicleStatus(vehicleId, testUserId)

      expect(result.isActive).toBe(false)
    })

    it('should toggle vehicle status from inactive to active', async () => {
      // First deactivate
      await vehicleService.toggleVehicleStatus(vehicleId, testUserId)
      
      // Then reactivate
      const result = await vehicleService.toggleVehicleStatus(vehicleId, testUserId)

      expect(result.isActive).toBe(true)
    })

    it('should unassign driver when deactivating vehicle', async () => {
      // First assign a driver
      await vehicleService.assignDriverToVehicle(vehicleId, testDriverId, testUserId)
      
      // Then deactivate vehicle
      const result = await vehicleService.toggleVehicleStatus(vehicleId, testUserId)

      expect(result.isActive).toBe(false)
      expect(result.driver).toBeNull()
    })
  })

  describe('searchVehicles', () => {
    beforeEach(async () => {
      await testPrisma.vehicle.createMany({
        data: [
          {
            plateNumber: '88아8888',
            vehicleType: 'TRUCK',
            ownership: 'OWNED',
            capacity: 5000,
            year: 2021,
            isActive: true
          },
          {
            plateNumber: '99자9999',
            vehicleType: 'VAN',
            ownership: 'CHARTER',
            capacity: 2500,
            year: 2022,
            isActive: true
          }
        ]
      })
    })

    it('should search vehicles by plate number', async () => {
      const results = await vehicleService.searchVehicles('88아')

      expect(results).toHaveLength(1)
      expect(results[0].plateNumber).toContain('88아')
    })

    it('should search vehicles by vehicle type', async () => {
      const results = await vehicleService.searchVehicles('VAN')

      expect(results).toHaveLength(1)
      expect(results[0].vehicleType).toBe('VAN')
    })

    it('should return empty array for no matches', async () => {
      const results = await vehicleService.searchVehicles('존재하지않는번호')

      expect(results).toHaveLength(0)
    })
  })
})