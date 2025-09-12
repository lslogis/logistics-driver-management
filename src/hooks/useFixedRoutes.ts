import { useState, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  CreateFixedRouteData,
  UpdateFixedRouteData,
  FixedRouteResponse
} from '@/lib/validations/fixedRoute'

// 고정노선 목록 조회 - 무한 스크롤
export function useFixedRoutes(search?: string, status?: string) {
  return useInfiniteQuery({
    queryKey: ['fixedRoutes', search, status],
    initialPageParam: 1,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '50',
        ...(search && { search }),
        ...(status && { status })
      })
      
      const response = await fetch(`/api/fixed-routes?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch fixed routes')
      }
      
      return result.data
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage.pagination && lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    staleTime: 30000, // 30초 동안 fresh
    retry: 2
  })
}

// 고정노선 생성 뮤테이션
export function useCreateFixedRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateFixedRouteData) => {
      const response = await fetch('/api/fixed-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create fixed route')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixedRoutes'] })
      toast.success('고정노선이 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 고정노선 수정 뮤테이션
export function useUpdateFixedRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFixedRouteData }) => {
      const response = await fetch(`/api/fixed-routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update fixed route')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixedRoutes'] })
      toast.success('고정노선 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 고정노선 활성화 뮤테이션
export function useActivateFixedRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/fixed-routes/${id}/activate`, {
        method: 'POST'
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to activate fixed route')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixedRoutes'] })
      toast.success('고정노선이 활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 고정노선 비활성화 뮤테이션 (소프트 삭제)
export function useDeactivateFixedRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/fixed-routes/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to deactivate fixed route')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixedRoutes'] })
      toast.success('고정노선이 비활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 고정노선 내보내기 훅
export function useExportFixedRoutes() {
  return useMutation<void, Error, 'excel' | 'csv'>({
    mutationFn: async (format: 'excel' | 'csv') => {
      const response = await fetch(`/api/fixed-routes/export?format=${format}`)
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error?.message || 'Failed to export fixed routes')
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `고정노선목록.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    onSuccess: () => {
      toast.success('고정노선 목록 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`다운로드 실패: ${error.message}`)
    }
  })
}

// 고정노선 일괄 활성화 뮤테이션
export function useBulkActivateFixedRoutes() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/fixed-routes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'activate' })
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to activate fixed routes')
      }
      
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fixedRoutes'] })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 고정노선 일괄 비활성화 뮤테이션
export function useBulkDeactivateFixedRoutes() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/fixed-routes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'deactivate' })
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to deactivate fixed routes')
      }
      
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fixedRoutes'] })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 고정노선 일괄 하드 삭제 뮤테이션 (완전 삭제)
export function useBulkDeleteFixedRoutes() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/fixed-routes/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete fixed routes')
      }
      
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fixedRoutes'] })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}