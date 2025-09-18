import { api } from '@/lib/api/client'

export interface LoadingPointDto {
  id: string
  name: string | null
  loadingPointName: string
  centerName: string
  lotAddress?: string | null
  roadAddress?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoadingPointListResponse {
  data: LoadingPointDto[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateLoadingPointPayload {
  name?: string | null
  loadingPointName: string
  centerName: string
  lotAddress?: string | null
  roadAddress?: string | null
  manager1?: string | null
  manager2?: string | null
  phone1?: string | null
  phone2?: string | null
  remarks?: string | null
}

export type UpdateLoadingPointPayload = Partial<CreateLoadingPointPayload> & {
  isActive?: boolean
}

class LoadingPointsAPI {
  async list(params: Record<string, any> = {}): Promise<LoadingPointListResponse> {
    return api.get('/api/loading-points', params)
  }

  async get(id: string): Promise<{ data: LoadingPointDto }> {
    return api.get('/api/loading-points/' + id)
  }

  async create(payload: CreateLoadingPointPayload): Promise<{ data: LoadingPointDto }> {
    return api.post('/api/loading-points', payload)
  }

  async update(id: string, payload: UpdateLoadingPointPayload): Promise<{ data: LoadingPointDto }> {
    return api.put('/api/loading-points/' + id, payload)
  }

  async toggle(id: string): Promise<{ data: LoadingPointDto }> {
    return api.post('/api/loading-points/' + id + '/toggle')
  }

  async activate(id: string): Promise<{ data: LoadingPointDto }> {
    return api.post('/api/loading-points/' + id + '/activate')
  }

  async delete(id: string, options: { hard?: boolean } = {}): Promise<{ message: string }> {
    const params = options.hard ? '?hard=true' : ''
    return api.delete('/api/loading-points/' + id + params)
  }
}

export const loadingPointsAPI = new LoadingPointsAPI()
