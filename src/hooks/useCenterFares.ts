// src/hooks/useCenterFares.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import {
  getCenterFares,
  createCenterFare,
  updateCenterFare,
  deleteCenterFare,
  getFarePolicy,
  upsertFarePolicy,
  calculateFare,
  bulkUploadFares,
  exportCenterFares,
  BaseFareRow,
  CreateBaseFareDto,
  UpdateBaseFareDto,
  BaseFareQuery,
  CenterFareResponse,
  FarePolicy,
  CalculateFareInput,
  // Legacy aliases
  CreateCenterFareDto,
  UpdateCenterFareDto,
  CenterFareQuery,
} from '@/lib/api/center-fares'

// Service hooks with adapters
export const useCenterBaseFares = (params?: BaseFareQuery) => {
  return useQuery({
    queryKey: ['centerBaseFares', params],
    queryFn: () => getCenterFares(params),
    staleTime: 30000,
    select: (data) => ({
      data: data.fares,
      isLoading: false,
      error: null,
      pagination: {
        page: data.page,
        size: data.size,
        totalCount: data.totalCount,
        totalPages: data.totalPages,
      }
    })
  })
}

// Legacy hook
export const useCenterFares = (query?: CenterFareQuery) => {
  return useQuery({
    queryKey: ['centerFares', query],
    queryFn: () => getCenterFares(query),
    staleTime: 30000,
  })
}

export const useCreateBaseFare = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateBaseFareDto) => createCenterFare(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centerBaseFares'] })
      queryClient.invalidateQueries({ queryKey: ['centerFares'] })
    },
  })
}

// Legacy hook
export const useCreateCenterFare = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCenterFareDto) => createCenterFare(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centerFares'] })
      queryClient.invalidateQueries({ queryKey: ['centerBaseFares'] })
    },
  })
}

export const useUpdateBaseFare = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBaseFareDto }) =>
      updateCenterFare(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centerBaseFares'] })
      queryClient.invalidateQueries({ queryKey: ['centerFares'] })
    },
  })
}

// Legacy hook
export const useUpdateCenterFare = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCenterFareDto }) =>
      updateCenterFare(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centerFares'] })
      queryClient.invalidateQueries({ queryKey: ['centerBaseFares'] })
    },
  })
}

export const useDeleteBaseFare = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCenterFare(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centerBaseFares'] })
      queryClient.invalidateQueries({ queryKey: ['centerFares'] })
    },
  })
}

// Legacy hook
export const useDeleteCenterFare = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCenterFare(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centerFares'] })
      queryClient.invalidateQueries({ queryKey: ['centerBaseFares'] })
    },
  })
}

// Fare Policy hooks
export const useFarePolicy = (centerId?: string, vehicleTypeId?: string) => {
  return useQuery({
    queryKey: ['farePolicy', centerId, vehicleTypeId],
    queryFn: () => getFarePolicy(centerId!, vehicleTypeId!),
    enabled: !!centerId && !!vehicleTypeId,
  })
}

export const useUpsertFarePolicy = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FarePolicy) => upsertFarePolicy(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['farePolicy', variables.centerId, variables.vehicleTypeId] })
      queryClient.invalidateQueries({ queryKey: ['centerFares'] })
    },
  })
}

// Fare Calculation hook
export const useCalculateFare = () => {
  return useMutation({
    mutationFn: (data: CalculateFareInput) => calculateFare(data),
  })
}

// Bulk operations
export const useBulkUploadFares = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fares: CreateCenterFareDto[]) => bulkUploadFares(fares),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['centerFares'] }),
  })
}

export const useExportCenterFares = () => {
  return useMutation({
    mutationFn: (query?: CenterFareQuery) => exportCenterFares(query),
  })
}

// Pagination hook helper
export const useCenterFaresPaginated = () => {
  const [query, setQuery] = useState<BaseFareQuery>({
    page: 1,
    size: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const result = useCenterBaseFares(query)

  const setPage = useCallback((page: number) => {
    setQuery(prev => ({ ...prev, page }))
  }, [])

  const setSize = useCallback((size: number) => {
    setQuery(prev => ({ ...prev, size, page: 1 }))
  }, [])

  const setFilters = useCallback((filters: Partial<BaseFareQuery>) => {
    setQuery(prev => ({ ...prev, ...filters, page: 1 }))
  }, [])

  const setSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setQuery(prev => ({ ...prev, sortBy, sortOrder }))
  }, [])

  return {
    ...result,
    query,
    setPage,
    setSize,
    setFilters,
    setSort,
  }
}