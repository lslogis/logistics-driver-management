/**
 * 수익성 서비스 테스트
 * 중앙화된 수익성 계산 로직의 정확성 검증
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { 
  calculateProfitability, 
  calculateRecommendedDriverFee,
  ProfitabilityThresholds
} from '@/lib/services/profitability.service'

const DEFAULT_THRESHOLDS: ProfitabilityThresholds = {
  profitThreshold: 20,
  breakEvenThreshold: 0
}
import { Request } from '@/types'

describe('Profitability Service', () => {
  let mockRequest: Request

  beforeEach(() => {
    mockRequest = {
      id: 'test-request-1',
      loadingPointId: 'loading-point-1',
      requestDate: '2024-01-15',
      centerCarNo: 'CENTER-001',
      vehicleTon: 3.5,
      regions: ['서울', '경기'],
      stops: 3,
      baseFare: 300000,
      extraStopFee: 50000,
      extraRegionFee: 30000,
      extraAdjustment: 0,
      driverFee: 250000,
      centerBillingTotal: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Request
  })

  describe('calculateProfitability', () => {
    it('should calculate basic profitability correctly', () => {
      const result = calculateProfitability(mockRequest)

      expect(result.centerBilling).toBe(380000) // 300000 + 50000 + 30000
      expect(result.driverFee).toBe(250000)
      expect(result.margin).toBe(130000) // 380000 - 250000
      expect(result.marginRate).toBeCloseTo(34.21, 2) // (130000 / 380000) * 100
      expect(result.status).toBe('profit')
      expect(result.statusLabel).toBe('✅ 수익')
    })

    it('should use centerBillingTotal when provided', () => {
      mockRequest.centerBillingTotal = 400000

      const result = calculateProfitability(mockRequest)

      expect(result.centerBilling).toBe(400000)
      expect(result.margin).toBe(150000) // 400000 - 250000
      expect(result.marginRate).toBeCloseTo(37.5, 2)
    })

    it('should handle negative adjustment correctly', () => {
      mockRequest.extraAdjustment = -20000

      const result = calculateProfitability(mockRequest)

      expect(result.centerBilling).toBe(360000) // 300000 + 50000 + 30000 - 20000
      expect(result.margin).toBe(110000) // 360000 - 250000
      expect(result.marginRate).toBeCloseTo(30.56, 2)
      expect(result.status).toBe('profit')
    })

    it('should handle zero driver fee correctly', () => {
      mockRequest.driverFee = 0

      const result = calculateProfitability(mockRequest)

      expect(result.centerBilling).toBe(380000)
      expect(result.driverFee).toBe(0)
      expect(result.margin).toBe(380000)
      expect(result.marginRate).toBe(100)
      expect(result.status).toBe('profit')
    })

    it('should handle no driver assignment correctly', () => {
      mockRequest.driverFee = null as any
      delete mockRequest.driverName
      delete mockRequest.driverId

      const result = calculateProfitability(mockRequest)

      expect(result.driverFee).toBe(0)
      expect(result.margin).toBe(380000)
      expect(result.marginRate).toBe(100)
    })

    it('should classify margin rates correctly', () => {
      // Profit (>=20%)
      mockRequest.driverFee = 200000 // Margin: 180000 (47.37%)
      expect(calculateProfitability(mockRequest).status).toBe('profit')

      mockRequest.driverFee = 280000 // Margin: 100000 (26.32%)
      expect(calculateProfitability(mockRequest).status).toBe('profit')

      // Break-even (0-20%)
      mockRequest.driverFee = 320000 // Margin: 60000 (15.79%)
      expect(calculateProfitability(mockRequest).status).toBe('break-even')

      mockRequest.driverFee = 360000 // Margin: 20000 (5.26%)
      expect(calculateProfitability(mockRequest).status).toBe('break-even')

      // Loss (<0%)
      mockRequest.driverFee = 400000 // Margin: -20000 (-5.26%)
      expect(calculateProfitability(mockRequest).status).toBe('loss')
    })

    it('should handle custom thresholds', () => {
      const customThresholds: ProfitabilityThresholds = {
        profitThreshold: 30,
        breakEvenThreshold: 10
      }

      mockRequest.driverFee = 280000 // Margin rate: 26.32%

      const result = calculateProfitability(mockRequest, customThresholds)
      expect(result.status).toBe('break-even') // Below 30% threshold but above 10%
    })

    it('should provide correct status colors and labels', () => {
      const testCases = [
        { fee: 200000, expectedStatus: 'profit', expectedLabel: '✅ 수익' },
        { fee: 280000, expectedStatus: 'profit', expectedLabel: '✅ 수익' },
        { fee: 320000, expectedStatus: 'break-even', expectedLabel: '⚠️ 보통' },
        { fee: 360000, expectedStatus: 'break-even', expectedLabel: '⚠️ 보통' },
        { fee: 400000, expectedStatus: 'loss', expectedLabel: '❌ 손실' }
      ]

      testCases.forEach(({ fee, expectedStatus, expectedLabel }) => {
        mockRequest.driverFee = fee
        const result = calculateProfitability(mockRequest)
        
        expect(result.status).toBe(expectedStatus)
        expect(result.statusLabel).toBe(expectedLabel)
        expect(result.statusColor).toBeDefined()
      })
    })

    it('should handle edge cases', () => {
      // Zero center billing with driver fee = negative margin
      mockRequest.baseFare = 0
      mockRequest.extraStopFee = 0
      mockRequest.extraRegionFee = 0
      mockRequest.driverFee = 100000

      const result = calculateProfitability(mockRequest)
      expect(result.centerBilling).toBe(0)
      expect(result.margin).toBe(-100000)
      expect(result.marginRate).toBe(0) // Should not divide by zero
      // With 0% margin rate and negative margin, this falls under break-even threshold
      expect(result.status).toBe('break-even')
    })

    it('should be consistent with repeated calculations', () => {
      const result1 = calculateProfitability(mockRequest)
      const result2 = calculateProfitability(mockRequest)

      expect(result1).toEqual(result2)
    })
  })

  describe('calculateRecommendedDriverFee', () => {
    it('should calculate recommended fee for 25% target margin', () => {
      const result = calculateRecommendedDriverFee(mockRequest)
      const expectedFee = 380000 * 0.75 // 75% of center billing
      
      expect(result).toBe(Math.round(expectedFee / 1000) * 1000) // Rounded to nearest 1000
    })

    it('should calculate recommended fee for custom target margin', () => {
      const result = calculateRecommendedDriverFee(mockRequest, 30)
      const expectedFee = 380000 * 0.7 // 70% of center billing
      
      expect(result).toBe(Math.round(expectedFee / 1000) * 1000)
    })

    it('should handle edge cases', () => {
      // Zero center billing
      mockRequest.baseFare = 0
      mockRequest.extraStopFee = 0
      mockRequest.extraRegionFee = 0

      const result = calculateRecommendedDriverFee(mockRequest)
      expect(result).toBe(0)
    })

    it('should always return values rounded to nearest 1000', () => {
      const testCases = [
        { billing: 100000, targetMargin: 25, expected: 75000 },
        { billing: 123456, targetMargin: 25, expected: 93000 }, // 92592 -> 93000
        { billing: 150000, targetMargin: 30, expected: 105000 },
        { billing: 200000, targetMargin: 20, expected: 160000 }
      ]

      testCases.forEach(({ billing, targetMargin, expected }) => {
        mockRequest.centerBillingTotal = billing
        const result = calculateRecommendedDriverFee(mockRequest, targetMargin)
        expect(result).toBe(expected)
      })
    })
  })

  describe('Performance', () => {
    it('should calculate profitability efficiently for large datasets', () => {
      const startTime = performance.now()
      
      // Simulate 1000 calculations
      for (let i = 0; i < 1000; i++) {
        calculateProfitability(mockRequest)
      }
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should complete 1000 calculations in under 100ms
      expect(executionTime).toBeLessThan(100)
    })

    it('should not mutate input request object', () => {
      const originalRequest = { ...mockRequest }
      
      calculateProfitability(mockRequest)
      
      expect(mockRequest).toEqual(originalRequest)
    })
  })

  describe('Integration with Real Data Patterns', () => {
    it('should handle typical Korean logistics pricing patterns', () => {
      const typicalRequests = [
        // 서울-경기 단거리
        {
          ...mockRequest,
          baseFare: 250000,
          extraStopFee: 30000,
          extraRegionFee: 20000,
          driverFee: 200000
        },
        // 서울-부산 장거리
        {
          ...mockRequest,
          baseFare: 800000,
          extraStopFee: 100000,
          extraRegionFee: 150000,
          driverFee: 750000
        },
        // 소량 배송
        {
          ...mockRequest,
          baseFare: 150000,
          extraStopFee: 20000,
          extraRegionFee: 10000,
          driverFee: 130000
        }
      ]

      typicalRequests.forEach(request => {
        const result = calculateProfitability(request)
        
        // 기본 검증
        expect(result.centerBilling).toBeGreaterThan(0)
        expect(result.marginRate).toBeGreaterThanOrEqual(-100)
        expect(['profit', 'break-even', 'loss']).toContain(result.status)
        expect(result.statusLabel).toBeTruthy()
        expect(result.statusColor).toBeTruthy()
      })
    })
  })
})