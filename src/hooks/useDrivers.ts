import { useState, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { DriverResponse, CreateDriverData, UpdateDriverData } from '@/lib/validations/driver'

// 기사 목록 조회 - 무한 스크롤
export function useDrivers(search?: string, status?: string, sortBy: string = 'name', sortOrder: 'asc' | 'desc' = 'asc') {
  return useInfiniteQuery({
    queryKey: ['drivers', search, status, sortBy, sortOrder],
    initialPageParam: 1,
    // 항상 활성화 - 검색어가 없으면 전체 목록 조회
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '50',
        sortBy,
        sortOrder,
        ...(search && search.trim() && { search: search.trim() }),
        ...(status && { status })
      })
      
      const response = await fetch(`/api/drivers?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch drivers')
      }
      
      return result.data
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    staleTime: 30000, // 30초 동안 fresh
    retry: 2
  })
}

// 기사 생성 뮤테이션
export function useCreateDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateDriverData) => {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create driver')
      }
      
      return result.data
    },
    onSuccess: () => {
      // 캐시 무효화로 자동 리패치 (더 효율적)
      queryClient.invalidateQueries({ 
        queryKey: ['drivers'],
        refetchType: 'active'
      })
      toast.success('기사가 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 수정 뮤테이션
export function useUpdateDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDriverData }) => {
      const response = await fetch(`/api/drivers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update driver')
      }
      
      return result.data
    },
    onSuccess: () => {
      // 캐시 무효화로 자동 리패치 (더 효율적)
      queryClient.invalidateQueries({ 
        queryKey: ['drivers'],
        refetchType: 'active'
      })
      toast.success('기사 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 활성화 뮤테이션
export function useActivateDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/drivers/${id}/activate`, {
        method: 'POST'
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to activate driver')
      }
      
      return result.data
    },
    onSuccess: () => {
      // 캐시 무효화로 자동 리패치 (더 효율적)
      queryClient.invalidateQueries({ 
        queryKey: ['drivers'],
        refetchType: 'active'
      })
      toast.success('기사가 활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 비활성화 뮤테이션 (소프트 삭제)
export function useDeactivateDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/drivers/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to deactivate driver')
      }
      
      return result.data
    },
    onSuccess: () => {
      // 캐시 무효화로 자동 리패치 (더 효율적)
      queryClient.invalidateQueries({ 
        queryKey: ['drivers'],
        refetchType: 'active'
      })
      toast.success('기사가 비활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 완전 삭제 뮤테이션
export function useHardDeleteDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/drivers/${id}?hard=true`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete driver')
      }
      
      return result.data
    },
    onSuccess: () => {
      // 캐시 무효화로 자동 리패치 (더 효율적)
      queryClient.invalidateQueries({ 
        queryKey: ['drivers'],
        refetchType: 'active'
      })
      toast.success('기사가 완전히 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 일괄 활성화 뮤테이션
export function useBulkActivateDrivers() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/drivers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'activate' })
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to activate drivers')
      }
      
      return result.data
    },
    onSuccess: (data) => {
      // 캐시 무효화로 자동 리패치 (더 효율적)
      queryClient.invalidateQueries({ 
        queryKey: ['drivers'],
        refetchType: 'active'
      })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 일괄 비활성화 뮤테이션
export function useBulkDeactivateDrivers() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/drivers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'deactivate' })
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to deactivate drivers')
      }
      
      return result.data
    },
    onSuccess: (data) => {
      // 캐시 무효화로 자동 리패치 (더 효율적)
      queryClient.invalidateQueries({ 
        queryKey: ['drivers'],
        refetchType: 'active'
      })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 일괄 완전 삭제 뮤테이션
export function useBulkDeleteDrivers() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/drivers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'delete' })
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete drivers')
      }
      
      return result.data
    },
    onSuccess: (data) => {
      // 캐시 무효화로 자동 리패치 (더 효율적)
      queryClient.invalidateQueries({ 
        queryKey: ['drivers'],
        refetchType: 'active'
      })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 내보내기 훅
export function useExportDrivers() {
  return useMutation<void, Error, 'excel' | 'csv'>({
    mutationFn: async (format: 'excel' | 'csv') => {
      const response = await fetch(`/api/drivers/export?format=${format}`)
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error?.message || 'Failed to export drivers')
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `기사목록.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    onSuccess: () => {
      toast.success('기사 목록 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`다운로드 실패: ${error.message}`)
    }
  })
}

// 기사 검색용 간단한 목록 조회
export function useDriverSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])
  
  return {
    searchTerm,
    handleSearch
  }
}

// 개별 기사 조회 훅
export function useDriver(id: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: async () => {
      if (!id) return null
      
      const response = await fetch(`/api/drivers/${id}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch driver')
      }
      
      return result.data as DriverResponse
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5분
  })
}