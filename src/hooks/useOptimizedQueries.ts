/**
 * 최적화된 React Query 전략 훅
 * 스마트 캐싱, 무효화, 프리페칭을 통한 성능 향상
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { Request, Driver } from '@/types'
import { requestsAPI } from '@/lib/api/requests'
import { driversAPI } from '@/lib/api/drivers'

// 쿼리 키 팩토리 - 일관된 쿼리 키 관리
export const queryKeys = {
  // 요청 관련
  requests: {
    all: ['requests'] as const,
    lists: () => [...queryKeys.requests.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.requests.lists(), filters] as const,
    details: () => [...queryKeys.requests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.requests.details(), id] as const,
    analytics: () => [...queryKeys.requests.all, 'analytics'] as const,
    export: (params: Record<string, any>) => [...queryKeys.requests.all, 'export', params] as const,
  },
  
  // 기사 관련
  drivers: {
    all: ['drivers'] as const,
    lists: () => [...queryKeys.drivers.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.drivers.lists(), filters] as const,
    details: () => [...queryKeys.drivers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.drivers.details(), id] as const,
    active: () => [...queryKeys.drivers.all, 'active'] as const,
  },
  
  // 수익성 관련
  profitability: {
    all: ['profitability'] as const,
    dashboard: (filters: Record<string, any>) => [...queryKeys.profitability.all, 'dashboard', filters] as const,
    analytics: (dateRange: string) => [...queryKeys.profitability.all, 'analytics', dateRange] as const,
  }
} as const

// 스마트 캐싱 구성
const CACHE_CONFIG = {
  // 기본 캐시 시간 (5분)
  defaultStaleTime: 5 * 60 * 1000,
  
  // 요청 데이터 (자주 변경됨)
  requests: {
    staleTime: 2 * 60 * 1000, // 2분
    cacheTime: 10 * 60 * 1000, // 10분
  },
  
  // 기사 데이터 (상대적으로 안정적)
  drivers: {
    staleTime: 10 * 60 * 1000, // 10분
    cacheTime: 30 * 60 * 1000, // 30분
  },
  
  // 분석 데이터 (계산 집약적)
  analytics: {
    staleTime: 15 * 60 * 1000, // 15분
    cacheTime: 60 * 60 * 1000, // 1시간
  }
}

/**
 * 최적화된 요청 목록 훅
 */
export function useOptimizedRequests(
  filters: Record<string, any> = {},
  options: {
    enabled?: boolean
    prefetchNext?: boolean
    backgroundRefetch?: boolean
  } = {}
) {
  const queryClient = useQueryClient()
  
  const {
    enabled = true,
    prefetchNext = true,
    backgroundRefetch = true
  } = options

  // 메모이제이션된 쿼리 키
  const queryKey = useMemo(() => 
    queryKeys.requests.list(filters), 
    [filters]
  )

  // 메인 쿼리
  const query = useQuery({
    queryKey,
    queryFn: () => requestsAPI.list(filters),
    enabled,
    staleTime: CACHE_CONFIG.requests.staleTime,
    cacheTime: CACHE_CONFIG.requests.cacheTime,
    refetchOnWindowFocus: backgroundRefetch,
    keepPreviousData: true, // 페이지네이션 시 깜빡임 방지
    select: useCallback((data: any) => ({
      ...data,
      data: data.data || []
    }), [])
  })

  // 프리페칭 로직
  const prefetchNextPage = useCallback(() => {
    if (!prefetchNext || !query.data?.hasNextPage) return

    const nextFilters = {
      ...filters,
      page: (filters.page || 1) + 1
    }

    queryClient.prefetchQuery({
      queryKey: queryKeys.requests.list(nextFilters),
      queryFn: () => requestsAPI.list(nextFilters),
      staleTime: CACHE_CONFIG.requests.staleTime
    })
  }, [queryClient, filters, prefetchNext, query.data?.hasNextPage])

  // 상세 정보 프리페칭
  const prefetchRequestDetails = useCallback((requestIds: string[]) => {
    requestIds.slice(0, 5).forEach(id => { // 최대 5개까지만
      queryClient.prefetchQuery({
        queryKey: queryKeys.requests.detail(id),
        queryFn: () => requestsAPI.get(id),
        staleTime: CACHE_CONFIG.requests.staleTime
      })
    })
  }, [queryClient])

  // 데이터가 로드되면 자동 프리페칭
  useMemo(() => {
    if (query.data?.data?.length > 0) {
      prefetchNextPage()
      
      // 첫 번째 페이지라면 상세 정보도 프리페치
      if (!filters.page || filters.page === 1) {
        const requestIds = query.data.data.slice(0, 3).map((req: Request) => req.id)
        prefetchRequestDetails(requestIds)
      }
    }
  }, [query.data, prefetchNextPage, prefetchRequestDetails, filters.page])

  return {
    ...query,
    prefetchNextPage,
    prefetchRequestDetails
  }
}

