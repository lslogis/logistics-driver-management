import { FareType } from '@prisma/client'

export interface CenterFareDto {
  id: string
  loadingPointId: string
  centerName: string
  loadingPointName: string | null
  vehicleType: string
  region: string | null
  fareType: FareType
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

export interface CreateCenterFareDto {
  loadingPointId?: string
  centerName?: string
  vehicleType: string
  region: string | null
  fareType: 'BASIC' | 'STOP_FEE'
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
}

export interface UpdateCenterFareDto {
  loadingPointId?: string
  vehicleType?: string
  region?: string | null
  fareType?: 'BASIC' | 'STOP_FEE'
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
}

class CenterFareApiService {
  async list(filters?: {
    loadingPointId?: string
    vehicleType?: string
    fareType?: string
    search?: string
  }): Promise<CenterFareDto[]> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value))
        }
      })
    }

    if (!params.has('page')) params.set('page', '1')
    if (!params.has('limit')) params.set('limit', '500')

    const queryString = params.toString()
    const res = await fetch('/api/center-fares?' + queryString)
    if (!res.ok) {
      throw new Error('Failed to fetch center fares')
    }
    const data = await res.json()
    return data.data?.fares || []
  }

  async create(dto: CreateCenterFareDto): Promise<CenterFareDto> {
    const res = await fetch('/api/center-fares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    })

    if (res.status === 409) {
      throw new Error('DUPLICATE')
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error?.message || 'Failed to create center fare')
    }

    const data = await res.json()
    return data.data
  }

  async update(id: string, dto: UpdateCenterFareDto): Promise<CenterFareDto> {
    const res = await fetch('/api/center-fares/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error?.message || 'Failed to update center fare')
    }

    const data = await res.json()
    return data.data
  }

  async delete(id: string): Promise<void> {
    const res = await fetch('/api/center-fares/' + id, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error?.message || 'Failed to delete center fare')
    }
  }

  async import(file: File): Promise<{ imported: number, errors: string[] }> {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/center-fares/import', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error?.message || 'Failed to import center fares')
    }

    const data = await res.json()
    return data.data
  }

  async export(filters?: {
    loadingPointId?: string
    vehicleType?: string
    fareType?: string
  }): Promise<Blob> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const queryString = params.toString()
    const res = await fetch(queryString ? '/api/center-fares/export?' + queryString : '/api/center-fares/export')
    if (!res.ok) {
      throw new Error('Failed to export center fares')
    }
    return res.blob()
  }

  async calculateFare(params: {
    centerName: string
    vehicleType: string
    regions: string[]
    stopCount: number
  }): Promise<{
    baseFare?: number
    extraStopFee?: number
    extraRegionFee?: number
    total: number
  }> {
    const res = await fetch('/api/center-fares/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const message = body?.error?.message || 'Failed to calculate fare'
      const missingData = body?.error?.missingData
      const error = new Error(message) as Error & { missingData?: unknown }
      if (missingData) {
        error.missingData = missingData
      }
      throw error
    }

    const data = await res.json()
    return data.data
  }
}

export const centerFareApi = new CenterFareApiService()
