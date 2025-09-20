/**
 * 요청 가져오기 API 테스트
 * 통합된 Request 모델의 Excel 가져오기 기능 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/requests/import/route'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    loadingPoint: {
      findFirst: vi.fn()
    },
    driver: {
      findFirst: vi.fn()
    },
    request: {
      create: vi.fn()
    }
  }
}))

// Mock XLSX
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn()
  }
}))

describe('POST /api/requests/import', () => {
  let mockLoadingPoint: any
  let mockDriver: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockLoadingPoint = {
      id: 'loading-point-1',
      name: '서울물류센터',
      centerName: '서울물류센터',
      isActive: true
    }

    mockDriver = {
      id: 'driver-1',
      name: '김기사',
      phone: '010-1234-5678',
      vehicleNumber: '12가3456',
      vehicleTon: 3.5,
      isActive: true
    }

    // Setup default mock returns
    ;(prisma.loadingPoint.findFirst as any).mockResolvedValue(mockLoadingPoint)
    ;(prisma.driver.findFirst as any).mockResolvedValue(mockDriver)
    ;(prisma.request.create as any).mockResolvedValue({
      id: 'request-1',
      loadingPointId: mockLoadingPoint.id,
      requestDate: new Date('2024-01-15'),
      centerCarNo: 'CENTER-001',
      vehicleTon: 3.5,
      regions: ['서울', '경기'],
      stops: 3,
      baseFare: 300000,
      extraStopFee: 50000,
      extraRegionFee: 30000,
      driverId: mockDriver.id,
      driverName: mockDriver.name,
      driverPhone: mockDriver.phone,
      driverVehicle: mockDriver.vehicleNumber,
      driverFee: 250000,
      dispatchedAt: expect.any(Date)
    })
  })

  describe('파일 업로드 검증', () => {
    it('should reject request without file', async () => {
      const formData = new FormData()
      const request = new NextRequest('http://localhost/api/requests/import', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })

    it('should reject non-Excel files', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost/api/requests/import', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid file type')
    })

    it('should accept Excel files', async () => {
      const file = new File(['excel content'], 'test.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const formData = new FormData()
      formData.append('file', file)

      // Mock XLSX parsing
      ;(XLSX.read as any).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      })
      ;(XLSX.utils.sheet_to_json as any).mockReturnValue([
        {
          '센터명': '서울물류센터',
          '요청일': '2024-01-15',
          '호차번호': 'CENTER-001',
          '톤수': 3.5,
          '배송지역': '서울,경기',
          '착지수': 3,
          '기본운임': 300000,
          '착지수당': 50000,
          '지역운임': 30000,
          '기사명': '김기사',
          '기사연락처': '010-1234-5678',
          '기사차량': '12가3456',
          '기사운임': 250000
        }
      ])

      const request = new NextRequest('http://localhost/api/requests/import', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Excel 데이터 파싱', () => {
    const createRequest = (excelData: any[]) => {
      const file = new File(['excel content'], 'test.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const formData = new FormData()
      formData.append('file', file)

      ;(XLSX.read as any).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      })
      ;(XLSX.utils.sheet_to_json as any).mockReturnValue(excelData)

      return new NextRequest('http://localhost/api/requests/import', {
        method: 'POST',
        body: formData
      })
    }

    it('should parse complete request with driver info', async () => {
      const excelData = [{
        '센터명': '서울물류센터',
        '요청일': '2024-01-15',
        '호차번호': 'CENTER-001',
        '톤수': 3.5,
        '배송지역': '서울,경기',
        '착지수': 3,
        '기본운임': 300000,
        '착지수당': 50000,
        '지역운임': 30000,
        '기사명': '김기사',
        '기사연락처': '010-1234-5678',
        '기사차량': '12가3456',
        '기사운임': 250000,
        '배송시간': '09:00',
        '기사메모': '조심히 배송'
      }]

      const request = createRequest(excelData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.progress.successCount).toBe(1)
      expect(data.requests).toHaveLength(1)

      // Verify Request creation with driver info
      expect(prisma.request.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          loadingPointId: mockLoadingPoint.id,
          requestDate: expect.any(Date),
          centerCarNo: 'CENTER-001',
          vehicleTon: 3.5,
          regions: ['서울', '경기'],
          stops: 3,
          baseFare: 300000,
          extraStopFee: 50000,
          extraRegionFee: 30000,
          driverId: mockDriver.id,
          driverName: '김기사',
          driverPhone: '010-1234-5678',
          driverVehicle: '12가3456',
          driverFee: 250000,
          deliveryTime: '09:00',
          driverNotes: '조심히 배송',
          dispatchedAt: expect.any(Date)
        })
      })
    })

    it('should parse request without driver info', async () => {
      const excelData = [{
        '센터명': '서울물류센터',
        '요청일': '2024-01-15',
        '호차번호': 'CENTER-001',
        '톤수': 3.5,
        '배송지역': '서울,경기',
        '착지수': 3,
        '기본운임': 300000,
        '착지수당': 50000,
        '지역운임': 30000
        // No driver information
      }]

      const request = createRequest(excelData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify Request creation without driver info
      expect(prisma.request.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          loadingPointId: mockLoadingPoint.id,
          driverId: undefined,
          driverName: undefined,
          driverPhone: undefined,
          driverVehicle: undefined,
          driverFee: 0,
          deliveryTime: undefined,
          driverNotes: undefined
          // No dispatchedAt since no driver
        })
      })
    })

    it('should handle missing required fields', async () => {
      const excelData = [{
        '센터명': '서울물류센터',
        // Missing required fields
        '톤수': 3.5,
        '배송지역': '서울,경기',
        '착지수': 3
      }]

      const request = createRequest(excelData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.progress.errorCount).toBe(1)
      expect(data.errors).toContainEqual(
        expect.objectContaining({
          row: 1,
          column: '요청일',
          message: 'Required field missing: 요청일'
        })
      )
    })

    it('should validate data types', async () => {
      const excelData = [{
        '센터명': '서울물류센터',
        '요청일': '2024-01-15',
        '호차번호': 'CENTER-001',
        '톤수': 'invalid', // Invalid tonnage
        '배송지역': '서울,경기',
        '착지수': 'invalid' // Invalid stops
      }]

      const request = createRequest(excelData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContainEqual(
        expect.objectContaining({
          row: 1,
          column: '톤수',
          message: 'Vehicle tonnage must be between 0.1 and 999.9'
        })
      )
    })

    it('should auto-format phone numbers', async () => {
      const excelData = [{
        '센터명': '서울물류센터',
        '요청일': '2024-01-15',
        '호차번호': 'CENTER-001',
        '톤수': 3.5,
        '배송지역': '서울,경기',
        '착지수': 3,
        '기사명': '김기사',
        '기사연락처': '01012345678', // Unformatted phone
        '기사차량': '12가3456'
      }]

      const request = createRequest(excelData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.warnings).toContainEqual(
        expect.objectContaining({
          row: 1,
          message: 'Phone number auto-formatted'
        })
      )
    })
  })

  describe('기사 매칭', () => {
    it('should match driver by phone number', async () => {
      const excelData = [{
        '센터명': '서울물류센터',
        '요청일': '2024-01-15',
        '호차번호': 'CENTER-001',
        '톤수': 3.5,
        '배송지역': '서울,경기',
        '착지수': 3,
        '기사명': '김기사',
        '기사연락처': '010-1234-5678',
        '기사차량': '12가3456'
      }]

      const request = createRequest(excelData)
      const response = await POST(request)

      expect(prisma.driver.findFirst).toHaveBeenCalledWith({
        where: { phone: '010-1234-5678', isActive: true }
      })

      expect(prisma.request.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          driverId: mockDriver.id
        })
      })
    })

    it('should handle driver name mismatch', async () => {
      const driverWithDifferentName = {
        ...mockDriver,
        name: '이기사' // Different name
      }
      ;(prisma.driver.findFirst as any).mockResolvedValue(driverWithDifferentName)

      const excelData = [{
        '센터명': '서울물류센터',
        '요청일': '2024-01-15',
        '호차번호': 'CENTER-001',
        '톤수': 3.5,
        '배송지역': '서울,경기',
        '착지수': 3,
        '기사명': '김기사', // Different from DB
        '기사연락처': '010-1234-5678',
        '기사차량': '12가3456'
      }]

      const request = createRequest(excelData)
      const response = await POST(request)
      const data = await response.json()

      expect(data.warnings).toContainEqual(
        expect.objectContaining({
          row: 1,
          message: 'Driver name mismatch: DB="이기사", Excel="김기사"'
        })
      )
    })

    it('should fallback to name+vehicle matching', async () => {
      // First call (by phone) returns null
      // Second call (by name+vehicle) returns driver
      ;(prisma.driver.findFirst as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDriver)

      const excelData = [{
        '센터명': '서울물류센터',
        '요청일': '2024-01-15',
        '호차번호': 'CENTER-001',
        '톤수': 3.5,
        '배송지역': '서울,경기',
        '착지수': 3,
        '기사명': '김기사',
        '기사연락처': '010-9999-9999', // Different phone
        '기사차량': '12가3456'
      }]

      const request = createRequest(excelData)
      const response = await POST(request)
      const data = await response.json()

      expect(prisma.driver.findFirst).toHaveBeenCalledWith({
        where: { 
          name: '김기사', 
          vehicleNumber: '12가3456',
          isActive: true 
        }
      })

      expect(data.warnings).toContainEqual(
        expect.objectContaining({
          row: 1,
          message: 'Driver matched by name+vehicle, phone different'
        })
      )
    })

    it('should handle no driver match', async () => {
      ;(prisma.driver.findFirst as any).mockResolvedValue(null)

      const excelData = [{
        '센터명': '서울물류센터',
        '요청일': '2024-01-15',
        '호차번호': 'CENTER-001',
        '톤수': 3.5,
        '배송지역': '서울,경기',
        '착지수': 3,
        '기사명': '미등록기사',
        '기사연락처': '010-9999-9999',
        '기사차량': '99가9999'
      }]

      const request = createRequest(excelData)
      const response = await POST(request)
      const data = await response.json()

      expect(data.warnings).toContainEqual(
        expect.objectContaining({
          row: 1,
          message: 'No matching driver found: 미등록기사 (010-9999-9999)'
        })
      )

      expect(prisma.request.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          driverId: undefined,
          driverName: '미등록기사',
          driverPhone: '010-9999-9999',
          driverVehicle: '99가9999'
        })
      })
    })
  })

  describe('로딩 포인트 해결', () => {
    it('should find loading point by center name', async () => {
      const excelData = [{
        '센터명': '서울물류센터',
        '요청일': '2024-01-15',
        '호차번호': 'CENTER-001',
        '톤수': 3.5,
        '배송지역': '서울,경기',
        '착지수': 3
      }]

      const request = createRequest(excelData)
      await POST(request)

      expect(prisma.loadingPoint.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: '서울물류센터' },
            { centerName: '서울물류센터' }
          ],
          isActive: true
        }
      })
    })

    it('should handle missing loading point', async () => {
      ;(prisma.loadingPoint.findFirst as any).mockResolvedValue(null)

      const excelData = [{
        '센터명': '미등록센터',
        '요청일': '2024-01-15',
        '호차번호': 'CENTER-001',
        '톤수': 3.5,
        '배송지역': '서울,경기',
        '착지수': 3
      }]

      const request = createRequest(excelData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.errors).toContainEqual(
        expect.objectContaining({
          row: 1,
          message: 'Loading point not found for center: 미등록센터'
        })
      )
    })
  })

  describe('배치 처리', () => {
    it('should process multiple rows', async () => {
      const excelData = [
        {
          '센터명': '서울물류센터',
          '요청일': '2024-01-15',
          '호차번호': 'CENTER-001',
          '톤수': 3.5,
          '배송지역': '서울,경기',
          '착지수': 3
        },
        {
          '센터명': '서울물류센터',
          '요청일': '2024-01-16',
          '호차번호': 'CENTER-002',
          '톤수': 5.0,
          '배송지역': '인천',
          '착지수': 2
        }
      ]

      const request = createRequest(excelData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.progress.totalRows).toBe(2)
      expect(data.progress.successCount).toBe(2)
      expect(data.requests).toHaveLength(2)
    })

    it('should handle mixed success and error rows', async () => {
      const excelData = [
        {
          '센터명': '서울물류센터',
          '요청일': '2024-01-15',
          '호차번호': 'CENTER-001',
          '톤수': 3.5,
          '배송지역': '서울,경기',
          '착지수': 3
        },
        {
          '센터명': '서울물류센터',
          // Missing required field
          '호차번호': 'CENTER-002',
          '톤수': 5.0,
          '배송지역': '인천',
          '착지수': 2
        }
      ]

      const request = createRequest(excelData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200) // Still success because some rows succeeded
      expect(data.progress.totalRows).toBe(2)
      expect(data.progress.successCount).toBe(1)
      expect(data.progress.errorCount).toBe(1)
      expect(data.requests).toHaveLength(1)
      expect(data.errors).toHaveLength(1)
    })
  })

  describe('에러 처리', () => {
    it('should handle database errors gracefully', async () => {
      ;(prisma.request.create as any).mockRejectedValue(new Error('Database error'))

      const excelData = [{
        '센터명': '서울물류센터',
        '요청일': '2024-01-15',
        '호차번호': 'CENTER-001',
        '톤수': 3.5,
        '배송지역': '서울,경기',
        '착지수': 3
      }]

      const request = createRequest(excelData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.errors).toContainEqual(
        expect.objectContaining({
          row: 1,
          message: 'Database error'
        })
      )
    })

    it('should handle malformed Excel files', async () => {
      ;(XLSX.read as any).mockImplementation(() => {
        throw new Error('Invalid Excel file')
      })

      const file = new File(['invalid content'], 'test.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost/api/requests/import', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.errors).toContainEqual(
        expect.objectContaining({
          row: 0,
          message: 'Invalid Excel file'
        })
      )
    })
  })
})