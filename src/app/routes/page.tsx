'use client'

import React, { useState } from 'react'
import { Plus, Search, Edit, Trash2, MapPin, Route, Clock, DollarSign, Calendar } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { RouteResponse, CreateRouteData, UpdateRouteData } from '@/lib/validations/route'
import Link from 'next/link'

// 노선 목록 조회
function useRoutes(search?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['routes', search, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      })
      
      const response = await fetch(`/api/routes?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch routes')
      }
      
      return result.data
    },
    staleTime: 30000, // 30초 동안 fresh
    retry: 2
  })
}

// 노선 생성 뮤테이션
function useCreateRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateRouteData) => {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create route')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      toast.success('노선이 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 노선 수정 뮤테이션
function useUpdateRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRouteData }) => {
      const response = await fetch(`/api/routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update route')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      toast.success('노선 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 노선 삭제 뮤테이션
function useDeleteRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/routes/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete route')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      toast.success('노선이 비활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 노선 폼 컴포넌트
interface RouteFormProps {
  route?: RouteResponse
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

function RouteForm({ route, onSubmit, isLoading, onCancel }: RouteFormProps) {
  const [formData, setFormData] = useState({
    name: route?.name || '',
    loadingPoint: route?.loadingPoint || '',
    unloadingPoint: route?.unloadingPoint || '',
    distance: route?.distance || undefined,
    driverFare: route?.driverFare ? parseFloat(route.driverFare) : 0,
    billingFare: route?.billingFare ? parseFloat(route.billingFare) : 0,
    weekdayPattern: route?.weekdayPattern || [],
    defaultDriverId: route?.defaultDriver?.id || '',
    isActive: route?.isActive ?? true
  })

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleWeekdayToggle = (weekday: number) => {
    setFormData(prev => ({
      ...prev,
      weekdayPattern: prev.weekdayPattern.includes(weekday)
        ? prev.weekdayPattern.filter(w => w !== weekday)
        : [...prev.weekdayPattern, weekday].sort()
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            노선명 *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="loadingPoint" className="block text-sm font-medium text-gray-700 mb-1">
            상차지 *
          </label>
          <input
            type="text"
            id="loadingPoint"
            required
            value={formData.loadingPoint}
            onChange={(e) => setFormData({ ...formData, loadingPoint: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="unloadingPoint" className="block text-sm font-medium text-gray-700 mb-1">
            하차지 *
          </label>
          <input
            type="text"
            id="unloadingPoint"
            required
            value={formData.unloadingPoint}
            onChange={(e) => setFormData({ ...formData, unloadingPoint: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-1">
            거리 (km)
          </label>
          <input
            type="number"
            id="distance"
            min="0"
            step="0.1"
            value={formData.distance || ''}
            onChange={(e) => setFormData({ ...formData, distance: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="driverFare" className="block text-sm font-medium text-gray-700 mb-1">
            기사운임 (원) *
          </label>
          <input
            type="number"
            id="driverFare"
            required
            min="0"
            value={formData.driverFare}
            onChange={(e) => setFormData({ ...formData, driverFare: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="billingFare" className="block text-sm font-medium text-gray-700 mb-1">
            청구운임 (원) *
          </label>
          <input
            type="number"
            id="billingFare"
            required
            min="0"
            value={formData.billingFare}
            onChange={(e) => setFormData({ ...formData, billingFare: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          운행 요일 *
        </label>
        <div className="flex flex-wrap gap-2">
          {weekdays.map((day, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleWeekdayToggle(index)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                formData.weekdayPattern.includes(index)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '처리 중...' : route ? '수정' : '등록'}
        </button>
      </div>
    </form>
  )
}

// 모달 컴포넌트
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {title}
                </h3>
                <div className="mt-2">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

//  FixedRoutesPage (노선 관리) 컴포넌트
export default function FixedRoutesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteResponse | null>(null)

  const { data: routesData, isLoading, error } = useRoutes(searchTerm)
  const createMutation = useCreateRoute()
  const updateMutation = useUpdateRoute()
  const deleteMutation = useDeleteRoute()

  const handleCreateSubmit = (data: CreateRouteData) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsCreateModalOpen(false)
    })
  }

  const handleUpdateSubmit = (data: UpdateRouteData) => {
    if (!editingRoute) return
    
    updateMutation.mutate(
      { id: editingRoute.id, data },
      {
        onSuccess: () => setEditingRoute(null)
      }
    )
  }

  const handleDelete = (id: string) => {
    if (window.confirm('정말로 이 노선을 비활성화하시겠습니까?')) {
      deleteMutation.mutate(id)
    }
  }

  const getWeekdayNames = (weekdays: number[]): string => {
    const names = ['일', '월', '화', '수', '목', '금', '토']
    return weekdays
      .sort()
      .map(w => names[w])
      .join(', ')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : '알 수 없는 오류'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            새로고침
          </button>
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
              <Route className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                고정 노선 관리
              </h1>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              노선 등록
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 검색 */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="노선명, 상차지, 하차지로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 노선 목록 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : !routesData?.routes?.length ? (
            <div className="p-8 text-center">
              <Route className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">등록된 노선이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                새로운 노선을 등록해보세요.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {routesData.routes.map((route: RouteResponse) => (
                <li key={route.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Route className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">{route.name}</p>
                          {!route.isActive && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              비활성
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {route.loadingPoint} → {route.unloadingPoint}
                          {route.distance && (
                            <>
                              <span className="ml-4">{route.distance}km</span>
                            </>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {getWeekdayNames(route.weekdayPattern)}
                          <DollarSign className="h-4 w-4 ml-4 mr-1" />
                          기사: {parseInt(route.driverFare).toLocaleString()}원
                          <span className="ml-2">
                            청구: {parseInt(route.billingFare).toLocaleString()}원
                          </span>
                        </div>
                        {route.defaultDriver && (
                          <div className="mt-1 text-sm text-gray-500">
                            기본기사: {route.defaultDriver.name} ({route.defaultDriver.phone})
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-xs text-gray-500">
                        <p>운행: {route._count?.trips || 0}회</p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingRoute(route)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 페이지네이션 */}
        {routesData?.pagination && routesData.pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-md shadow">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  총 <span className="font-medium">{routesData.pagination.total}</span>개 중{' '}
                  <span className="font-medium">
                    {(routesData.pagination.page - 1) * routesData.pagination.limit + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-medium">
                    {Math.min(
                      routesData.pagination.page * routesData.pagination.limit,
                      routesData.pagination.total
                    )}
                  </span>{' '}
                  개 표시
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 생성 모달 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="노선 등록"
      >
        <RouteForm
          onSubmit={handleCreateSubmit}
          isLoading={createMutation.isPending}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* 수정 모달 */}
      <Modal
        isOpen={!!editingRoute}
        onClose={() => setEditingRoute(null)}
        title="노선 정보 수정"
      >
        {editingRoute && (
          <RouteForm
            route={editingRoute}
            onSubmit={handleUpdateSubmit}
            isLoading={updateMutation.isPending}
            onCancel={() => setEditingRoute(null)}
          />
        )}
      </Modal>
    </div>
  )
}