import { FareType } from '@prisma/client'

export interface CenterFareDto {
  id: string
  centerName: string
  vehicleType: string
  region: string | null
  fareType: FareType
  baseFare?: number | null
  extraStopFee?: number | null
  extraRegionFee?: number | null
  createdAt: string
}

export interface CreateCenterFareDto {
  centerName: string
  vehicleType: string
  region: string | null
  fareType: 'BASIC' | 'STOP_FEE'
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
}

export interface UpdateCenterFareDto {
  centerName?: string
  vehicleType?: string
  region?: string | null
  fareType?: 'BASIC' | 'STOP_FEE'
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
}

class CenterFareApiService {
  async list(filters?: {
    centerName?: string
    vehicleType?: string
    fareType?: string
    search?: string
  }): Promise<CenterFareDto[]> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }
    
    const res = await fetch(`/api/center-fares?${params}`)
    if (!res.ok) {
      throw new Error('Failed to fetch center fares')
    }
    const data = await res.json()
    return data.data.fares || []
  }

  async create(dto: CreateCenterFareDto): Promise<CenterFareDto> {
    const res = await fetch('/api/center-fares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    })
    
    if (res.status === 409) {
      const error = await res.json()
      throw new Error('DUPLICATE')
    }
    if (!res.ok) {
      throw new Error('Failed to create center fare')
    }
    
    const data = await res.json()
    return data.data
  }

  async update(id: string, dto: UpdateCenterFareDto): Promise<CenterFareDto> {
    const res = await fetch(`/api/center-fares/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    })
    
    if (!res.ok) {
      throw new Error('Failed to update center fare')
    }
    
    const data = await res.json()
    return data.data
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/center-fares/${id}`, {
      method: 'DELETE'
    })
    
    if (!res.ok) {
      throw new Error('Failed to delete center fare')
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
      throw new Error('Failed to import')
    }
    
    const data = await res.json()
    return data.data
  }

  async export(filters?: any): Promise<Blob> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }
    
    const res = await fetch(`/api/center-fares/export?${params}`)
    if (!res.ok) {
      throw new Error('Failed to export')
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
    // 각 지역별 기본운임 조회
    const regionFares = []
    for (const region of params.regions) {
      const fares = await this.list({
        centerName: params.centerName,
        vehicleType: params.vehicleType,
        fareType: 'BASIC'
      })
      
      const fare = fares.find(f => f.region === region)
      if (fare && fare.baseFare) {
        regionFares.push({ region, fare: fare.baseFare })
      } else {
        const error = new Error(`${region} 지역의 기본운임이 등록되지 않았습니다`)
        ;(error as any).missingData = {
          type: 'basic',
          region,
          centerName: params.centerName,
          vehicleType: params.vehicleType
        }
        throw error
      }
    }
    
    // 기본료 계산
    const baseFare = Math.max(...regionFares.map(rf => rf.fare))
    
    // 경유운임/지역운임 계산 (필요할 때만 조회)
    let extraStopFee = 0
    let extraRegionFee = 0
    
    const needsExtraFees = params.stopCount > 1 || params.regions.length > 1
    if (needsExtraFees) {
      const extraFares = await this.list({
        centerName: params.centerName,
        vehicleType: params.vehicleType,
        fareType: 'STOP_FEE'
      })
      
      const extraFare = extraFares[0]
      
      // 경유운임 확인 (착지수 > 1일 때만)
      if (params.stopCount > 1) {
        if (!extraFare || !extraFare.extraStopFee) {
          const error = new Error('경유운임 요율이 등록되지 않았습니다')
          ;(error as any).missingData = {
            type: 'extra',
            centerName: params.centerName,
            vehicleType: params.vehicleType
          }
          throw error
        }
        extraStopFee = extraFare.extraStopFee * (params.stopCount - 1)
      }
      
      // 지역운임 확인 (지역수 > 1일 때만)
      if (params.regions.length > 1) {
        if (!extraFare || !extraFare.extraRegionFee) {
          const error = new Error('지역운임 요율이 등록되지 않았습니다')
          ;(error as any).missingData = {
            type: 'extra',
            centerName: params.centerName,
            vehicleType: params.vehicleType
          }
          throw error
        }
        extraRegionFee = extraFare.extraRegionFee * (params.regions.length - 1)
      }
    }
    
    const total = baseFare + extraStopFee + extraRegionFee
    
    return {
      baseFare,
      extraStopFee,
      extraRegionFee,
      total
    }
  }
}

export const centerFareApi = new CenterFareApiService()