/**
 * 최적화된 요청 상세 훅
 */
export function useOptimizedRequest(
  id: string | null,
  options: {
    enabled?: boolean
    backgroundRefetch?: boolean
  } = {}
) {
  const { enabled = !!id, backgroundRefetch = true } = options

  return useQuery({
    queryKey: queryKeys.requests.detail(id!),
    queryFn: () => requestsAPI.get(id!),
    enabled: enabled && !!id,
    staleTime: CACHE_CONFIG.requests.staleTime,
    cacheTime: CACHE_CONFIG.requests.cacheTime,
    refetchOnWindowFocus: backgroundRefetch,
    retry: (failureCount, error: any) => {
      // 404 에러는 재시도하지 않음
      if (error?.status === 404) return false
      return failureCount < 2
    }
  })
}

/**
 * 최적화된 기사 목록 훅
 */
export function useOptimizedDrivers(
  filters: Record<string, any> = {},
  options: {
    enabled?: boolean
    activeOnly?: boolean
  } = {}
) {
  const { enabled = true, activeOnly = true } = options

  const queryKey = useMemo(() => 
    activeOnly 
      ? queryKeys.drivers.active()
      : queryKeys.drivers.list(filters), 
    [filters, activeOnly]
  )

  return useQuery({
    queryKey,
    queryFn: () => driversAPI.list({ ...filters, active: activeOnly }),
    enabled,
    staleTime: CACHE_CONFIG.drivers.staleTime,
    cacheTime: CACHE_CONFIG.drivers.cacheTime,
    select: useCallback((data: any) => data.data || [], [])
  })
}

/**
 * 스마트 무효화 훅
 */
