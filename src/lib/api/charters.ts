import { CharterRequestResponse, CreateCharterRequestData, UpdateCharterRequestData, GetCharterRequestsQuery } from '@/lib/services/charter.service'
import { PricingInput, PricingOutput } from '@/lib/services/pricing.service'

export type CharterPaginatedResponse = {
  charterRequests: CharterRequestResponse[]
  totalCount: number
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export class ChartersAPI {
  async getCharters(params: GetCharterRequestsQuery): Promise<CharterPaginatedResponse> {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.search) searchParams.set('search', params.search)
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params.dateTo) searchParams.set('dateTo', params.dateTo)
    if (params.centerId) searchParams.set('centerId', params.centerId)
    if (params.driverId) searchParams.set('driverId', params.driverId)
    if (params.vehicleType) searchParams.set('vehicleType', params.vehicleType)
    if (params.isNegotiated !== undefined) searchParams.set('isNegotiated', params.isNegotiated.toString())
    if (params.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

    const response = await fetch(`/api/charters/requests?${searchParams}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async createCharter(data: CreateCharterRequestData): Promise<CharterRequestResponse> {
    const response = await fetch('/api/charters/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async updateCharter(id: string, data: UpdateCharterRequestData): Promise<CharterRequestResponse> {
    const response = await fetch(`/api/charters/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async deleteCharter(id: string): Promise<{ id: string; message: string }> {
    const response = await fetch(`/api/charters/requests/${id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async getCharterById(id: string): Promise<CharterRequestResponse> {
    const response = await fetch(`/api/charters/requests/${id}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  // Status operations - will need to be implemented in charter API
  async updateCharterStatus(id: string, data: {
    status: 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE'
    absenceReason?: string
    substituteDriverId?: string
    substituteFare?: number
    deductionAmount?: number
    remarks?: string
  }): Promise<CharterRequestResponse> {
    const response = await fetch(`/api/charters/requests/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async completeCharter(id: string): Promise<CharterRequestResponse> {
    const response = await fetch(`/api/charters/requests/${id}/complete`, {
      method: 'POST'
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async getChartersByDriver(driverId: string, params: { dateFrom?: string; dateTo?: string } = {}) {
    const searchParams = new URLSearchParams()
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params.dateTo) searchParams.set('dateTo', params.dateTo)

    const response = await fetch(`/api/charters/requests/driver/${driverId}?${searchParams}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async getCharterStats(params: { dateFrom?: string; dateTo?: string } = {}) {
    const searchParams = new URLSearchParams()
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params.dateTo) searchParams.set('dateTo', params.dateTo)

    const response = await fetch(`/api/charters/requests/stats?${searchParams}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async exportCharters(format: 'csv' | 'excel') {
    const response = await fetch(`/api/charters/requests/export?format=${format}`)
    
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error?.message || '내보내기에 실패했습니다')
    }
    
    // 파일 다운로드 처리
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `charters-export-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  // Quote and pricing functionality
  async getQuote(input: PricingInput): Promise<PricingOutput> {
    const response = await fetch('/api/charters/requests/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    const result = await response.json()
    
    // Handle 422 missing rates error specially
    if (response.status === 422 && result.error?.code === 'MISSING_RATES') {
      const error = new Error(result.error.message) as any
      error.code = 'MISSING_RATES'
      error.details = result.error.details
      error.partialResult = result.data // Include partial calculation result
      throw error
    }
    
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  // Center fare management
  async createCenterFare(data: {
    centerId: string
    vehicleType: string
    region: string
    fare: number
  }): Promise<any> {
    const response = await fetch('/api/center-fares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }
}

export const chartersAPI = new ChartersAPI()