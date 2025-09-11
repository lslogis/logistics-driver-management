# 🚀 IMPLEMENT_PLAN.md - 즉시 실행 가능한 구현 계획

**생성 일시**: 2025-09-11  
**기준**: GAPS.md 분석 결과를 바탕으로 한 구현 로드맵

---

## 📋 구현 준비 상태

### ✅ 구현 가능 조건 충족
- **Prisma 스키마**: ✅ 완전 구현, 드리프트 없음
- **API 엔드포인트**: ✅ 34개 모두 구현 완료
- **Docker 환경**: ✅ 정상 동작 중
- **기본 인프라**: ✅ NextAuth, React Query, Tailwind 모두 설정 완료

### 🎯 구현 대상
**Phase 1 (Critical)**: 3개 프론트엔드 페이지 구현 + API 연동

---

## 🔥 Task 1: Vehicles 관리 페이지 구현

### 1.1 API 클라이언트 생성
```bash
# 파일 경로: src/lib/api/vehicles.ts
# 액션: 신규 생성
```

```typescript
// /implement 블록 1: vehicles API 클라이언트
import { VehicleResponse, CreateVehicleData, UpdateVehicleData, GetVehiclesQuery } from '@/lib/validations/vehicle'

export class VehiclesAPI {
  async getVehicles(params: GetVehiclesQuery = {}) {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.search) searchParams.set('search', params.search)
    if (params.ownership) searchParams.set('ownership', params.ownership)
    if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString())

    const response = await fetch(`/api/vehicles?${searchParams}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async createVehicle(data: CreateVehicleData) {
    const response = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async updateVehicle(id: string, data: UpdateVehicleData) {
    const response = await fetch(`/api/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async deleteVehicle(id: string) {
    const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async assignDriver(vehicleId: string, driverId: string | null) {
    const response = await fetch(`/api/vehicles/${vehicleId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId })
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }
}

export const vehiclesAPI = new VehiclesAPI()
```

### 1.2 React Query 훅 생성
```bash
# 파일 경로: src/hooks/useVehicles.ts
# 액션: 신규 생성
```

```typescript
// /implement 블록 2: vehicles React Query 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesAPI } from '@/lib/api/vehicles'
import { CreateVehicleData, UpdateVehicleData, GetVehiclesQuery } from '@/lib/validations/vehicle'
import { toast } from 'react-hot-toast'

export function useVehicles(params: GetVehiclesQuery = {}) {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => vehiclesAPI.getVehicles(params),
    staleTime: 5 * 60 * 1000
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: vehiclesAPI.createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('차량이 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '등록 중 오류가 발생했습니다')
    }
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateVehicleData }) =>
      vehiclesAPI.updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('차량 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '수정 중 오류가 발생했습니다')
    }
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: vehiclesAPI.deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('차량이 비활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '삭제 중 오류가 발생했습니다')
    }
  })
}

export function useAssignDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ vehicleId, driverId }: { vehicleId: string, driverId: string | null }) =>
      vehiclesAPI.assignDriver(vehicleId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('기사 배정이 변경되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '배정 중 오류가 발생했습니다')
    }
  })
}
```

### 1.3 메인 페이지 컴포넌트 생성
```bash
# 파일 경로: src/app/vehicles/page.tsx
# 액션: 신규 생성
```

```typescript
// /implement 블록 3: vehicles 메인 페이지
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useAssignDriver } from '@/hooks/useVehicles'
import { CreateVehicleData, UpdateVehicleData, VehicleResponse } from '@/lib/validations/vehicle'
import { VehicleOwnership } from '@prisma/client'

