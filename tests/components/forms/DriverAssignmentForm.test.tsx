/**
 * 기사 배정 폼 컴포넌트 테스트
 * UI 상호작용 및 통합 기능 검증
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DriverAssignmentForm } from '@/components/forms/DriverAssignmentForm'
import { Request, Driver } from '@/types'

// Mock hooks and APIs
vi.mock('@/hooks/useDriverAssignment', () => ({
  useDriverAssignment: vi.fn()
}))

vi.mock('@/hooks/useDrivers', () => ({
  useDrivers: vi.fn()
}))

const mockDriverAssignmentHook = {
  formData: {
    driverId: '',
    driverFee: 225000,
    deliveryTime: '',
    driverNotes: ''
  },
  selectedDriver: null,
  profitability: {
    centerBilling: 300000,
    driverFee: 225000,
    margin: 75000,
    marginRate: 25.0,
    status: 'good',
    statusLabel: '양호',
    statusColor: 'text-blue-600'
  },
  validationErrors: {},
  isLoading: false,
  canSubmit: false,
  updateDriverSelection: vi.fn(),
  updateDriverFee: vi.fn(),
  updateField: vi.fn(),
  handleSubmit: vi.fn(),
  resetForm: vi.fn()
}

const mockDriversHook = {
  data: [
    {
      id: 'driver-1',
      name: '김기사',
      phone: '010-1234-5678',
      vehicleNumber: '12가3456',
      vehicleTon: 3.5,
      isActive: true
    },
    {
      id: 'driver-2',
      name: '이기사',
      phone: '010-2345-6789',
      vehicleNumber: '34나5678',
      vehicleTon: 5.0,
      isActive: true
    }
  ] as Driver[],
  isLoading: false,
  error: null
}

// Test wrapper
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

describe('DriverAssignmentForm Component', () => {
  let mockRequest: Request
  let mockOnSuccess: vi.Mock
  let mockOnCancel: vi.Mock
  
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
      centerBillingTotal: 300000,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Request

    mockOnSuccess = vi.fn()
    mockOnCancel = vi.fn()

    // Setup default mock returns
    const { useDriverAssignment } = require('@/hooks/useDriverAssignment')
    const { useDrivers } = require('@/hooks/useDrivers')
    
    useDriverAssignment.mockReturnValue(mockDriverAssignmentHook)
    useDrivers.mockReturnValue(mockDriversHook)
  })

  describe('기본 렌더링', () => {
    it('should render form with all required fields', () => {
      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      // Check form title
      expect(screen.getByText('기사 배정')).toBeInTheDocument()

      // Check driver selection
      expect(screen.getByText('기사 선택')).toBeInTheDocument()
      expect(screen.getByText('기사를 선택해주세요')).toBeInTheDocument()

      // Check driver fee
      expect(screen.getByLabelText('기사 운임')).toBeInTheDocument()
      expect(screen.getByDisplayValue('225,000')).toBeInTheDocument()

      // Check delivery time
      expect(screen.getByLabelText('배송 시간')).toBeInTheDocument()

      // Check notes
      expect(screen.getByLabelText('기사 메모')).toBeInTheDocument()

      // Check buttons
      expect(screen.getByText('배정하기')).toBeInTheDocument()
      expect(screen.getByText('취소')).toBeInTheDocument()
    })

    it('should show profitability analysis', () => {
      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      // Check profitability section
      expect(screen.getByText('수익성 분석')).toBeInTheDocument()
      expect(screen.getByText('센터 청구')).toBeInTheDocument()
      expect(screen.getByText('300,000원')).toBeInTheDocument()
      expect(screen.getByText('기사 운임')).toBeInTheDocument()
      expect(screen.getByText('225,000원')).toBeInTheDocument()
      expect(screen.getByText('마진')).toBeInTheDocument()
      expect(screen.getByText('75,000원')).toBeInTheDocument()
      expect(screen.getByText('마진율')).toBeInTheDocument()
      expect(screen.getByText('25.0%')).toBeInTheDocument()
      expect(screen.getByText('양호')).toBeInTheDocument()
    })

    it('should disable submit button when form is invalid', () => {
      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      const submitButton = screen.getByText('배정하기')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('기사 선택', () => {
    it('should show driver selection dialog when clicked', async () => {
      const user = userEvent.setup()

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      const selectButton = screen.getByText('기사를 선택해주세요')
      await user.click(selectButton)

      // Check if dialog opened (based on available drivers)
      expect(screen.getByText('김기사')).toBeInTheDocument()
      expect(screen.getByText('이기사')).toBeInTheDocument()
    })

    it('should call updateDriverSelection when driver is selected', async () => {
      const user = userEvent.setup()

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      const selectButton = screen.getByText('기사를 선택해주세요')
      await user.click(selectButton)

      const driverOption = screen.getByText('김기사')
      await user.click(driverOption)

      expect(mockDriverAssignmentHook.updateDriverSelection).toHaveBeenCalledWith(
        mockDriversHook.data[0]
      )
    })

    it('should show selected driver info', () => {
      // Mock selected driver state
      const selectedDriverHook = {
        ...mockDriverAssignmentHook,
        formData: {
          ...mockDriverAssignmentHook.formData,
          driverId: 'driver-1'
        },
        selectedDriver: mockDriversHook.data[0],
        canSubmit: true
      }

      const { useDriverAssignment } = require('@/hooks/useDriverAssignment')
      useDriverAssignment.mockReturnValue(selectedDriverHook)

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('김기사')).toBeInTheDocument()
      expect(screen.getByText('010-1234-5678')).toBeInTheDocument()
      expect(screen.getByText('12가3456')).toBeInTheDocument()
      expect(screen.getByText('3.5톤')).toBeInTheDocument()
    })
  })

  describe('기사 운임 입력', () => {
    it('should call updateDriverFee when fee is changed', async () => {
      const user = userEvent.setup()

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      const feeInput = screen.getByLabelText('기사 운임')
      await user.clear(feeInput)
      await user.type(feeInput, '250000')

      expect(mockDriverAssignmentHook.updateDriverFee).toHaveBeenCalledWith(250000)
    })

    it('should show validation error for invalid fee', () => {
      const errorHook = {
        ...mockDriverAssignmentHook,
        validationErrors: {
          driverFee: '기사 운임은 0원 이상이어야 합니다'
        }
      }

      const { useDriverAssignment } = require('@/hooks/useDriverAssignment')
      useDriverAssignment.mockReturnValue(errorHook)

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('기사 운임은 0원 이상이어야 합니다')).toBeInTheDocument()
    })

    it('should format fee input with commas', async () => {
      const user = userEvent.setup()

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      const feeInput = screen.getByLabelText('기사 운임')
      expect(feeInput).toHaveValue('225,000')
    })
  })

  describe('배송 시간 입력', () => {
    it('should call updateField when delivery time is changed', async () => {
      const user = userEvent.setup()

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      const timeInput = screen.getByLabelText('배송 시간')
      await user.type(timeInput, '09:30')

      expect(mockDriverAssignmentHook.updateField).toHaveBeenCalledWith('deliveryTime', '09:30')
    })

    it('should show validation error for invalid time', () => {
      const errorHook = {
        ...mockDriverAssignmentHook,
        validationErrors: {
          deliveryTime: '올바른 시간 형식을 입력해주세요 (예: 09:30)'
        }
      }

      const { useDriverAssignment } = require('@/hooks/useDriverAssignment')
      useDriverAssignment.mockReturnValue(errorHook)

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('올바른 시간 형식을 입력해주세요 (예: 09:30)')).toBeInTheDocument()
    })
  })

  describe('메모 입력', () => {
    it('should call updateField when notes are changed', async () => {
      const user = userEvent.setup()

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      const notesTextarea = screen.getByLabelText('기사 메모')
      await user.type(notesTextarea, '배송 시 주의사항')

      expect(mockDriverAssignmentHook.updateField).toHaveBeenCalledWith('driverNotes', '배송 시 주의사항')
    })
  })

  describe('폼 제출', () => {
    it('should call handleSubmit when form is submitted', async () => {
      const user = userEvent.setup()
      
      // Mock valid form state
      const validHook = {
        ...mockDriverAssignmentHook,
        canSubmit: true
      }

      const { useDriverAssignment } = require('@/hooks/useDriverAssignment')
      useDriverAssignment.mockReturnValue(validHook)

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      const submitButton = screen.getByText('배정하기')
      await user.click(submitButton)

      expect(mockDriverAssignmentHook.handleSubmit).toHaveBeenCalled()
    })

    it('should show loading state during submission', () => {
      const loadingHook = {
        ...mockDriverAssignmentHook,
        isLoading: true,
        canSubmit: true
      }

      const { useDriverAssignment } = require('@/hooks/useDriverAssignment')
      useDriverAssignment.mockReturnValue(loadingHook)

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      const submitButton = screen.getByText('배정 중...')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('폼 취소', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      const cancelButton = screen.getByText('취소')
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should call resetForm when reset button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      // Find reset button (usually a small button near form fields)
      const resetButton = screen.getByRole('button', { name: /초기화|리셋/i })
      await user.click(resetButton)

      expect(mockDriverAssignmentHook.resetForm).toHaveBeenCalled()
    })
  })

  describe('수익성 업데이트', () => {
    it('should update profitability when driver fee changes', () => {
      const updatedHook = {
        ...mockDriverAssignmentHook,
        formData: {
          ...mockDriverAssignmentHook.formData,
          driverFee: 280000
        },
        profitability: {
          centerBilling: 300000,
          driverFee: 280000,
          margin: 20000,
          marginRate: 6.67,
          status: 'poor',
          statusLabel: '주의',
          statusColor: 'text-orange-600'
        }
      }

      const { useDriverAssignment } = require('@/hooks/useDriverAssignment')
      useDriverAssignment.mockReturnValue(updatedHook)

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('280,000원')).toBeInTheDocument()
      expect(screen.getByText('20,000원')).toBeInTheDocument()
      expect(screen.getByText('6.7%')).toBeInTheDocument()
      expect(screen.getByText('주의')).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('should have proper ARIA labels', () => {
      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByLabelText('기사 운임')).toBeInTheDocument()
      expect(screen.getByLabelText('배송 시간')).toBeInTheDocument()
      expect(screen.getByLabelText('기사 메모')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      // Tab through form elements
      await user.tab()
      expect(screen.getByText('기사를 선택해주세요')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('기사 운임')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('배송 시간')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('기사 메모')).toHaveFocus()
    })
  })

  describe('에러 처리', () => {
    it('should handle driver loading error', () => {
      const errorDriversHook = {
        ...mockDriversHook,
        isLoading: false,
        error: new Error('Failed to load drivers'),
        data: []
      }

      const { useDrivers } = require('@/hooks/useDrivers')
      useDrivers.mockReturnValue(errorDriversHook)

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('기사 목록을 불러올 수 없습니다')).toBeInTheDocument()
    })

    it('should handle empty driver list', () => {
      const emptyDriversHook = {
        ...mockDriversHook,
        data: []
      }

      const { useDrivers } = require('@/hooks/useDrivers')
      useDrivers.mockReturnValue(emptyDriversHook)

      render(
        <DriverAssignmentForm
          request={mockRequest}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('등록된 기사가 없습니다')).toBeInTheDocument()
    })
  })
})