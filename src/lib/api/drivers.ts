/**
 * 기사 관리 API 클라이언트
 * 기사 데이터 CRUD 작업을 위한 API 함수들
 */

import { Driver } from '@/types'

const API_BASE = '/api/drivers'

export interface DriversListResponse {
  data: Driver[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface DriversListParams {
  page?: number
  limit?: number
  search?: string
  active?: boolean
  vehicleTon?: number
  sortBy?: 'name' | 'createdAt' | 'vehicleTon'
  sortOrder?: 'asc' | 'desc'
}

/**
 * 기사 목록 조회
 */
export async function list(params: DriversListParams = {}): Promise<DriversListResponse> {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  const response = await fetch(`${API_BASE}?${searchParams}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch drivers: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * 기사 상세 조회
 */
export async function get(id: string): Promise<Driver> {
  const response = await fetch(`${API_BASE}/${id}`)
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Driver not found')
    }
    throw new Error(`Failed to fetch driver: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * 기사 생성
 */
export async function create(data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): Promise<Driver> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || 'Failed to create driver')
  }
  
  return response.json()
}

/**
 * 기사 수정
 */
export async function update(id: string, data: Partial<Driver>): Promise<Driver> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Driver not found')
    }
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || 'Failed to update driver')
  }
  
  return response.json()
}

/**
 * 기사 삭제
 */
export async function remove(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Driver not found')
    }
    throw new Error(`Failed to delete driver: ${response.statusText}`)
  }
}

/**
 * 기사 상태 토글 (활성/비활성)
 */
export async function toggle(id: string): Promise<Driver> {
  const response = await fetch(`${API_BASE}/${id}/toggle`, {
    method: 'POST',
  })
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Driver not found')
    }
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || 'Failed to toggle driver status')
  }
  
  return response.json()
}

/**
 * 활성 기사 목록 조회 (간소화된 버전)
 */
export async function getActiveDrivers(): Promise<Driver[]> {
  const response = await list({ active: true, limit: 1000 })
  return response.data
}

/**
 * 기사 검색
 */
export async function search(query: string): Promise<Driver[]> {
  const response = await list({ search: query, active: true, limit: 50 })
  return response.data
}

/**
 * 기사 내보내기
 */
export async function exportDrivers(params: DriversListParams = {}): Promise<Blob> {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  const response = await fetch(`${API_BASE}/export?${searchParams}`)
  
  if (!response.ok) {
    throw new Error(`Failed to export drivers: ${response.statusText}`)
  }
  
  return response.blob()
}

/**
 * 기사 가져오기 (Excel 파일)
 */
export async function importDrivers(file: File): Promise<{
  success: boolean
  imported: number
  errors: Array<{ row: number; message: string }>
}> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || 'Failed to import drivers')
  }
  
  return response.json()
}

// Export all functions as driversAPI object for consistent usage
export const driversAPI = {
  list,
  get,
  create,
  update,
  remove,
  toggle,
  getActiveDrivers,
  search,
  exportDrivers,
  importDrivers
}