export function useSmartInvalidation() {
  const queryClient = useQueryClient()

  // 요청 관련 무효화
  const invalidateRequests = useCallback((options?: {
    requestId?: string
    refetch?: boolean
    type?: 'list' | 'detail' | 'all'
  }) => {
    const { requestId, refetch = true, type = 'all' } = options || {}

    if (type === 'all' || type === 'list') {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.requests.lists(),
        refetchType: refetch ? 'active' : 'none'
      })
    }

    if (type === 'all' || type === 'detail') {
      if (requestId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.requests.detail(requestId),
          refetchType: refetch ? 'active' : 'none'
        })
      } else {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.requests.details(),
          refetchType: refetch ? 'active' : 'none'
        })
      }
    }

    // 수익성 대시보드도 무효화
    queryClient.invalidateQueries({
      queryKey: queryKeys.profitability.all,
      refetchType: refetch ? 'active' : 'none'
    })
  }, [queryClient])

  // 기사 관련 무효화
  const invalidateDrivers = useCallback((options?: {
    driverId?: string
    refetch?: boolean
  }) => {
    const { driverId, refetch = true } = options || {}

    queryClient.invalidateQueries({ 
      queryKey: queryKeys.drivers.all,
      refetchType: refetch ? 'active' : 'none'
    })

    if (driverId) {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.drivers.detail(driverId),
        refetchType: refetch ? 'active' : 'none'
      })
    }
  }, [queryClient])

  // 수익성 분석 무효화
  const invalidateProfitability = useCallback((options?: {
    refetch?: boolean
  }) => {
    const { refetch = true } = options || {}

    queryClient.invalidateQueries({
      queryKey: queryKeys.profitability.all,
      refetchType: refetch ? 'active' : 'none'
    })
  }, [queryClient])

  // 관련 데이터 업데이트 (요청 변경 시)
  const updateRequestData = useCallback((requestId: string, updater: (old: Request) => Request) => {
    // 상세 정보 업데이트
    queryClient.setQueryData(
      queryKeys.requests.detail(requestId),
      updater
    )

    // 목록에서도 업데이트
    queryClient.setQueriesData(
      { queryKey: queryKeys.requests.lists() },
      (oldData: any) => {
        if (!oldData?.data) return oldData
        
        return {
          ...oldData,
          data: oldData.data.map((request: Request) => 
            request.id === requestId ? updater(request) : request
          )
        }
      }
    )
  }, [queryClient])

  return {
    invalidateRequests,
    invalidateDrivers,
    invalidateProfitability,
    updateRequestData,
    
    // 전체 캐시 관리
    clearCache: useCallback(() => {
      queryClient.clear()
    }, [queryClient]),
    
    // 선택적 캐시 제거
    removeQuery: useCallback((queryKey: any[]) => {
      queryClient.removeQueries({ queryKey })
    }, [queryClient])
  }
}

/**
 * 뮤테이션 최적화 훅
 */
export function useOptimizedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: any, variables: TVariables) => void
    invalidateQueries?: Array<{
      queryKey: any[]
      type?: 'list' | 'detail' | 'all'
    }>
    updateQueries?: Array<{
      queryKey: any[]
      updater: (oldData: any, newData: TData, variables: TVariables) => any
    }>
  } = {}
) {
  const queryClient = useQueryClient()
  const { invalidateRequests } = useSmartInvalidation()

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Optimistic updates could be implemented here
      return { variables }
    },
    onSuccess: (data, variables, context) => {
      // 쿼리 업데이트
      options.updateQueries?.forEach(({ queryKey, updater }) => {
        queryClient.setQueryData(queryKey, (oldData: any) => 
          updater(oldData, data, variables)
        )
      })

      // 쿼리 무효화
      options.invalidateQueries?.forEach(({ queryKey, type }) => {
        queryClient.invalidateQueries({ 
          queryKey,
          refetchType: 'active'
        })
      })

      options.onSuccess?.(data, variables)
    },
    onError: options.onError
  })
}

/**
 * 백그라운드 동기화 훅
 */
export function useBackgroundSync(enabled: boolean = true) {
  const { invalidateRequests, invalidateDrivers } = useSmartInvalidation()

  useMemo(() => {
    if (!enabled) return

    // 5분마다 중요한 데이터 동기화
    const interval = setInterval(() => {
      invalidateRequests({ refetch: false }) // 백그라운드에서만 무효화
      invalidateDrivers({ refetch: false })
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [enabled, invalidateRequests, invalidateDrivers])
}

/**
 * 성능 메트릭 훅
 */
export function useQueryPerformance() {
  const queryClient = useQueryClient()

  return useMemo(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()

    const metrics = {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      staleQueries: queries.filter(q => q.isStale()).length,
      cachedQueries: queries.filter(q => q.state.data !== undefined).length,
      errorQueries: queries.filter(q => q.state.error !== null).length,
      
      // 메모리 사용량 추정 (매우 대략적)
      estimatedMemoryUsage: queries.reduce((acc, query) => {
        if (query.state.data) {
          return acc + JSON.stringify(query.state.data).length
        }
        return acc
      }, 0)
    }

    return metrics
  }, [queryClient])
}