export default function VehiclesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [ownership, setOwnership] = useState<VehicleOwnership | ''>('')
  const [isActive, setIsActive] = useState<boolean | undefined>()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<VehicleResponse | null>(null)

  const { data, isLoading, error } = useVehicles({ 
    page, 
    limit: 20, 
    search: search || undefined,
    ownership: ownership || undefined,
    isActive 
  })

  const createMutation = useCreateVehicle()
  const updateMutation = useUpdateVehicle()
  const deleteMutation = useDeleteVehicle()

  const handleCreate = (data: CreateVehicleData) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateModalOpen(false)
    })
  }

  const handleEdit = (vehicle: VehicleResponse) => {
    setEditingVehicle(vehicle)
    setEditModalOpen(true)
  }

  const handleUpdate = (data: UpdateVehicleData) => {
    if (!editingVehicle) return
    updateMutation.mutate({ id: editingVehicle.id, data }, {
      onSuccess: () => {
        setEditModalOpen(false)
        setEditingVehicle(null)
      }
    })
  }

  const handleDelete = (vehicleId: string) => {
    if (confirm('정말 이 차량을 비활성화하시겠습니까?')) {
      deleteMutation.mutate(vehicleId)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8V7z" />
              </svg>
              <h1 className="ml-3 text-xl font-bold text-gray-900">차량 관리</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link 
                href="/" 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                메인으로
              </Link>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                차량 등록
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 검색 및 필터 */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                검색
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="차량번호로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="ownership" className="block text-sm font-medium text-gray-700 mb-1">
                소유권
              </label>
              <select
                id="ownership"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={ownership}
                onChange={(e) => setOwnership(e.target.value as VehicleOwnership | '')}
              >
                <option value="">전체</option>
                <option value="OWNED">고정 (자차)</option>
                <option value="CHARTER">용차 (임시)</option>
                <option value="CONSIGNED">지입 (계약)</option>
              </select>
            </div>

            <div>
              <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                id="isActive"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={isActive === undefined ? '' : isActive.toString()}
                onChange={(e) => {
                  const value = e.target.value
                  setIsActive(value === '' ? undefined : value === 'true')
                }}
              >
                <option value="">전체</option>
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
            </div>
          </div>
        </div>

        {/* 차량 목록 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : !data?.vehicles?.length ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">등록된 차량이 없습니다</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        차량번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        차종
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        소유권
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        배정 기사
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        등록일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {vehicle.plateNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.vehicleType}
                          {vehicle.capacityTon && (
                            <span className="text-gray-500 ml-1">({vehicle.capacityTon}톤)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            vehicle.ownership === 'OWNED' ? 'bg-blue-100 text-blue-800' :
                            vehicle.ownership === 'CHARTER' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {vehicle.ownership === 'OWNED' ? '고정' :
                             vehicle.ownership === 'CHARTER' ? '용차' : '지입'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.driver ? (
                            <div>
                              <div className="font-medium">{vehicle.driver.name}</div>
                              <div className="text-gray-500">{vehicle.driver.phone}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">미배정</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            vehicle.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {vehicle.isActive ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(vehicle.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            수정
                          </button>
                          {vehicle.isActive && (
                            <button
                              onClick={() => handleDelete(vehicle.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              비활성화
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {data.pagination && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      총 <span className="font-medium">{data.pagination.total}</span>개 중{' '}
                      <span className="font-medium">
                        {((data.pagination.page - 1) * data.pagination.limit) + 1}
                      </span>
                      -{' '}
                      <span className="font-medium">
                        {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}
                      </span>
                      개 표시
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      <span className="px-3 py-1 text-sm">
                        {page} / {data.pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= data.pagination.totalPages}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* TODO: 모달 컴포넌트들 구현 필요 */}
      {/* CreateVehicleModal, EditVehicleModal */}
    </div>
  )
}
```

---

## 📝 즉시 실행 명령어

### 1단계: API 클라이언트 생성
```bash
# 파일 생성
touch src/lib/api/vehicles.ts
touch src/hooks/useVehicles.ts

# 위의 /implement 블록 1, 2 코드를 각각 파일에 복사
```

### 2단계: 페이지 컴포넌트 생성
```bash
# 디렉토리 및 파일 생성
mkdir -p src/app/vehicles
touch src/app/vehicles/page.tsx

# 위의 /implement 블록 3 코드를 파일에 복사
```

### 3단계: 개발 서버에서 테스트
```bash
# Docker 환경에서 확인
docker-compose up -d
curl http://localhost:3000/vehicles

# 차량 목록 페이지 접근 테스트
```

---

## 🚦 다음 단계

1. **즉시 실행**: 위 명령어로 Vehicles 페이지 구현
2. **모달 완성**: CreateVehicleModal, EditVehicleModal 컴포넌트 추가 구현
3. **Routes 페이지**: 동일한 패턴으로 Routes 페이지 구현
4. **Settlements 연동**: 기존 UI에 React Query 연동

---

**실행 준비**: ✅ 모든 구현 블록이 즉시 실행 가능한 상태로 준비됨