import { SettlementsListResponse, PreviewSettlementData } from '@/lib/validations/settlement'

export interface GetSettlementsQuery {
  page?: number
  limit?: number
  search?: string
  yearMonth?: string
  driverId?: string
  status?: string
}

export interface PreviewSettlementRequest {
  driverId: string
  yearMonth: string
}

export interface FinalizeSettlementRequest {
  driverId: string
  yearMonth: string
  remarks?: string
}

export interface ExportSettlementsRequest {
  yearMonth: string
  driverIds?: string[]
}

export class SettlementsAPI {
  async getSettlements(params: GetSettlementsQuery = {}) {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.search) searchParams.set('search', params.search)
    if (params.yearMonth) searchParams.set('yearMonth', params.yearMonth)
    if (params.driverId) searchParams.set('driverId', params.driverId)
    if (params.status) searchParams.set('status', params.status)

    const response = await fetch(`/api/settlements?${searchParams}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data as SettlementsListResponse
  }

  async previewSettlement(data: PreviewSettlementRequest) {
    const response = await fetch('/api/settlements/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async finalizeSettlement(data: FinalizeSettlementRequest) {
    const response = await fetch('/api/settlements/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async exportSettlements(data: ExportSettlementsRequest) {
    const response = await fetch('/api/settlements/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    // Export는 파일 다운로드일 수 있으므로 다르게 처리
    if (response.headers.get('content-type')?.includes('application/json')) {
      const result = await response.json()
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    } else {
      // 파일 다운로드인 경우
      const blob = await response.blob()
      if (!response.ok) throw new Error('Failed to export settlements')
      return blob
    }
  }

  async createSettlement(data: { driverId: string; yearMonth: string }) {
    const response = await fetch('/api/settlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async updateSettlement(id: string, data: { remarks?: string }) {
    const response = await fetch(`/api/settlements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async deleteSettlement(id: string) {
    const response = await fetch(`/api/settlements/${id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async confirmSettlement(id: string, data: { paidAt?: string }) {
    const response = await fetch(`/api/settlements/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async markAsPaid(id: string, data: { paidAt?: string; remarks?: string }) {
    const response = await fetch(`/api/settlements/${id}/paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }
}

export const settlementsAPI = new SettlementsAPI()