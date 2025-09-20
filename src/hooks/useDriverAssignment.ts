/**
 * 기사 배정 데이터 동기화 훅 - 단일 소스 오브 트루스
 * 모든 컴포넌트에서 일관된 기사 배정 상태를 관리하기 위한 중앙화된 훅
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Driver, Request } from '@/types'
import { driversAPI } from '@/lib/api/drivers'
import { requestsAPI } from '@/lib/api/requests'
import { calculateProfitability, calculateRecommendedDriverFee } from '@/lib/services/profitability.service'
import { toast } from 'react-hot-toast'

interface DriverAssignmentState {
  selectedDriverId: string | null
  selectedDriver: Driver | null
  driverName: string
  driverPhone: string
  driverVehicle: string
  driverFee: number
  driverNotes: string
  deliveryTime: string
  isSubmitting: boolean
  isValidating: boolean
}

interface UseDriverAssignmentReturn {
  // State
  state: DriverAssignmentState
  
  // Available drivers data
  drivers: Driver[]
  isLoadingDrivers: boolean
  driversError: Error | null
  
  // Current request profitability
  profitability: ReturnType<typeof calculateProfitability> | null
  recommendedFee: number
  
  // Actions
  selectDriver: (driverId: string | null) => void
  updateDriverInfo: (field: keyof DriverAssignmentState, value: string | number) => void
  resetForm: () => void
  validateAssignment: () => boolean
  submitAssignment: (requestId: string) => Promise<void>
  
  // Quick actions
  autoFillFromDriver: (driver: Driver) => void
  calculateOptimalFee: (centerBilling: number, targetMargin?: number) => void
  
  // Utilities
  getValidationErrors: () => string[]
  hasUnsavedChanges: (original?: Request) => boolean
}

export function useDriverAssignment(
  request?: Request | null,
  onSuccess?: (updatedRequest: Request) => void
): UseDriverAssignmentReturn {
  const queryClient = useQueryClient()

  // Initial state setup
  const [state, setState] = useState<DriverAssignmentState>(() => ({
    selectedDriverId: request?.driverId || null,
    selectedDriver: request?.driver || null,
    driverName: request?.driverName || '',
    driverPhone: request?.driverPhone || '',
    driverVehicle: request?.driverVehicle || '',
    driverFee: request?.driverFee || 0,
    driverNotes: request?.driverNotes || '',
    deliveryTime: request?.deliveryTime || '',
    isSubmitting: false,
    isValidating: false
  }))

  // Fetch available drivers
  const {
    data: drivers = [],
    isLoading: isLoadingDrivers,
    error: driversError
  } = useQuery({
    queryKey: ['drivers', 'active'],
    queryFn: () => driversAPI.list({ active: true }),
    select: (response) => response.data || []
  })

  // Calculate profitability based on current state
  const profitability = request ? calculateProfitability({
    ...request,
    driverFee: state.driverFee
  }) : null

  // Calculate recommended fee
  const recommendedFee = request ? calculateRecommendedDriverFee(request) : 0

  // Update assignment mutation
  const assignmentMutation = useMutation({
    mutationFn: async (data: { requestId: string; assignmentData: Partial<Request> }) => {
      return requestsAPI.update(data.requestId, data.assignmentData)
    },
    onMutate: () => {
      setState(prev => ({ ...prev, isSubmitting: true }))
    },
    onSuccess: (updatedRequest) => {
      toast.success('기사 배정이 완료되었습니다')
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: ['request', updatedRequest.id] })
      
      // Call success callback
      onSuccess?.(updatedRequest)
      
      setState(prev => ({ ...prev, isSubmitting: false }))
    },
    onError: (error) => {
      console.error('Driver assignment failed:', error)
      toast.error('기사 배정에 실패했습니다')
      setState(prev => ({ ...prev, isSubmitting: false }))
    }
  })

  // Actions
  const selectDriver = (driverId: string | null) => {
    const driver = driverId ? drivers.find(d => d.id === driverId) : null
    
    setState(prev => ({
      ...prev,
      selectedDriverId: driverId,
      selectedDriver: driver
    }))

    // Auto-fill driver information if available
    if (driver) {
      autoFillFromDriver(driver)
    }
  }

  const updateDriverInfo = (field: keyof DriverAssignmentState, value: string | number) => {
    setState(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setState({
      selectedDriverId: request?.driverId || null,
      selectedDriver: request?.driver || null,
      driverName: request?.driverName || '',
      driverPhone: request?.driverPhone || '',
      driverVehicle: request?.driverVehicle || '',
      driverFee: request?.driverFee || 0,
      driverNotes: request?.driverNotes || '',
      deliveryTime: request?.deliveryTime || '',
      isSubmitting: false,
      isValidating: false
    })
  }

  const autoFillFromDriver = (driver: Driver) => {
    setState(prev => ({
      ...prev,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverVehicle: driver.vehicleInfo || `${driver.vehicleType || ''} ${driver.vehicleNumber || ''}`.trim(),
      selectedDriver: driver
    }))
  }

  const calculateOptimalFee = (centerBilling: number, targetMargin: number = 25) => {
    const optimalFee = Math.round((centerBilling * (1 - targetMargin / 100)) / 1000) * 1000
    setState(prev => ({ ...prev, driverFee: optimalFee }))
  }

  const validateAssignment = (): boolean => {
    setState(prev => ({ ...prev, isValidating: true }))
    
    const errors = getValidationErrors()
    const isValid = errors.length === 0
    
    if (!isValid) {
      toast.error(`배정 정보를 확인해주세요: ${errors[0]}`)
    }
    
    setState(prev => ({ ...prev, isValidating: false }))
    return isValid
  }

  const getValidationErrors = (): string[] => {
    const errors: string[] = []
    
    if (!state.driverName.trim()) {
      errors.push('기사명은 필수입니다')
    }
    
    if (!state.driverPhone.trim()) {
      errors.push('기사 연락처는 필수입니다')
    }
    
    if (state.driverFee <= 0) {
      errors.push('기사 운임은 0보다 커야 합니다')
    }
    
    // Phone number format validation
    const phoneRegex = /^01[0-9]-?\d{4}-?\d{4}$/
    if (state.driverPhone && !phoneRegex.test(state.driverPhone.replace(/-/g, ''))) {
      errors.push('올바른 휴대폰 번호 형식이 아닙니다')
    }
    
    return errors
  }

  const hasUnsavedChanges = (original?: Request): boolean => {
    if (!original) return false
    
    return (
      state.selectedDriverId !== (original.driverId || null) ||
      state.driverName !== (original.driverName || '') ||
      state.driverPhone !== (original.driverPhone || '') ||
      state.driverVehicle !== (original.driverVehicle || '') ||
      state.driverFee !== (original.driverFee || 0) ||
      state.driverNotes !== (original.driverNotes || '') ||
      state.deliveryTime !== (original.deliveryTime || '')
    )
  }

  const submitAssignment = async (requestId: string): Promise<void> => {
    if (!validateAssignment()) {
      return
    }
    
    const assignmentData = {
      driverId: state.selectedDriverId,
      driverName: state.driverName,
      driverPhone: state.driverPhone,
      driverVehicle: state.driverVehicle,
      driverFee: state.driverFee,
      driverNotes: state.driverNotes,
      deliveryTime: state.deliveryTime,
      dispatchedAt: new Date().toISOString()
    }
    
    await assignmentMutation.mutateAsync({ requestId, assignmentData })
  }

  return {
    // State
    state,
    
    // Data
    drivers,
    isLoadingDrivers,
    driversError,
    
    // Profitability
    profitability,
    recommendedFee,
    
    // Actions
    selectDriver,
    updateDriverInfo,
    resetForm,
    validateAssignment,
    submitAssignment,
    
    // Quick actions
    autoFillFromDriver,
    calculateOptimalFee,
    
    // Utilities
    getValidationErrors,
    hasUnsavedChanges
  }
}

/**
 * 기사 선택을 위한 간단한 훅 (검색 및 필터링)
 */
export function useDriverSelection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string | null>(null)
  const [availableOnly, setAvailableOnly] = useState(true)

  const {
    data: drivers = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['drivers', 'selection', { searchQuery, vehicleTypeFilter, availableOnly }],
    queryFn: () => driversAPI.list({
      search: searchQuery,
      vehicleType: vehicleTypeFilter,
      available: availableOnly
    }),
    select: (response) => response.data || []
  })

  return {
    drivers,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    vehicleTypeFilter,
    setVehicleTypeFilter,
    availableOnly,
    setAvailableOnly
  }
}

/**
 * 기사 배정 히스토리를 위한 훅
 */
export function useDriverAssignmentHistory(requestId: string) {
  return useQuery({
    queryKey: ['request', requestId, 'assignment-history'],
    queryFn: async () => {
      const request = await requestsAPI.get(requestId)
      
      // 배정 히스토리 구성 (dispatchedAt 기준)
      const history = []
      
      if (request.dispatchedAt && request.driverName) {
        history.push({
          timestamp: request.dispatchedAt,
          driverName: request.driverName,
          driverPhone: request.driverPhone,
          driverFee: request.driverFee,
          action: 'assigned'
        })
      }
      
      return history
    },
    enabled: !!requestId
  })
}