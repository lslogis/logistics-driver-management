/**
 * 기사 배정 워크플로우 통합 테스트
 * 전체 기사 배정 프로세스의 엔드투엔드 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDriverAssignment } from '@/hooks/useDriverAssignment'
import { useSmartInvalidation } from '@/hooks/useOptimizedQueries'
import { calculateProfitability } from '@/lib/services/profitability.service'
import { requestsAPI } from '@/lib/api/requests'
import { Request, Driver } from '@/types'

// Mock APIs
vi.mock('@/lib/api/requests', () => ({
  requestsAPI: {
    update: vi.fn(),
    get: vi.fn()
  }
}))

// Test data
const mockRequest: Request = {
  id: 'request-1',
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
  centerBillingTotal: 380000,
  createdAt: new Date(),
  updatedAt: new Date()
} as Request

const mockDriver: Driver = {
  id: 'driver-1',
  name: '김기사',
  phone: '010-1234-5678',
  vehicleNumber: '12가3456',
  vehicleTon: 3.5,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
} as Driver

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Driver Assignment Workflow Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
        mutations: { retry: false }
      }
    })
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('전체 기사 배정 프로세스', () => {
    it('should complete full assignment workflow successfully', async () => {
      // Mock successful API responses
      const updatedRequest = {
        ...mockRequest,
        driverId: mockDriver.id,
        driverName: mockDriver.name,
        driverPhone: mockDriver.phone,
        driverVehicle: mockDriver.vehicleNumber,
        driverFee: 280000,
        deliveryTime: '09:00',
        driverNotes: '조심히 배송',
        dispatchedAt: new Date()
      }

      ;(requestsAPI.update as any).mockResolvedValue(updatedRequest)
      ;(requestsAPI.get as any).mockResolvedValue(updatedRequest)

      const onSuccess = vi.fn()

      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, onSuccess),
        { wrapper: createTestWrapper() }
      )

      // 1. 초기 상태 확인
      expect(result.current.formData.driverId).toBe('')
      expect(result.current.canSubmit).toBe(false)
      expect(result.current.profitability).toBeDefined()

      // 2. 기사 선택
      act(() => {
        result.current.updateDriverSelection(mockDriver)
      })

      expect(result.current.formData.driverId).toBe(mockDriver.id)
      expect(result.current.selectedDriver).toEqual(mockDriver)
      expect(result.current.canSubmit).toBe(true)

      // 3. 운임 조정
      act(() => {
        result.current.updateDriverFee(280000)
      })

      expect(result.current.formData.driverFee).toBe(280000)

      // 4. 추가 정보 입력
      act(() => {
        result.current.updateField('deliveryTime', '09:00')
        result.current.updateField('driverNotes', '조심히 배송')
      })

      expect(result.current.formData.deliveryTime).toBe('09:00')
      expect(result.current.formData.driverNotes).toBe('조심히 배송')

      // 5. 폼 제출
      await act(async () => {
        await result.current.handleSubmit()
      })

      // 6. API 호출 검증
      expect(requestsAPI.update).toHaveBeenCalledWith(mockRequest.id, {
        driverId: mockDriver.id,
        driverName: mockDriver.name,
        driverPhone: mockDriver.phone,
        driverVehicle: mockDriver.vehicleNumber,
        driverFee: 280000,
        deliveryTime: '09:00',
        driverNotes: '조심히 배송',
        dispatchedAt: expect.any(Date)
      })

      // 7. 성공 콜백 실행 확인
      expect(onSuccess).toHaveBeenCalledWith(updatedRequest)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle assignment update correctly', async () => {
      // Start with assigned request
      const assignedRequest = {
        ...mockRequest,
        driverId: 'old-driver',
        driverName: '이기사',
        driverPhone: '010-9999-9999',
        driverVehicle: '99가9999',
        driverFee: 250000,
        dispatchedAt: new Date()
      }

      const updatedRequest = {
        ...assignedRequest,
        driverId: mockDriver.id,
        driverName: mockDriver.name,
        driverPhone: mockDriver.phone,
        driverVehicle: mockDriver.vehicleNumber,
        driverFee: 280000
      }

      ;(requestsAPI.update as any).mockResolvedValue(updatedRequest)

      const onSuccess = vi.fn()

      const { result } = renderHook(
        () => useDriverAssignment(assignedRequest, onSuccess),
        { wrapper: createTestWrapper() }
      )

      // Form should be populated with existing data
      expect(result.current.formData.driverId).toBe('old-driver')
      expect(result.current.formData.driverFee).toBe(250000)

      // Update to new driver
      act(() => {
        result.current.updateDriverSelection(mockDriver)
        result.current.updateDriverFee(280000)
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(requestsAPI.update).toHaveBeenCalledWith(assignedRequest.id, {
        driverId: mockDriver.id,
        driverName: mockDriver.name,
        driverPhone: mockDriver.phone,
        driverVehicle: mockDriver.vehicleNumber,
        driverFee: 280000,
        deliveryTime: '',
        driverNotes: '',
        dispatchedAt: expect.any(Date)
      })

      expect(onSuccess).toHaveBeenCalledWith(updatedRequest)
    })
  })

  describe('수익성 계산 통합', () => {
    it('should update profitability in real-time as user inputs change', async () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest),
        { wrapper: createTestWrapper() }
      )

      // Initial profitability
      const initialProfitability = result.current.profitability

      // Change driver fee
      act(() => {
        result.current.updateDriverFee(320000) // Higher fee = lower margin
      })

      // Profitability should update
      const updatedProfitability = result.current.profitability
      expect(updatedProfitability.driverFee).toBe(320000)
      expect(updatedProfitability.margin).toBeLessThan(initialProfitability.margin)
      expect(updatedProfitability.marginRate).toBeLessThan(initialProfitability.marginRate)
    })

    it('should provide accurate margin status warnings', async () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest),
        { wrapper: createTestWrapper() }
      )

      // Test different fee levels
      const testCases = [
        { fee: 200000, expectedStatus: 'excellent' }, // High margin
        { fee: 280000, expectedStatus: 'good' },      // Good margin  
        { fee: 320000, expectedStatus: 'fair' },      // Fair margin
        { fee: 360000, expectedStatus: 'poor' },      // Poor margin
        { fee: 400000, expectedStatus: 'loss' }       // Loss
      ]

      for (const testCase of testCases) {
        act(() => {
          result.current.updateDriverFee(testCase.fee)
        })

        expect(result.current.profitability.status).toBe(testCase.expectedStatus)
      }
    })
  })

  describe('데이터 동기화', () => {
    it('should invalidate related queries after successful assignment', async () => {
      const { result: assignmentResult } = renderHook(
        () => useDriverAssignment(mockRequest),
        { wrapper: createTestWrapper() }
      )

      const { result: invalidationResult } = renderHook(
        () => useSmartInvalidation(),
        { wrapper: createTestWrapper() }
      )

      const invalidateRequestsSpy = vi.spyOn(invalidationResult.current, 'invalidateRequests')
      const updateRequestDataSpy = vi.spyOn(invalidationResult.current, 'updateRequestData')

      const updatedRequest = {
        ...mockRequest,
        driverId: mockDriver.id,
        driverName: mockDriver.name,
        driverFee: 280000,
        dispatchedAt: new Date()
      }

      ;(requestsAPI.update as any).mockResolvedValue(updatedRequest)

      // Assign driver
      act(() => {
        assignmentResult.current.updateDriverSelection(mockDriver)
      })

      await act(async () => {
        await assignmentResult.current.handleSubmit()
      })

      // Should trigger query invalidation
      await waitFor(() => {
        expect(invalidateRequestsSpy).toHaveBeenCalled()
      })
    })
  })

  describe('에러 시나리오', () => {
    it('should handle API errors gracefully', async () => {
      const apiError = new Error('Network error')
      ;(requestsAPI.update as any).mockRejectedValue(apiError)

      const onSuccess = vi.fn()
      const onError = vi.fn()

      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, onSuccess),
        { wrapper: createTestWrapper() }
      )

      act(() => {
        result.current.updateDriverSelection(mockDriver)
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.isLoading).toBe(false)
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest),
        { wrapper: createTestWrapper() }
      )

      // Invalid fee
      act(() => {
        result.current.updateDriverSelection(mockDriver)
        result.current.updateDriverFee(-1000)
      })

      expect(result.current.canSubmit).toBe(false)
      expect(result.current.validationErrors.driverFee).toBeDefined()

      // Try to submit
      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(requestsAPI.update).not.toHaveBeenCalled()
    })

    it('should handle partial assignment data', async () => {
      const partialRequest = {
        ...mockRequest,
        baseFare: undefined,
        centerBillingTotal: undefined
      } as Request

      const { result } = renderHook(
        () => useDriverAssignment(partialRequest),
        { wrapper: createTestWrapper() }
      )

      // Should still work with partial data
      expect(result.current.profitability).toBeDefined()
      expect(result.current.formData.driverFee).toBeGreaterThanOrEqual(0)

      act(() => {
        result.current.updateDriverSelection(mockDriver)
      })

      expect(result.current.canSubmit).toBe(true)
    })
  })

  describe('성능 및 최적화', () => {
    it('should not cause unnecessary re-renders', async () => {
      const renderSpy = vi.fn()

      const TestComponent = () => {
        renderSpy()
        return useDriverAssignment(mockRequest)
      }

      const { result, rerender } = renderHook(TestComponent, {
        wrapper: createTestWrapper()
      })

      const initialRenderCount = renderSpy.mock.calls.length

      // Re-render without changes
      rerender()

      // Should not cause additional renders due to memoization
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount)
    })

    it('should handle rapid state updates efficiently', async () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest),
        { wrapper: createTestWrapper() }
      )

      // Rapid fee updates
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.updateDriverFee(250000 + i * 1000)
        }
      })

      // Should handle all updates and end with final value
      expect(result.current.formData.driverFee).toBe(349000)
      expect(result.current.profitability).toBeDefined()
      expect(result.current.profitability.driverFee).toBe(349000)
    })
  })

  describe('사용자 경험 시나리오', () => {
    it('should support assignment workflow with multiple changes', async () => {
      const onSuccess = vi.fn()

      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, onSuccess),
        { wrapper: createTestWrapper() }
      )

      // User selects driver
      act(() => {
        result.current.updateDriverSelection(mockDriver)
      })

      // User changes mind about fee
      act(() => {
        result.current.updateDriverFee(300000)
        result.current.updateDriverFee(280000) // Final decision
      })

      // User adds delivery instructions
      act(() => {
        result.current.updateField('deliveryTime', '09:30')
        result.current.updateField('driverNotes', '문앞 배송')
      })

      // User decides to change delivery time
      act(() => {
        result.current.updateField('deliveryTime', '10:00')
      })

      const updatedRequest = {
        ...mockRequest,
        driverId: mockDriver.id,
        driverFee: 280000,
        deliveryTime: '10:00',
        driverNotes: '문앞 배송',
        dispatchedAt: new Date()
      }

      ;(requestsAPI.update as any).mockResolvedValue(updatedRequest)

      // Final submission
      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(requestsAPI.update).toHaveBeenCalledWith(mockRequest.id, {
        driverId: mockDriver.id,
        driverName: mockDriver.name,
        driverPhone: mockDriver.phone,
        driverVehicle: mockDriver.vehicleNumber,
        driverFee: 280000,
        deliveryTime: '10:00',
        driverNotes: '문앞 배송',
        dispatchedAt: expect.any(Date)
      })

      expect(onSuccess).toHaveBeenCalledWith(updatedRequest)
    })

    it('should support cancellation and form reset', async () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest),
        { wrapper: createTestWrapper() }
      )

      // User makes changes
      act(() => {
        result.current.updateDriverSelection(mockDriver)
        result.current.updateDriverFee(300000)
        result.current.updateField('deliveryTime', '14:00')
      })

      // User cancels and resets
      act(() => {
        result.current.resetForm()
      })

      // Should return to initial state
      expect(result.current.formData.driverId).toBe('')
      expect(result.current.formData.deliveryTime).toBe('')
      expect(result.current.selectedDriver).toBeNull()
      expect(result.current.canSubmit).toBe(false)
    })
  })
})