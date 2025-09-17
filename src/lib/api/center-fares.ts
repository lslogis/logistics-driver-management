// src/lib/api/center-fares.ts
import { api } from './client'

// Core Types (matching backend service)
export interface BaseFareRow {
  id: string
  centerId: string
  centerName: string
  vehicleTypeId: string
  vehicleTypeName: string
  regionId: string
  regionName: string
  baseFare: number
  status: 'active' | 'inactive'
  createdAt: string
}

// Legacy alias for backward compatibility
export type CenterFare = BaseFareRow

export interface CreateBaseFareDto {
  centerId: string
  vehicleTypeId: string
  regionId: string
  baseFare: number
  status?: 'active' | 'inactive'
}

export interface UpdateBaseFareDto extends Partial<CreateBaseFareDto> {
  status?: 'active' | 'inactive'
}

// Legacy aliases
export type CreateCenterFareDto = CreateBaseFareDto
export type UpdateCenterFareDto = UpdateBaseFareDto

export interface BaseFareQuery {
  page?: number
  size?: number
  centerId?: string
  vehicleTypeId?: string
  regionId?: string
  status?: 'active' | 'inactive'
  q?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface BaseFareResponse {
  data: BaseFareRow[]
  totalCount: number
  page: number
  size: number
  totalPages: number
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Legacy aliases
export type CenterFareQuery = BaseFareQuery
export type CenterFareResponse = {
  fares: BaseFareRow[]
  totalCount: number
  page: number
  size: number
  totalPages: number
}

export interface FarePolicy {
  centerId: string
  vehicleTypeId: string
  extraRegionFee: number
  extraStopFee: number
  maxStops?: number | null
}

export interface CalculateFareInput {
  centerId: string
  vehicleTypeId: string
  legs: Array<{ regionId: string; stops: number }>
}

export interface CalculateFareResult {
  baseFare: number
  extraRegionTotal: number
  extraStopTotal: number
  total: number
}

// Adapter functions for service integration
export const getCenterFares = async (query?: BaseFareQuery): Promise<CenterFareResponse> => {
  const params = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
  }
  const res = await api.get(`/api/center-fares?${params}`)
  const data = res.data || res
  
  // Adapter: Convert backend response to frontend format
  if (data.fares || data.data) {
    return {
      fares: data.fares || data.data,
      totalCount: data.totalCount || data.pagination?.totalCount || 0,
      page: data.page || data.pagination?.page || 1,
      size: data.size || data.pagination?.limit || 10,
      totalPages: data.totalPages || data.pagination?.totalPages || 1,
    }
  }
  
  return data
}

export const createCenterFare = async (data: CreateBaseFareDto) => {
  const res = await api.post('/api/center-fares', data)
  return res.data || res
}

export const updateCenterFare = async (id: string, data: UpdateBaseFareDto) => {
  const res = await api.put(`/api/center-fares/${id}`, data)
  return res.data || res
}

// Service aliases
export const createBaseFare = createCenterFare
export const updateBaseFare = updateCenterFare

export const deleteCenterFare = async (id: string) => {
  await api.delete(`/api/center-fares/${id}`)
}

// Service alias
export const deleteBaseFare = deleteCenterFare

// Fare Policy APIs
export const getFarePolicy = async (centerId: string, vehicleTypeId: string): Promise<FarePolicy | null> => {
  const res = await api.get(`/api/center-fares/policy?centerId=${centerId}&vehicleTypeId=${vehicleTypeId}`)
  return res.data || res
}

export const upsertFarePolicy = async (data: FarePolicy) => {
  const res = await api.post('/api/center-fares/policy', data)
  return res.data || res
}

// Fare Calculation API
export const calculateFare = async (data: CalculateFareInput): Promise<CalculateFareResult> => {
  const res = await api.post('/api/center-fares/calculate', data)
  return res.data || res
}

// Bulk Operations
export const bulkUploadFares = async (fares: CreateCenterFareDto[]) => {
  const res = await api.post('/api/center-fares/bulk', { fares })
  return res.data || res
}

export const exportCenterFares = async (query?: CenterFareQuery): Promise<Blob> => {
  const params = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
  }
  
  const response = await fetch(`/api/center-fares/export?${params}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  })
  
  if (!response.ok) {
    throw new Error('엑셀 내보내기 실패')
  }
  
  return response.blob()
}

// Template download for bulk upload
export const downloadCenterFareTemplate = async (): Promise<Blob> => {
  const response = await fetch('/api/center-fares/template', {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  })
  
  if (!response.ok) {
    throw new Error('템플릿 다운로드 실패')
  }
  
  return response.blob()
}

// Enhanced bulk upload with validation
export interface BulkUploadResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    error: string
    data?: any
  }>
}