import { describe, it, expect, beforeEach } from '@jest/globals'
import { LoadingPointService } from '@/lib/services/loading-point.service'
import { testPrisma, createTestUser } from '../setup'

describe('LoadingPointService', () => {
  let loadingPointService: LoadingPointService
  let testUserId: string

  beforeEach(async () => {
    loadingPointService = new LoadingPointService(testPrisma)
    const testUser = await createTestUser()
    testUserId = testUser.id
  })

  describe('createLoadingPoint', () => {
    it('should create a new loading point successfully', async () => {
      const loadingPointData = {
        centerName: '서울센터',
        loadingPointName: 'A동 1층',
        lotAddress: '서울시 강남구 테헤란로 123',
        roadAddress: '서울시 강남구 테헤란로 123',
        manager1: '김담당',
        manager2: '박담당',
        phone1: '02-1234-5678',
        phone2: '02-8765-4321',
        remarks: '테스트 상차지'
      }

      const loadingPoint = await loadingPointService.createLoadingPoint(loadingPointData)

      expect(loadingPoint).toBeDefined()
      expect(loadingPoint.centerName).toBe(loadingPointData.centerName)
      expect(loadingPoint.loadingPointName).toBe(loadingPointData.loadingPointName)
      expect(loadingPoint.lotAddress).toBe(loadingPointData.lotAddress)
      expect(loadingPoint.manager1).toBe(loadingPointData.manager1)
      expect(loadingPoint.phone1).toBe(loadingPointData.phone1)
      expect(loadingPoint.isActive).toBe(true)
      expect(loadingPoint._count).toBeDefined()
      expect(loadingPoint._count.routeTemplates).toBe(0)
    })

    it('should throw error for duplicate center-loading point combination', async () => {
      const loadingPointData = {
        centerName: '서울센터',
        loadingPointName: 'A동 1층',
        lotAddress: '서울시 강남구 테헤란로 123',
        roadAddress: '서울시 강남구 테헤란로 123',
        manager1: '김담당',
        phone1: '02-1234-5678'
      }

      // Create first loading point
      await loadingPointService.createLoadingPoint(loadingPointData)

      // Try to create duplicate
      const duplicateData = {
        ...loadingPointData,
        lotAddress: '다른 주소',
        manager1: '다른담당'
      }

      await expect(
        loadingPointService.createLoadingPoint(duplicateData)
      ).rejects.toThrow('이미 등록된 센터명-상차지명 조합입니다')
    })

    it('should allow same loading point name in different centers', async () => {
      const loadingPointData1 = {
        centerName: '서울센터',
        loadingPointName: 'A동 1층',
        lotAddress: '서울시 강남구 테헤란로 123',
        roadAddress: '서울시 강남구 테헤란로 123',
        manager1: '김담당',
        phone1: '02-1234-5678'
      }

      const loadingPointData2 = {
        centerName: '부산센터', // Different center
        loadingPointName: 'A동 1층', // Same loading point name
        lotAddress: '부산시 해운대구 센텀중앙로 456',
        roadAddress: '부산시 해운대구 센텀중앙로 456',
        manager1: '이담당',
        phone1: '051-1234-5678'
      }

      // Both should be created successfully
      const lp1 = await loadingPointService.createLoadingPoint(loadingPointData1)
      const lp2 = await loadingPointService.createLoadingPoint(loadingPointData2)

      expect(lp1.centerName).toBe('서울센터')
      expect(lp2.centerName).toBe('부산센터')
      expect(lp1.loadingPointName).toBe(lp2.loadingPointName)
    })
  })

  describe('getLoadingPoints', () => {
    beforeEach(async () => {
      // Create test loading points
      await testPrisma.loadingPoint.createMany({
        data: [
          {
            centerName: '서울센터',
            loadingPointName: 'A동 1층',
            lotAddress: '서울시 강남구 테헤란로 123',
            roadAddress: '서울시 강남구 테헤란로 123',
            manager1: '김담당',
            phone1: '02-1234-5678',
            isActive: true
          },
          {
            centerName: '서울센터',
            loadingPointName: 'B동 2층',
            lotAddress: '서울시 강남구 테헤란로 456',
            roadAddress: '서울시 강남구 테헤란로 456',
            manager1: '박담당',
            phone1: '02-8765-4321',
            isActive: true
          },
          {
            centerName: '부산센터',
            loadingPointName: 'C동 1층',
            lotAddress: '부산시 해운대구 센텀중앙로 789',
            roadAddress: '부산시 해운대구 센텀중앙로 789',
            manager1: '최담당',
            phone1: '051-1111-2222',
            isActive: false
          }
        ]
      })
    })

    it('should return all active loading points by default', async () => {
      const result = await loadingPointService.getLoadingPoints({
        page: 1,
        limit: 10,
        sortBy: 'centerName',
        sortOrder: 'asc'
      })

      expect(result.loadingPoints).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.loadingPoints.every(lp => lp.isActive)).toBe(true)
    })

    it('should return all loading points when includeInactive is true', async () => {
      const result = await loadingPointService.getLoadingPoints({
        page: 1,
        limit: 10,
        isActive: undefined, // Include both active and inactive
        sortBy: 'centerName',
        sortOrder: 'asc'
      })

      expect(result.loadingPoints).toHaveLength(3)
      expect(result.pagination.total).toBe(3)
    })

    it('should filter loading points by search term', async () => {
      const result = await loadingPointService.getLoadingPoints({
        page: 1,
        limit: 10,
        search: '서울',
        sortBy: 'centerName',
        sortOrder: 'asc'
      })

      expect(result.loadingPoints).toHaveLength(2)
      expect(result.loadingPoints.every(lp => lp.centerName.includes('서울'))).toBe(true)
    })

    it('should filter loading points by active status', async () => {
      const result = await loadingPointService.getLoadingPoints({
        page: 1,
        limit: 10,
        isActive: false,
        sortBy: 'centerName',
        sortOrder: 'asc'
      })

      expect(result.loadingPoints).toHaveLength(1)
      expect(result.loadingPoints[0].isActive).toBe(false)
      expect(result.loadingPoints[0].centerName).toBe('부산센터')
    })

    it('should search across multiple fields', async () => {
      const result = await loadingPointService.getLoadingPoints({
        page: 1,
        limit: 10,
        search: '김담당', // Search in manager field
        sortBy: 'centerName',
        sortOrder: 'asc'
      })

      expect(result.loadingPoints).toHaveLength(1)
      expect(result.loadingPoints[0].manager1).toBe('김담당')
    })

    it('should apply pagination correctly', async () => {
      const result = await loadingPointService.getLoadingPoints({
        page: 1,
        limit: 1,
        sortBy: 'centerName',
        sortOrder: 'asc'
      })

      expect(result.loadingPoints).toHaveLength(1)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.totalPages).toBe(2)
      expect(result.pagination.hasNext).toBe(true)
      expect(result.pagination.hasPrev).toBe(false)
    })

    it('should sort by different fields and orders', async () => {
      const resultAsc = await loadingPointService.getLoadingPoints({
        page: 1,
        limit: 10,
        sortBy: 'loadingPointName',
        sortOrder: 'asc'
      })

      const resultDesc = await loadingPointService.getLoadingPoints({
        page: 1,
        limit: 10,
        sortBy: 'loadingPointName',
        sortOrder: 'desc'
      })

      expect(resultAsc.loadingPoints[0].loadingPointName).toBe('A동 1층')
      expect(resultDesc.loadingPoints[0].loadingPointName).toBe('B동 2층')
    })
  })

  describe('getLoadingPointById', () => {
    it('should return loading point with route count', async () => {
      const loadingPoint = await testPrisma.loadingPoint.create({
        data: {
          centerName: '테스트센터',
          loadingPointName: '테스트상차지',
          lotAddress: '테스트주소',
          roadAddress: '테스트도로주소',
          manager1: '테스트담당',
          phone1: '02-1234-5678',
          isActive: true
        }
      })

      const result = await loadingPointService.getLoadingPointById(loadingPoint.id)

      expect(result).toBeDefined()
      expect(result!.id).toBe(loadingPoint.id)
      expect(result!.centerName).toBe('테스트센터')
      expect(result!._count).toBeDefined()
      expect(result!._count.routeTemplates).toBe(0)
    })

    it('should return null for non-existent loading point', async () => {
      const result = await loadingPointService.getLoadingPointById('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('updateLoadingPoint', () => {
    let loadingPointId: string

    beforeEach(async () => {
      const loadingPoint = await testPrisma.loadingPoint.create({
        data: {
          centerName: '원본센터',
          loadingPointName: '원본상차지',
          lotAddress: '원본주소',
          roadAddress: '원본도로주소',
          manager1: '원본담당',
          phone1: '02-1234-5678',
          isActive: true
        }
      })
      loadingPointId = loadingPoint.id
    })

    it('should update loading point successfully', async () => {
      const updateData = {
        centerName: '수정센터',
        manager1: '수정담당',
        phone1: '02-9999-9999',
        remarks: '수정된 상차지'
      }

      const updatedLoadingPoint = await loadingPointService.updateLoadingPoint(
        loadingPointId,
        updateData
      )

      expect(updatedLoadingPoint.centerName).toBe('수정센터')
      expect(updatedLoadingPoint.manager1).toBe('수정담당')
      expect(updatedLoadingPoint.phone1).toBe('02-9999-9999')
      expect(updatedLoadingPoint.remarks).toBe('수정된 상차지')
      expect(updatedLoadingPoint.loadingPointName).toBe('원본상차지') // 변경되지 않은 필드
    })

    it('should throw error for non-existent loading point', async () => {
      await expect(
        loadingPointService.updateLoadingPoint('non-existent-id', { manager1: '테스트' })
      ).rejects.toThrow('상차지를 찾을 수 없습니다')
    })

    it('should throw error for duplicate center-loading point name combination', async () => {
      // Create another loading point
      await testPrisma.loadingPoint.create({
        data: {
          centerName: '다른센터',
          loadingPointName: '다른상차지',
          lotAddress: '다른주소',
          roadAddress: '다른도로주소',
          manager1: '다른담당',
          phone1: '02-5555-5555',
          isActive: true
        }
      })

      // Try to update first one to match the second one's name
      await expect(
        loadingPointService.updateLoadingPoint(loadingPointId, {
          centerName: '다른센터',
          loadingPointName: '다른상차지'
        })
      ).rejects.toThrow('이미 등록된 센터명-상차지명 조합입니다')
    })

    it('should allow updating other fields without changing center-loading point name', async () => {
      const updateData = {
        lotAddress: '새주소',
        roadAddress: '새도로주소',
        manager2: '새담당2',
        phone2: '02-7777-7777'
      }

      const updatedLoadingPoint = await loadingPointService.updateLoadingPoint(
        loadingPointId,
        updateData
      )

      expect(updatedLoadingPoint.lotAddress).toBe('새주소')
      expect(updatedLoadingPoint.roadAddress).toBe('새도로주소')
      expect(updatedLoadingPoint.manager2).toBe('새담당2')
      expect(updatedLoadingPoint.phone2).toBe('02-7777-7777')
      expect(updatedLoadingPoint.centerName).toBe('원본센터') // Unchanged
      expect(updatedLoadingPoint.loadingPointName).toBe('원본상차지') // Unchanged
    })
  })

  describe('deleteLoadingPoint', () => {
    let loadingPointId: string

    beforeEach(async () => {
      const loadingPoint = await testPrisma.loadingPoint.create({
        data: {
          centerName: '삭제테스트센터',
          loadingPointName: '삭제테스트상차지',
          lotAddress: '삭제테스트주소',
          roadAddress: '삭제테스트도로주소',
          manager1: '삭제테스트담당',
          phone1: '02-1111-1111',
          isActive: true
        }
      })
      loadingPointId = loadingPoint.id
    })

    it('should soft delete loading point (set isActive to false)', async () => {
      await expect(
        loadingPointService.deleteLoadingPoint(loadingPointId)
      ).resolves.not.toThrow()

      // Verify soft delete (should still exist but inactive)
      const deletedLoadingPoint = await testPrisma.loadingPoint.findUnique({
        where: { id: loadingPointId }
      })

      expect(deletedLoadingPoint).toBeDefined()
      expect(deletedLoadingPoint!.isActive).toBe(false)
    })

    it('should throw error when deleting loading point with active routes', async () => {
      // Create route template using this loading point
      await testPrisma.routeTemplate.create({
        data: {
          name: '테스트노선',
          loadingPoint: '테스트출발지',
          loadingPointId: loadingPointId,
          unloadingPoint: '테스트도착지',
          distance: 100,
          estimatedTime: 120,
          driverFare: '100000',
          billingFare: '120000',
          isActive: true
        }
      })

      await expect(
        loadingPointService.deleteLoadingPoint(loadingPointId)
      ).rejects.toThrow('사용 중인 노선이 있는 상차지는 삭제할 수 없습니다. 비활성화 처리해주세요.')
    })

    it('should allow deleting loading point with inactive routes', async () => {
      // Create inactive route template
      await testPrisma.routeTemplate.create({
        data: {
          name: '비활성노선',
          loadingPoint: '테스트출발지',
          loadingPointId: loadingPointId,
          unloadingPoint: '테스트도착지',
          distance: 100,
          estimatedTime: 120,
          driverFare: '100000',
          billingFare: '120000',
          isActive: false // Inactive route
        }
      })

      // Should be able to delete since route is inactive
      await expect(
        loadingPointService.deleteLoadingPoint(loadingPointId)
      ).resolves.not.toThrow()

      const deletedLoadingPoint = await testPrisma.loadingPoint.findUnique({
        where: { id: loadingPointId }
      })
      expect(deletedLoadingPoint!.isActive).toBe(false)
    })

    it('should throw error for non-existent loading point', async () => {
      await expect(
        loadingPointService.deleteLoadingPoint('non-existent-id')
      ).rejects.toThrow('상차지를 찾을 수 없습니다')
    })
  })

  describe('hardDeleteLoadingPoint', () => {
    let loadingPointId: string

    beforeEach(async () => {
      const loadingPoint = await testPrisma.loadingPoint.create({
        data: {
          centerName: '하드삭제센터',
          loadingPointName: '하드삭제상차지',
          lotAddress: '하드삭제주소',
          roadAddress: '하드삭제도로주소',
          manager1: '하드삭제담당',
          phone1: '02-2222-2222',
          isActive: true
        }
      })
      loadingPointId = loadingPoint.id
    })

    it('should hard delete loading point completely', async () => {
      await expect(
        loadingPointService.hardDeleteLoadingPoint(loadingPointId)
      ).resolves.not.toThrow()

      // Verify hard delete (should not exist at all)
      const deletedLoadingPoint = await testPrisma.loadingPoint.findUnique({
        where: { id: loadingPointId }
      })
      expect(deletedLoadingPoint).toBeNull()
    })

    it('should throw error when hard deleting loading point with any routes', async () => {
      // Create route template (even inactive)
      await testPrisma.routeTemplate.create({
        data: {
          name: '테스트노선',
          loadingPoint: '테스트출발지',
          loadingPointId: loadingPointId,
          unloadingPoint: '테스트도착지',
          distance: 100,
          estimatedTime: 120,
          driverFare: '100000',
          billingFare: '120000',
          isActive: false
        }
      })

      await expect(
        loadingPointService.hardDeleteLoadingPoint(loadingPointId)
      ).rejects.toThrow('연결된 노선이 있는 상차지는 삭제할 수 없습니다')
    })

    it('should throw error for non-existent loading point', async () => {
      await expect(
        loadingPointService.hardDeleteLoadingPoint('non-existent-id')
      ).rejects.toThrow('상차지를 찾을 수 없습니다')
    })
  })

  describe('toggleLoadingPointStatus', () => {
    let loadingPointId: string

    beforeEach(async () => {
      const loadingPoint = await testPrisma.loadingPoint.create({
        data: {
          centerName: '상태변경센터',
          loadingPointName: '상태변경상차지',
          lotAddress: '상태변경주소',
          roadAddress: '상태변경도로주소',
          manager1: '상태변경담당',
          phone1: '02-3333-3333',
          isActive: true
        }
      })
      loadingPointId = loadingPoint.id
    })

    it('should toggle loading point status from active to inactive', async () => {
      const result = await loadingPointService.toggleLoadingPointStatus(loadingPointId)

      expect(result.isActive).toBe(false)
    })

    it('should toggle loading point status from inactive to active', async () => {
      // First deactivate
      await loadingPointService.toggleLoadingPointStatus(loadingPointId)
      
      // Then reactivate
      const result = await loadingPointService.toggleLoadingPointStatus(loadingPointId)

      expect(result.isActive).toBe(true)
    })

    it('should throw error for non-existent loading point', async () => {
      await expect(
        loadingPointService.toggleLoadingPointStatus('non-existent-id')
      ).rejects.toThrow('상차지를 찾을 수 없습니다')
    })
  })

  describe('searchLoadingPoints', () => {
    beforeEach(async () => {
      await testPrisma.loadingPoint.createMany({
        data: [
          {
            centerName: '서울물류센터',
            loadingPointName: 'A동 1층',
            lotAddress: '서울시 강남구 테헤란로 123',
            roadAddress: '서울시 강남구 테헤란로 123',
            manager1: '김서울',
            phone1: '02-1234-5678',
            isActive: true
          },
          {
            centerName: '서울물류센터',
            loadingPointName: 'B동 2층',
            lotAddress: '서울시 강남구 테헤란로 456',
            roadAddress: '서울시 강남구 테헤란로 456',
            manager1: '박서울',
            phone1: '02-8765-4321',
            isActive: true
          },
          {
            centerName: '부산물류센터',
            loadingPointName: 'C동 1층',
            lotAddress: '부산시 해운대구 센텀중앙로 789',
            roadAddress: '부산시 해운대구 센텀중앙로 789',
            manager1: '최부산',
            phone1: '051-1111-2222',
            isActive: true
          },
          {
            centerName: '대구센터',
            loadingPointName: 'D동',
            lotAddress: '대구시 중구 중앙대로 100',
            roadAddress: '대구시 중구 중앙대로 100',
            manager1: '정대구',
            phone1: '053-3333-4444',
            isActive: false // Inactive - should not appear in search
          }
        ]
      })
    })

    it('should search loading points by center name', async () => {
      const results = await loadingPointService.searchLoadingPoints({
        query: '서울',
        limit: 10
      })

      expect(results).toHaveLength(2)
      expect(results.every(lp => lp.centerName.includes('서울'))).toBe(true)
      expect(results[0]).toHaveProperty('id')
      expect(results[0]).toHaveProperty('centerName')
      expect(results[0]).toHaveProperty('loadingPointName')
    })

    it('should search loading points by loading point name', async () => {
      const results = await loadingPointService.searchLoadingPoints({
        query: 'A동',
        limit: 10
      })

      expect(results).toHaveLength(1)
      expect(results[0].loadingPointName).toContain('A동')
      expect(results[0].centerName).toBe('서울물류센터')
    })

    it('should return empty array for no matches', async () => {
      const results = await loadingPointService.searchLoadingPoints({
        query: '존재하지않는센터',
        limit: 10
      })

      expect(results).toHaveLength(0)
    })

    it('should only return active loading points', async () => {
      const results = await loadingPointService.searchLoadingPoints({
        query: '대구', // Inactive center
        limit: 10
      })

      expect(results).toHaveLength(0) // Should not return inactive loading point
    })

    it('should respect limit parameter', async () => {
      const results = await loadingPointService.searchLoadingPoints({
        query: '센터', // Should match multiple
        limit: 2
      })

      expect(results.length).toBeLessThanOrEqual(2)
    })

    it('should return results sorted by center name and loading point name', async () => {
      const results = await loadingPointService.searchLoadingPoints({
        query: '센터',
        limit: 10
      })

      expect(results.length).toBeGreaterThan(1)
      
      // Check if results are sorted
      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1]
        const curr = results[i]
        
        if (prev.centerName === curr.centerName) {
          expect(prev.loadingPointName <= curr.loadingPointName).toBe(true)
        } else {
          expect(prev.centerName <= curr.centerName).toBe(true)
        }
      }
    })
  })
})