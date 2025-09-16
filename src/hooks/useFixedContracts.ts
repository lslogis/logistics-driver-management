import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  FixedContractResponse,
  CreateFixedContractRequest,
  UpdateFixedContractRequest,
  GetFixedContractsQuery
} from '@/lib/validations/fixedContract'

// API 함수들
const fixedContractAPI = {
  // 고정계약 목록 조회
  getFixedContracts: async (query: GetFixedContractsQuery = {}) => {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    
    const response = await fetch(`/api/fixed-contracts?${params}`)
    const result = await response.json()
    
    if (!result.ok) {
      throw new Error(result.error?.message || '고정계약 목록 조회에 실패했습니다')
    }
    
    return result.data
  },

  // 고정계약 상세 조회
  getFixedContract: async (id: string): Promise<FixedContractResponse> => {
    const response = await fetch(`/api/fixed-contracts/${id}`)
    const result = await response.json()
    
    if (!result.ok) {
      throw new Error(result.error?.message || '고정계약 조회에 실패했습니다')
    }
    
    return result.data
  },

  // 고정계약 생성
  createFixedContract: async (data: CreateFixedContractRequest): Promise<FixedContractResponse> => {
    const response = await fetch('/api/fixed-contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (!result.ok) {
      throw new Error(result.error?.message || '고정계약 생성에 실패했습니다')
    }
    
    return result.data
  },

  // 고정계약 수정
  updateFixedContract: async (id: string, data: UpdateFixedContractRequest): Promise<FixedContractResponse> => {
    const response = await fetch(`/api/fixed-contracts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (!result.ok) {
      throw new Error(result.error?.message || '고정계약 수정에 실패했습니다')
    }
    
    return result.data
  },

  // 고정계약 삭제
  deleteFixedContract: async (id: string): Promise<void> => {
    const response = await fetch(`/api/fixed-contracts/${id}`, {
      method: 'DELETE'
    })
    
    const result = await response.json()
    
    if (!result.ok) {
      throw new Error(result.error?.message || '고정계약 삭제에 실패했습니다')
    }
  },

  // 고정계약 상태 토글
  toggleFixedContractStatus: async (id: string): Promise<FixedContractResponse> => {
    const response = await fetch(`/api/fixed-contracts/${id}/toggle`, {
      method: 'POST'
    })
    
    const result = await response.json()
    
    if (!result.ok) {
      throw new Error(result.error?.message || '고정계약 상태 변경에 실패했습니다')
    }
    
    return result.data
  },

  // 고정계약 통계 조회
  getFixedContractStats: async () => {
    const response = await fetch('/api/fixed-contracts/stats')
    const result = await response.json()
    
    if (!result.ok) {
      throw new Error(result.error?.message || '고정계약 통계 조회에 실패했습니다')
    }
    
    return result.data
  }
}

// 쿼리 키 팩토리
export const fixedContractKeys = {
  all: ['fixed-contracts'] as const,
  lists: () => [...fixedContractKeys.all, 'list'] as const,
  list: (query: GetFixedContractsQuery) => [...fixedContractKeys.lists(), query] as const,
  details: () => [...fixedContractKeys.all, 'detail'] as const,
  detail: (id: string) => [...fixedContractKeys.details(), id] as const,
  stats: () => [...fixedContractKeys.all, 'stats'] as const,
}

// 메인 훅: 고정계약 목록 조회
export function useFixedContracts(query: GetFixedContractsQuery = {}) {
  return useQuery({
    queryKey: fixedContractKeys.list(query),
    queryFn: () => fixedContractAPI.getFixedContracts(query),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
  })
}

// 고정계약 상세 조회
export function useFixedContract(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: fixedContractKeys.detail(id),
    queryFn: () => fixedContractAPI.getFixedContract(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

// 고정계약 통계 조회
export function useFixedContractStats() {
  return useQuery({
    queryKey: fixedContractKeys.stats(),
    queryFn: fixedContractAPI.getFixedContractStats,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

// 고정계약 생성 뮤테이션
export function useCreateFixedContract() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: fixedContractAPI.createFixedContract,
    onSuccess: (data) => {
      // 목록 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: fixedContractKeys.lists() })
      queryClient.invalidateQueries({ queryKey: fixedContractKeys.stats() })
      
      toast.success('고정계약이 성공적으로 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 고정계약 수정 뮤테이션
export function useUpdateFixedContract() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFixedContractRequest }) =>
      fixedContractAPI.updateFixedContract(id, data),
    onSuccess: (data, variables) => {
      // 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: fixedContractKeys.lists() })
      queryClient.invalidateQueries({ queryKey: fixedContractKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: fixedContractKeys.stats() })
      
      toast.success('고정계약이 성공적으로 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 고정계약 삭제 뮤테이션
export function useDeleteFixedContract() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: fixedContractAPI.deleteFixedContract,
    onSuccess: (_, id) => {
      // 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: fixedContractKeys.lists() })
      queryClient.invalidateQueries({ queryKey: fixedContractKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: fixedContractKeys.stats() })
      
      toast.success('고정계약이 성공적으로 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 고정계약 상태 토글 뮤테이션
export function useToggleFixedContractStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: fixedContractAPI.toggleFixedContractStatus,
    onSuccess: (data, id) => {
      // 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: fixedContractKeys.lists() })
      queryClient.invalidateQueries({ queryKey: fixedContractKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: fixedContractKeys.stats() })
      
      const statusText = data.isActive ? '활성화' : '비활성화'
      toast.success(`고정계약이 ${statusText}되었습니다`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 편의 함수들
export function useFixedContractMutations() {
  const createMutation = useCreateFixedContract()
  const updateMutation = useUpdateFixedContract()
  const deleteMutation = useDeleteFixedContract()
  const toggleMutation = useToggleFixedContractStatus()
  
  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
    toggle: toggleMutation,
    isLoading: 
      createMutation.isPending || 
      updateMutation.isPending || 
      deleteMutation.isPending || 
      toggleMutation.isPending
  }
}

// 로딩 포인트 목록 조회 (고정계약에서 사용)
export function useLoadingPointsForContracts() {
  return useQuery({
    queryKey: ['loading-points', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/loading-points?isActive=true&limit=1000')
      const result = await response.json()
      
      if (!result.ok) {
        throw new Error(result.error?.message || '상차지 목록 조회에 실패했습니다')
      }
      
      // API returns { data: { items, totalCount, ... } }
      return result.data.items || []
    },
    staleTime: 1000 * 60 * 10, // 10분
  })
}
