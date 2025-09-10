'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

interface RouteTemplate {
  id: string
  name: string
  loadingPoint: string
  unloadingPoint: string
  distance?: number | null
  driverFare: string
  billingFare: string
  weekdayPattern: number[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  defaultDriver?: {
    id: string
    name: string
    phone: string
  } | null
  _count: {
    trips: number
  }
}

interface RouteFormData {
  name: string
  loadingPoint: string
  unloadingPoint: string
  distance?: number
  driverFare: number
  billingFare: number
  weekdayPattern: number[]
  defaultDriverId?: string
  isActive?: boolean
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

async function fetchRoutes(): Promise<{ routes: RouteTemplate[], pagination: any }> {
  const response = await fetch('/api/routes')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to fetch routes')
  }
  const data = await response.json()
  return data.data
}

async function createRoute(routeData: RouteFormData): Promise<RouteTemplate> {
  const response = await fetch('/api/routes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(routeData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to create route')
  }
  
  const data = await response.json()
  return data.data
}

async function updateRoute(id: string, routeData: Partial<RouteFormData>): Promise<RouteTemplate> {
  const response = await fetch(`/api/routes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(routeData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to update route')
  }
  
  const data = await response.json()
  return data.data
}

async function deleteRoute(id: string): Promise<void> {
  const response = await fetch(`/api/routes/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to delete route')
  }
}

export default function RoutesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteTemplate | null>(null)
  const [formData, setFormData] = useState<RouteFormData>({
    name: '',
    loadingPoint: '',
    unloadingPoint: '',
    driverFare: 0,
    billingFare: 0,
    weekdayPattern: [],
  })

  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['routes'],
    queryFn: fetchRoutes,
  })

  const createMutation = useMutation({
    mutationFn: createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      setIsModalOpen(false)
      resetForm()
      toast.success('노선이 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<RouteFormData>) => 
      updateRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      setIsModalOpen(false)
      resetForm()
      setEditingRoute(null)
      toast.success('노선이 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      toast.success('노선이 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      loadingPoint: '',
      unloadingPoint: '',
      driverFare: 0,
      billingFare: 0,
      weekdayPattern: [],
    })
  }

  const handleOpenModal = (route?: RouteTemplate) => {
    if (route) {
      setEditingRoute(route)
      setFormData({
        name: route.name,
        loadingPoint: route.loadingPoint,
        unloadingPoint: route.unloadingPoint,
        distance: route.distance || undefined,
        driverFare: parseFloat(route.driverFare),
        billingFare: parseFloat(route.billingFare),
        weekdayPattern: route.weekdayPattern,
        defaultDriverId: route.defaultDriver?.id,
        isActive: route.isActive,
      })
    } else {
      setEditingRoute(null)
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingRoute) {
      updateMutation.mutate({ id: editingRoute.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleWeekdayToggle = (weekday: number) => {
    setFormData(prev => ({
      ...prev,
      weekdayPattern: prev.weekdayPattern.includes(weekday)
        ? prev.weekdayPattern.filter(w => w !== weekday)
        : [...prev.weekdayPattern, weekday].sort()
    }))
  }

  const handleDelete = (route: RouteTemplate) => {
    if (confirm(`"${route.name}" 노선을 삭제하시겠습니까?`)) {
      deleteMutation.mutate(route.id)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">에러가 발생했습니다: {(error as Error).message}</div>
      </div>
    )
  }

  const routes = data?.routes || []

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">노선 관리</h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            + 노선 추가
          </button>
        </div>

        {/* Routes Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    노선명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상차지 → 하차지
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    운행 요일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기사운임
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    청구운임
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    운행 수
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {route.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {route.loadingPoint} → {route.unloadingPoint}
                      </div>
                      {route.distance && (
                        <div className="text-sm text-gray-500">
                          {route.distance}km
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {route.weekdayPattern.map(w => weekdays[w]).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {parseInt(route.driverFare).toLocaleString()}원
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {parseInt(route.billingFare).toLocaleString()}원
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        route.isActive 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {route.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {route._count.trips}건
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(route)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(route)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {editingRoute ? '노선 수정' : '노선 추가'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    노선명 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상차지 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.loadingPoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, loadingPoint: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    하차지 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unloadingPoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, unloadingPoint: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거리 (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.distance || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, distance: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기사운임 (원) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.driverFare}
                    onChange={(e) => setFormData(prev => ({ ...prev, driverFare: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    청구운임 (원) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.billingFare}
                    onChange={(e) => setFormData(prev => ({ ...prev, billingFare: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
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

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false)
                      resetForm()
                      setEditingRoute(null)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? '저장 중...' : '저장'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}