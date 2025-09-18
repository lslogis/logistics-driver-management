import { api } from '@/lib/api/client'
import { RequestDetail, RequestSummary } from '@/lib/types/request'

export interface RequestListResponse {
  data: RequestSummary[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateRequestPayload {
  loadingPointId: string
  requestDate: string
  centerCarNo?: string
  vehicleTon: number
  regions: string[]
  stops: number
  notes?: string
  extraAdjustment?: number
  adjustmentReason?: string
}

export type UpdateRequestPayload = Partial<CreateRequestPayload>

class RequestsAPI {
  async list(params: Record<string, any> = {}): Promise<RequestListResponse> {
    return api.get('/api/requests', params)
  }

  async get(id: string): Promise<RequestDetail> {
    return api.get('/api/requests/' + id)
  }

  async create(payload: CreateRequestPayload): Promise<RequestDetail> {
    return api.post('/api/requests', {
      ...payload,
      loadingPointId: payload.loadingPointId,
    })
  }

  async update(id: string, payload: UpdateRequestPayload): Promise<RequestDetail> {
    return api.put('/api/requests/' + id, {
      ...payload,
      loadingPointId: payload.loadingPointId,
    })
  }

  async delete(id: string): Promise<{ message: string }> {
    return api.delete('/api/requests/' + id)
  }
}

export const requestsAPI = new RequestsAPI()
