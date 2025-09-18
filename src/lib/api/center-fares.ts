import { api } from './client'

export interface CenterFareRow {
  id: string
  loadingPointId: string
  centerName: string
  loadingPointName: string | null
  vehicleType: string
  region: string | null
  fareType: 'BASIC' | 'STOP_FEE'
  baseFare?: number | null
  extraStopFee?: number | null
  extraRegionFee?: number | null
  createdAt: string
  loadingPoint?: {
    id: string
    name: string | null
    centerName: string | null
    loadingPointName: string | null
    isActive: boolean
  } | null
}

export interface CenterFareQuery {
  page?: number
  limit?: number
  loadingPointId?: string
  vehicleType?: string
  region?: string
  fareType?: 'BASIC' | 'STOP_FEE'
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CenterFareListResponse {
  fares: CenterFareRow[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export const getCenterFares = async (query?: CenterFareQuery): Promise<CenterFareListResponse> => {
  const params = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
  }

  const queryString = params.toString()
  const url = queryString ? '/api/center-fares?' + queryString : '/api/center-fares'
  const res = await api.get(url)
  const data = res.data || res
  return data.data || data
}

export const createCenterFare = async (payload: {
  loadingPointId: string
  vehicleType: string
  region: string | null
  fareType: 'BASIC' | 'STOP_FEE'
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
}) => {
  const res = await api.post('/api/center-fares', payload)
  return res.data || res
}

export const updateCenterFare = async (id: string, payload: {
  loadingPointId?: string
  vehicleType?: string
  region?: string | null
  fareType?: 'BASIC' | 'STOP_FEE'
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
}) => {
  const res = await api.patch('/api/center-fares/' + id, payload)
  return res.data || res
}

export const deleteCenterFare = async (id: string) => {
  const res = await api.delete('/api/center-fares/' + id)
  return res.data || res
}

export const exportCenterFares = async (query?: CenterFareQuery) => {
  const params = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
  }
  const queryString = params.toString()
  const url = queryString ? '/api/center-fares/export?' + queryString : '/api/center-fares/export'
  return api.getBlob(url)
}

// Additional types for compatibility
export type BaseFareRow = CenterFareRow
export type CreateBaseFareDto = {
  loadingPointId: string
  vehicleType: string
  region: string | null
  fareType: 'BASIC' | 'STOP_FEE'
  baseFare?: number | null
  extraStopFee?: number | null
  extraRegionFee?: number | null
}
export type UpdateBaseFareDto = Partial<CreateBaseFareDto>
export type BaseFareQuery = CenterFareQuery
export type CenterFareResponse = CenterFareRow

// Legacy aliases
export type CreateCenterFareDto = CreateBaseFareDto
export type UpdateCenterFareDto = UpdateBaseFareDto

export interface FarePolicy {
  id?: string
  loadingPointId: string
  vehicleType: string
  baseFare: number
  extraStopFee: number
  extraRegionFee: number
}

export interface CalculateFareInput {
  centerName: string
  vehicleType: string
  regions: string[]
  stops: number
}

export interface CalculateFareResult {
  baseFare: number
  extraStopFare: number
  extraRegionFare: number
  totalFare: number
}

// Placeholder functions for missing exports
export const getFarePolicy = async (loadingPointId: string, vehicleType: string): Promise<FarePolicy | null> => {
  const res = await api.get(`/api/center-fares/policy?loadingPointId=${loadingPointId}&vehicleType=${vehicleType}`)
  return res.data
}

export const upsertFarePolicy = async (policy: FarePolicy): Promise<FarePolicy> => {
  const res = await api.post('/api/center-fares/policy', policy)
  return res.data
}

export const calculateFare = async (input: CalculateFareInput): Promise<CalculateFareResult> => {
  const res = await api.post('/api/center-fares/calculate', input)
  return res.data
}

export const bulkUploadFares = async (file: File): Promise<{ success: number; errors: string[] }> => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/api/center-fares/import', formData)
  return res.data
}
