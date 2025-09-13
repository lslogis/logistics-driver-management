import { TripResponse, CreateTripData, UpdateTripData, GetTripsQuery } from '@/lib/validations/trip'

export class TripsAPI {
  async getTrips(params: GetTripsQuery) {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.search) searchParams.set('search', params.search)
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params.dateTo) searchParams.set('dateTo', params.dateTo)
    if (params.status) searchParams.set('status', params.status)
    if (params.driverId) searchParams.set('driverId', params.driverId)
    if (params.vehicleId) searchParams.set('vehicleId', params.vehicleId)
    if (params.routeTemplateId) searchParams.set('routeTemplateId', params.routeTemplateId)
    if (params.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

    const response = await fetch(`/api/trips?${searchParams}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async createTrip(data: CreateTripData) {
    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async updateTrip(id: string, data: UpdateTripData) {
    const response = await fetch(`/api/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async deleteTrip(id: string) {
    const response = await fetch(`/api/trips/${id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async updateTripStatus(id: string, data: {
    status: 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE'
    absenceReason?: string
    substituteDriverId?: string
    substituteFare?: number
    deductionAmount?: number
    remarks?: string
  }) {
    const response = await fetch(`/api/trips/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async completeTrip(id: string) {
    const response = await fetch(`/api/trips/${id}/complete`, {
      method: 'POST'
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async getTripsByDriver(driverId: string, params: { dateFrom?: string; dateTo?: string } = {}) {
    const searchParams = new URLSearchParams()
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params.dateTo) searchParams.set('dateTo', params.dateTo)

    const response = await fetch(`/api/trips/driver/${driverId}?${searchParams}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async getTripStats(params: { dateFrom?: string; dateTo?: string } = {}) {
    const searchParams = new URLSearchParams()
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params.dateTo) searchParams.set('dateTo', params.dateTo)

    const response = await fetch(`/api/trips/stats?${searchParams}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async exportTrips(format: 'csv' | 'excel') {
    const response = await fetch(`/api/trips/export?format=${format}`)
    
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error?.message || '내보내기에 실패했습니다')
    }
    
    // 파일 다운로드 처리
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trips-export-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
}

export const tripsAPI = new TripsAPI()