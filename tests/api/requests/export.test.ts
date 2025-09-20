/**
 * 요청 내보내기 API 테스트
 * 통합된 Request 모델의 Excel 내보내기 기능 검증
 */

import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/requests/export/route'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    request: {
      findMany: vi.fn()
    }
  }
}))

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(),
    book_new: vi.fn(),
    book_append_sheet: vi.fn(),
    write: vi.fn()
  }
}))

// Mock profitability service
vi.mock('@/lib/services/profitability.service', () => ({
  calculateProfitability: vi.fn(() => ({
    centerBilling: 380000,
    driverFee: 280000,
    margin: 100000,
    marginRate: 26.32,
    status: 'good',
    statusLabel: '양호',
    statusColor: 'text-blue-600'
  }))
}))

describe('GET /api/requests/export', () => {
  let mockRequests: any[]

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequests = [
      {
        id: 'request-1',
        requestDate: new Date('2024-01-15'),
        centerCarNo: 'CENTER-001',
        vehicleTon: 3.5,
        regions: ['서울', '경기'],
        stops: 3,
        baseFare: 300000,
        extraStopFee: 50000,
        extraRegionFee: 30000,
        extraAdjustment: 0,
        adjustmentReason: null,
        notes: '특별 배송',
        centerBillingTotal: 380000,
        driverId: 'driver-1',
        driverName: '김기사',
        driverPhone: '010-1234-5678',
        driverVehicle: '12가3456',
        driverFee: 280000,
        deliveryTime: '09:00',
        driverNotes: '조심 배송',
        dispatchedAt: new Date('2024-01-15T08:00:00Z'),
        loadingPoint: {
          id: 'loading-point-1',
          name: '서울물류센터',
          centerName: '서울물류센터',
          address: '서울시 강남구'
        },
        driver: {
          id: 'driver-1',
          name: '김기사',
          phone: '010-1234-5678',
          vehicleNumber: '12가3456',
          vehicleTon: 3.5
        }
      },
      {
        id: 'request-2',
        requestDate: new Date('2024-01-16'),
        centerCarNo: 'CENTER-002',
        vehicleTon: 5.0,
        regions: ['인천'],
        stops: 2,
        baseFare: 250000,
        extraStopFee: 20000,
        extraRegionFee: 20000,
        extraAdjustment: 10000,
        adjustmentReason: '긴급 배송',
        notes: null,
        centerBillingTotal: 300000,
        driverId: null,
        driverName: null,
        driverPhone: null,
        driverVehicle: null,
        driverFee: null,
        deliveryTime: null,
        driverNotes: null,
        dispatchedAt: null,
        loadingPoint: {
          id: 'loading-point-2',
          name: '인천물류센터',
          centerName: '인천물류센터',
          address: '인천시 연수구'
        },
        driver: null
      }
    ]

    ;(prisma.request.findMany as any).mockResolvedValue(mockRequests)

    // Mock XLSX functions
    ;(XLSX.utils.json_to_sheet as any).mockReturnValue({ sheet: 'mock' })
    ;(XLSX.utils.book_new as any).mockReturnValue({ workbook: 'mock' })
    ;(XLSX.utils.write as any).mockReturnValue(Buffer.from('mock excel data'))
  })

  describe('기본 내보내기', () => {
    it('should export all requests without filters', async () => {
      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      expect(response.headers.get('Content-Disposition')).toContain('attachment; filename=')

      expect(prisma.request.findMany).toHaveBeenCalledWith({
        include: {
          loadingPoint: true,
          driver: true
        },
        orderBy: {
          requestDate: 'desc'
        }
      })
    })

    it('should generate correct Excel data structure', async () => {
      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      await GET(request)

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        {
          '센터명': '서울물류센터',
          '요청일': '2024-01-15',
          '호차번호': 'CENTER-001',
          '톤수': 3.5,
          '배송지역': '서울, 경기',
          '착지수': 3,
          '기본운임': 300000,
          '착지수당': 50000,
          '지역운임': 30000,
          '추가조정': 0,
          '조정사유': '',
          '센터청구총액': 380000,
          '메모': '특별 배송',
          '기사명': '김기사',
          '기사연락처': '010-1234-5678',
          '기사차량': '12가3456',
          '기사운임': 280000,
          '배송시간': '09:00',
          '기사메모': '조심 배송',
          '배정일시': '2024-01-15 17:00:00',
          '마진금액': 100000,
          '마진율': '26.3%',
          '수익성상태': '양호'
        },
        {
          '센터명': '인천물류센터',
          '요청일': '2024-01-16',
          '호차번호': 'CENTER-002',
          '톤수': 5.0,
          '배송지역': '인천',
          '착지수': 2,
          '기본운임': 250000,
          '착지수당': 20000,
          '지역운임': 20000,
          '추가조정': 10000,
          '조정사유': '긴급 배송',
          '센터청구총액': 300000,
          '메모': '',
          '기사명': '',
          '기사연락처': '',
          '기사차량': '',
          '기사운임': 0,
          '배송시간': '',
          '기사메모': '',
          '배정일시': '',
          '마진금액': 100000,
          '마진율': '26.3%',
          '수익성상태': '양호'
        }
      ])
    })
  })

  describe('필터링', () => {
    it('should apply date range filter', async () => {
      const url = new URL('http://localhost/api/requests/export?startDate=2024-01-01&endDate=2024-01-31')
      const request = new NextRequest(url)

      await GET(request)

      expect(prisma.request.findMany).toHaveBeenCalledWith({
        where: {
          requestDate: {
            gte: new Date('2024-01-01T00:00:00.000Z'),
            lte: new Date('2024-01-31T23:59:59.999Z')
          }
        },
        include: {
          loadingPoint: true,
          driver: true
        },
        orderBy: {
          requestDate: 'desc'
        }
      })
    })

    it('should apply center filter', async () => {
      const url = new URL('http://localhost/api/requests/export?center=서울물류센터')
      const request = new NextRequest(url)

      await GET(request)

      expect(prisma.request.findMany).toHaveBeenCalledWith({
        where: {
          loadingPoint: {
            OR: [
              { name: { contains: '서울물류센터', mode: 'insensitive' } },
              { centerName: { contains: '서울물류센터', mode: 'insensitive' } }
            ]
          }
        },
        include: {
          loadingPoint: true,
          driver: true
        },
        orderBy: {
          requestDate: 'desc'
        }
      })
    })

    it('should apply driver filter', async () => {
      const url = new URL('http://localhost/api/requests/export?driver=김기사')
      const request = new NextRequest(url)

      await GET(request)

      expect(prisma.request.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { driverName: { contains: '김기사', mode: 'insensitive' } },
            { driver: { name: { contains: '김기사', mode: 'insensitive' } } }
          ]
        },
        include: {
          loadingPoint: true,
          driver: true
        },
        orderBy: {
          requestDate: 'desc'
        }
      })
    })

    it('should apply dispatch status filter', async () => {
      const url = new URL('http://localhost/api/requests/export?dispatched=true')
      const request = new NextRequest(url)

      await GET(request)

      expect(prisma.request.findMany).toHaveBeenCalledWith({
        where: {
          dispatchedAt: { not: null }
        },
        include: {
          loadingPoint: true,
          driver: true
        },
        orderBy: {
          requestDate: 'desc'
        }
      })
    })

    it('should apply multiple filters', async () => {
      const url = new URL('http://localhost/api/requests/export?startDate=2024-01-01&endDate=2024-01-31&center=서울&dispatched=false')
      const request = new NextRequest(url)

      await GET(request)

      expect(prisma.request.findMany).toHaveBeenCalledWith({
        where: {
          requestDate: {
            gte: new Date('2024-01-01T00:00:00.000Z'),
            lte: new Date('2024-01-31T23:59:59.999Z')
          },
          loadingPoint: {
            OR: [
              { name: { contains: '서울', mode: 'insensitive' } },
              { centerName: { contains: '서울', mode: 'insensitive' } }
            ]
          },
          dispatchedAt: null
        },
        include: {
          loadingPoint: true,
          driver: true
        },
        orderBy: {
          requestDate: 'desc'
        }
      })
    })
  })

  describe('데이터 변환', () => {
    it('should handle null/undefined values', async () => {
      const requestWithNulls = {
        ...mockRequests[1], // Second request has many null values
        notes: null,
        adjustmentReason: null,
        driverName: null,
        driverPhone: null
      }

      ;(prisma.request.findMany as any).mockResolvedValue([requestWithNulls])

      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      await GET(request)

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        expect.objectContaining({
          '메모': '',
          '조정사유': '',
          '기사명': '',
          '기사연락처': '',
          '기사차량': '',
          '기사운임': 0,
          '배송시간': '',
          '기사메모': '',
          '배정일시': ''
        })
      ])
    })

    it('should format regions as comma-separated string', async () => {
      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      await GET(request)

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        expect.objectContaining({
          '배송지역': '서울, 경기'
        }),
        expect.objectContaining({
          '배송지역': '인천'
        })
      ])
    })

    it('should format dispatch date correctly', async () => {
      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      await GET(request)

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        expect.objectContaining({
          '배정일시': '2024-01-15 17:00:00' // UTC+9 conversion
        }),
        expect.objectContaining({
          '배정일시': ''
        })
      ])
    })

    it('should include profitability calculations', async () => {
      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      await GET(request)

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        expect.objectContaining({
          '마진금액': 100000,
          '마진율': '26.3%',
          '수익성상태': '양호'
        }),
        expect.objectContaining({
          '마진금액': 100000,
          '마진율': '26.3%',
          '수익성상태': '양호'
        })
      ])
    })
  })

  describe('파일명 생성', () => {
    it('should generate filename with current date', async () => {
      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      const response = await GET(request)

      const contentDisposition = response.headers.get('Content-Disposition')
      expect(contentDisposition).toMatch(/requests_export_\d{8}_\d{6}\.xlsx/)
    })

    it('should generate filename with date range when filtered', async () => {
      const url = new URL('http://localhost/api/requests/export?startDate=2024-01-01&endDate=2024-01-31')
      const request = new NextRequest(url)

      const response = await GET(request)

      const contentDisposition = response.headers.get('Content-Disposition')
      expect(contentDisposition).toContain('20240101_20240131')
    })
  })

  describe('대용량 데이터 처리', () => {
    it('should handle large datasets efficiently', async () => {
      // Generate large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        ...mockRequests[0],
        id: `request-${i}`,
        centerCarNo: `CENTER-${String(i).padStart(3, '0')}`
      }))

      ;(prisma.request.findMany as any).mockResolvedValue(largeDataset)

      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            '호차번호': 'CENTER-000'
          })
        ])
      )
    })

    it('should limit export size for performance', async () => {
      const url = new URL('http://localhost/api/requests/export?limit=1000')
      const request = new NextRequest(url)

      await GET(request)

      expect(prisma.request.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1000
        })
      )
    })
  })

  describe('에러 처리', () => {
    it('should handle database errors', async () => {
      ;(prisma.request.findMany as any).mockRejectedValue(new Error('Database connection failed'))

      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to export requests')
    })

    it('should handle Excel generation errors', async () => {
      ;(XLSX.utils.write as any).mockImplementation(() => {
        throw new Error('Excel generation failed')
      })

      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to export requests')
    })

    it('should handle invalid date parameters', async () => {
      const url = new URL('http://localhost/api/requests/export?startDate=invalid-date')
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid date format')
    })

    it('should handle empty result set', async () => {
      ;(prisma.request.findMany as any).mockResolvedValue([])

      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([])
    })
  })

  describe('성능 최적화', () => {
    it('should use efficient database query', async () => {
      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      await GET(request)

      expect(prisma.request.findMany).toHaveBeenCalledWith({
        include: {
          loadingPoint: true,
          driver: true
        },
        orderBy: {
          requestDate: 'desc'
        }
      })
    })

    it('should stream large responses', async () => {
      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      const response = await GET(request)

      // Check that response can be streamed
      expect(response.body).toBeDefined()
      expect(response.headers.get('Content-Type')).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    })
  })

  describe('보안', () => {
    it('should validate query parameters', async () => {
      const url = new URL('http://localhost/api/requests/export?malicious=<script>')
      const request = new NextRequest(url)

      const response = await GET(request)

      // Should not crash and should handle parameter safely
      expect(response.status).toBeLessThan(500)
    })

    it('should not expose sensitive data in errors', async () => {
      ;(prisma.request.findMany as any).mockRejectedValue(new Error('Connection string: postgres://user:password@localhost'))

      const url = new URL('http://localhost/api/requests/export')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(data.error).toBe('Failed to export requests')
      expect(data.error).not.toContain('password')
    })
  })
})