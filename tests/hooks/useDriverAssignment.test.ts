/**
 * 기사 배정 훅 테스트
 * 중앙화된 기사 배정 로직의 정확성 검증
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDriverAssignment } from '@/hooks/useDriverAssignment'
import { Request, Driver } from '@/types'
import * as requestsAPI from '@/lib/api/requests'

// Mock API calls
vi.mock('@/lib/api/requests', () => ({
  requestsAPI: {
    update: vi.fn()
  }
}))

vi.mock('@/lib/services/profitability.service', () => ({
  calculateProfitability: vi.fn(() => ({
    centerBilling: 300000,
    driverFee: 250000,
    margin: 50000,
    marginRate: 16.67,
    status: 'fair',
    statusLabel: '보통',
    statusColor: 'text-yellow-600'
  })),
  calculateRecommendedDriverFee: vi.fn(() => 225000)
}))

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useDriverAssignment Hook', () => {
  let mockRequest: Request
  let mockDriver: Driver
  let mockOnSuccess: vi.Mock

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      id: 'test-request-1',
      loadingPointId: 'loading-point-1',
      requestDate: '2024-01-15',
      centerCarNo: 'CENTER-001',
      vehicleTon: 3.5,
      regions: ['서울', '경기'],
      stops: 3,
      baseFare: 200000,
      extraStopFee: 50000,
      extraRegionFee: 50000,
      extraAdjustment: 0,
      centerBillingTotal: 300000,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Request

    mockDriver = {
      id: 'driver-1',
      name: '김기사',
      phone: '010-1234-5678',
      vehicleNumber: '12가3456',
      vehicleTon: 3.5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Driver

    mockOnSuccess = vi.fn()

    // Mock successful API response
    ;(requestsAPI.update as any).mockResolvedValue({
      ...mockRequest,
      driverId: mockDriver.id,
      driverName: mockDriver.name,
      driverPhone: mockDriver.phone,
      driverVehicle: mockDriver.vehicleNumber,
      driverFee: 250000,
      dispatchedAt: new Date()
    })
  })

  describe('초기 상태', () => {
    it('should initialize with default form values', () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      expect(result.current.formData.driverId).toBe('')
      expect(result.current.formData.driverFee).toBe(225000) // Recommended fee
      expect(result.current.formData.deliveryTime).toBe('')
      expect(result.current.formData.driverNotes).toBe('')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.canSubmit).toBe(false)
    })

    it('should calculate recommended driver fee on mount', () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      expect(result.current.formData.driverFee).toBe(225000)
      expect(result.current.profitability).toEqual({
        centerBilling: 300000,
        driverFee: 250000,
        margin: 50000,
        marginRate: 16.67,
        status: 'fair',
        statusLabel: '보통',
        statusColor: 'text-yellow-600'
      })
    })

    it('should populate form when request has driver info', () => {
      const requestWithDriver = {
        ...mockRequest,
        driverId: 'driver-1',
        driverName: '김기사',
        driverPhone: '010-1234-5678',
        driverVehicle: '12가3456',
        driverFee: 250000,
        deliveryTime: '09:00',
        driverNotes: '테스트 메모'
      }

      const { result } = renderHook(
        () => useDriverAssignment(requestWithDriver, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      expect(result.current.formData.driverId).toBe('driver-1')
      expect(result.current.formData.driverFee).toBe(250000)
      expect(result.current.formData.deliveryTime).toBe('09:00')
      expect(result.current.formData.driverNotes).toBe('테스트 메모')
      expect(result.current.canSubmit).toBe(true)
    })
  })

  describe('폼 업데이트', () => {
    it('should update driver selection and auto-fill info', () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.updateDriverSelection(mockDriver)
      })

      expect(result.current.formData.driverId).toBe(mockDriver.id)
      expect(result.current.selectedDriver).toEqual(mockDriver)
      expect(result.current.canSubmit).toBe(true)
    })

    it('should update driver fee and recalculate profitability', () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.updateDriverFee(280000)
      })

      expect(result.current.formData.driverFee).toBe(280000)
      // Profitability should be recalculated with new fee
      expect(result.current.profitability).toBeDefined()
    })

    it('should update form field', () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.updateField('deliveryTime', '10:30')
        result.current.updateField('driverNotes', '새로운 메모')
      })

      expect(result.current.formData.deliveryTime).toBe('10:30')
      expect(result.current.formData.driverNotes).toBe('새로운 메모')
    })
  })

  describe('유효성 검사', () => {
    it('should validate required fields', () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      // No driver selected
      expect(result.current.canSubmit).toBe(false)
      expect(result.current.validationErrors.driverId).toBe('기사를 선택해주세요')

      // Select driver
      act(() => {
        result.current.updateDriverSelection(mockDriver)
      })

      expect(result.current.canSubmit).toBe(true)
      expect(result.current.validationErrors.driverId).toBeUndefined()
    })

    it('should validate driver fee', () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.updateDriverSelection(mockDriver)
        result.current.updateDriverFee(-1000) // Invalid fee
      })

      expect(result.current.canSubmit).toBe(false)
      expect(result.current.validationErrors.driverFee).toBe('기사 운임은 0원 이상이어야 합니다')

      act(() => {
        result.current.updateDriverFee(250000) // Valid fee
      })

      expect(result.current.canSubmit).toBe(true)
      expect(result.current.validationErrors.driverFee).toBeUndefined()
    })

    it('should validate delivery time format', () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.updateDriverSelection(mockDriver)
        result.current.updateField('deliveryTime', '25:00') // Invalid time
      })

      expect(result.current.validationErrors.deliveryTime).toBe('올바른 시간 형식을 입력해주세요 (예: 09:30)')

      act(() => {
        result.current.updateField('deliveryTime', '09:30') // Valid time
      })

      expect(result.current.validationErrors.deliveryTime).toBeUndefined()
    })
  })

  describe('제출 및 API 호출', () => {
    it('should submit assignment successfully', async () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      // Setup valid form
      act(() => {
        result.current.updateDriverSelection(mockDriver)
        result.current.updateDriverFee(250000)
        result.current.updateField('deliveryTime', '09:00')
      })

      // Submit
      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(requestsAPI.update).toHaveBeenCalledWith(mockRequest.id, {
        driverId: mockDriver.id,
        driverName: mockDriver.name,
        driverPhone: mockDriver.phone,
        driverVehicle: mockDriver.vehicleNumber,
        driverFee: 250000,
        deliveryTime: '09:00',
        driverNotes: '',
        dispatchedAt: expect.any(Date)
      })

      expect(mockOnSuccess).toHaveBeenCalled()
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('API Error')
      ;(requestsAPI.update as any).mockRejectedValue(apiError)

      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      // Setup valid form
      act(() => {
        result.current.updateDriverSelection(mockDriver)
      })

      // Submit
      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.isLoading).toBe(false)
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('should not submit if validation fails', async () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      // Try to submit without selecting driver
      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(requestsAPI.update).not.toHaveBeenCalled()
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('폼 재설정', () => {
    it('should reset form to initial state', () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      // Make changes
      act(() => {
        result.current.updateDriverSelection(mockDriver)
        result.current.updateDriverFee(280000)
        result.current.updateField('deliveryTime', '10:00')
        result.current.updateField('driverNotes', '메모')
      })

      // Reset
      act(() => {
        result.current.resetForm()
      })

      expect(result.current.formData.driverId).toBe('')
      expect(result.current.formData.driverFee).toBe(225000) // Back to recommended
      expect(result.current.formData.deliveryTime).toBe('')
      expect(result.current.formData.driverNotes).toBe('')
      expect(result.current.selectedDriver).toBeNull()
      expect(result.current.canSubmit).toBe(false)
    })
  })

  describe('최적화 및 성능', () => {
    it('should not recalculate profitability unnecessarily', () => {
      const calculateProfitability = vi.fn(() => ({
        centerBilling: 300000,
        driverFee: 250000,
        margin: 50000,
        marginRate: 16.67,
        status: 'fair',
        statusLabel: '보통',
        statusColor: 'text-yellow-600'
      }))

      vi.doMock('@/lib/services/profitability.service', () => ({
        calculateProfitability,
        calculateRecommendedDriverFee: vi.fn(() => 225000)
      }))

      const { result, rerender } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      const initialCallCount = calculateProfitability.mock.calls.length

      // Re-render without changes
      rerender()

      // Should not call profitability calculation again
      expect(calculateProfitability.mock.calls.length).toBe(initialCallCount)
    })

    it('should handle rapid form updates efficiently', () => {
      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      // Rapid updates
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.updateDriverFee(250000 + i * 1000)
        }
      })

      // Should still work correctly
      expect(result.current.formData.driverFee).toBe(259000)
      expect(result.current.profitability).toBeDefined()
    })
  })

  describe('엣지 케이스', () => {
    it('should handle null request gracefully', () => {
      const { result } = renderHook(
        () => useDriverAssignment(null, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      expect(result.current.formData.driverFee).toBe(0)
      expect(result.current.profitability).toBeDefined()
      expect(result.current.canSubmit).toBe(false)
    })

    it('should handle request without pricing info', () => {
      const requestWithoutPricing = {
        ...mockRequest,
        baseFare: undefined,
        extraStopFee: undefined,
        extraRegionFee: undefined,
        centerBillingTotal: undefined
      } as Request

      const { result } = renderHook(
        () => useDriverAssignment(requestWithoutPricing, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      expect(result.current.profitability).toBeDefined()
      expect(result.current.formData.driverFee).toBeGreaterThanOrEqual(0)
    })

    it('should handle driver update without vehicle info', () => {
      const driverWithoutVehicle = {
        ...mockDriver,
        vehicleNumber: undefined
      } as Driver

      const { result } = renderHook(
        () => useDriverAssignment(mockRequest, mockOnSuccess),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.updateDriverSelection(driverWithoutVehicle)
      })

      expect(result.current.formData.driverId).toBe(driverWithoutVehicle.id)
      expect(result.current.selectedDriver).toEqual(driverWithoutVehicle)
    })
  })
})