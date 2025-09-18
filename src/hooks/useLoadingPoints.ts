import { useState, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

// 상차지 응답 인터페이스
export interface LoadingPointResponse {
  id: string
  centerName: string
  loadingPointName: string
  lotAddress?: string | null
  roadAddress?: string | null
  manager1?: string | null
  manager2?: string | null
  phone1?: string | null
  phone2?: string | null
  remarks?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 상차지 자동완성 인터페이스
export interface LoadingPointSuggestion {
  id: string
  centerName: string
  loadingPointName: string
}

// 상차지 생성 데이터
export interface CreateLoadingPointData {
  centerName: string
  loadingPointName: string
  lotAddress?: string
  roadAddress?: string
  manager1?: string
  manager2?: string
  phone1?: string
  phone2?: string
}

// 상차지 수정 데이터
export interface UpdateLoadingPointData extends CreateLoadingPointData {}

// 상차지 목록 조회 - 무한 스크롤
export function useLoadingPoints(search?: string, status?: string) {
  return useInfiniteQuery({
    queryKey: ['loading-points', search, status],
    initialPageParam: 1,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const params = new URLSearchParams()
      params.set('page', pageParam.toString())
      params.set('limit', '50')
      if (search) params.set('search', search)
      if (status === 'active') params.set('isActive', 'true')
      if (status === 'inactive') params.set('isActive', 'false')

      const response = await fetch('/api/loading-points?' + params.toString())
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch loading points')
      }

      const items = Array.isArray(result.data)
        ? result.data
        : result.data?.items || []

      const pagination = result.pagination || result.data?.pagination || {}
      const totalCount = pagination.total ?? result.data?.totalCount ?? items.length
      const currentPage = pagination.page ?? result.data?.currentPage ?? pageParam
      const calculatedLimit = pagination.limit ?? 50
      const pageCount =
        pagination.totalPages ??
        result.data?.pageCount ??
        (pagination.total
          ? Math.ceil(pagination.total / calculatedLimit)
          : currentPage)

      return {
        items,
        data: items,
        totalCount,
        currentPage,
        pageCount,
        pagination
      }
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.currentPage && lastPage?.pageCount) {
        if (lastPage.currentPage < lastPage.pageCount) {
          return lastPage.currentPage + 1
        }
      }
      return undefined
    },
    staleTime: 30000, // 30초 동안 fresh
    retry: 2
  })
}

// 상차지 자동완성 목록 조회
export function useLoadingPointSuggestions(search?: string) {
  return useQuery({
    queryKey: ['loading-points', 'suggestions', search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('query', search)
      
      const response = await fetch(`/api/loading-points/suggestions?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch loading point suggestions')
      }
      
      return result.data as LoadingPointSuggestion[]
    },
    enabled: search !== undefined,
    staleTime: 60000, // 1분 동안 fresh
    retry: 1
  })
}

// 상차지 생성 뮤테이션
export function useCreateLoadingPoint() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateLoadingPointData) => {
      const response = await fetch('/api/loading-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create loading point')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loading-points'] })
      toast.success('상차지가 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 상차지 수정 뮤테이션
export function useUpdateLoadingPoint() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLoadingPointData }) => {
      const response = await fetch(`/api/loading-points/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update loading point')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loading-points'] })
      toast.success('상차지 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 상차지 활성화 뮤테이션
export function useActivateLoadingPoint() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/loading-points/${id}/activate`, {
        method: 'POST'
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to activate loading point')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loading-points'] })
      toast.success('상차지가 활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 상차지 비활성화 뮤테이션 (소프트 삭제)
export function useDeactivateLoadingPoint() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/loading-points/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to deactivate loading point')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loading-points'] })
      toast.success('상차지가 비활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 상차지 완전 삭제 뮤테이션
export function useHardDeleteLoadingPoint() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/loading-points/${id}?hard=true`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete loading point')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loading-points'] })
      toast.success('상차지가 완전히 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 상차지 일괄 활성화 뮤테이션
export function useBulkActivateLoadingPoints() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/loading-points/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'activate' })
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to activate loading points')
      }
      
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loading-points'] })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 상차지 일괄 비활성화 뮤테이션
export function useBulkDeactivateLoadingPoints() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/loading-points/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'deactivate' })
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to deactivate loading points')
      }
      
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loading-points'] })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 상차지 일괄 완전 삭제 뮤테이션
export function useBulkDeleteLoadingPoints() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/loading-points/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'delete' })
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete loading points')
      }
      
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loading-points'] })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 상차지 내보내기 훅
export function useExportLoadingPoints() {
  return useMutation<void, Error, 'excel' | 'csv'>({
    mutationFn: async (format: 'excel' | 'csv') => {
      const response = await fetch(`/api/loading-points/export?format=${format}`)
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error?.message || 'Failed to export loading points')
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `상차지목록.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    onSuccess: () => {
      toast.success('상차지 목록 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`다운로드 실패: ${error.message}`)
    }
  })
}

// 상차지 콤보박스용 검색 훅
export function useLoadingPointSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  
  const { data: suggestions, isLoading } = useLoadingPointSuggestions(searchTerm)
  
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])
  
  const handleSelect = useCallback((loadingPoint: LoadingPointSuggestion) => {
    setSearchTerm('')
    setIsOpen(false)
  }, [])
  
  const handleOpen = useCallback(() => {
    setIsOpen(true)
  }, [])
  
  const handleClose = useCallback(() => {
    setIsOpen(false)
    setSearchTerm('')
  }, [])
  
  return {
    searchTerm,
    suggestions: suggestions || [],
    isLoading,
    isOpen,
    handleSearch,
    handleSelect,
    handleOpen,
    handleClose
  }
}