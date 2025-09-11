'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute, useAssignRouteDriver } from '@/hooks/useRoutes'
import { CreateRouteData, UpdateRouteData, RouteResponse, getWeekdayNames, getWeekdayName } from '@/lib/validations/route'
import React from 'react'
import { toast } from 'react-hot-toast'

// 노선 등록 모달
function CreateRouteModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting 
}: { 
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateRouteData) => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState<Partial<CreateRouteData>>({
    weekdayPattern: [],
    isActive: true
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.loadingPoint || !formData.unloadingPoint || 
        !formData.driverFare || !formData.billingFare || !formData.weekdayPattern?.length) {
      toast.error('필수 필드를 모두 입력해주세요')
      return
    }
    if (formData.billingFare < formData.driverFare) {
      toast.error('청구운임은 기사운임보다 크거나 같아야 합니다')
      return
    }
    onSubmit(formData as CreateRouteData)
  }

  const handleWeekdayToggle = (weekday: number) => {
    const current = formData.weekdayPattern || []
    const isSelected = current.includes(weekday)
    
    if (isSelected) {
      setFormData({
        ...formData,
        weekdayPattern: current.filter(d => d !== weekday)
      })
    } else {
      setFormData({
        ...formData,
        weekdayPattern: [...current, weekday].sort()
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">노선 등록</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">노선명 *</label>
                  <input
                    type="text"
                    placeholder="노선명을 입력하세요"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">상차지 *</label>
                    <input
                      type="text"
                      placeholder="상차지"
                      value={formData.loadingPoint || ''}
                      onChange={(e) => setFormData({ ...formData, loadingPoint: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">하차지 *</label>
                    <input
                      type="text"
                      placeholder="하차지"
                      value={formData.unloadingPoint || ''}
                      onChange={(e) => setFormData({ ...formData, unloadingPoint: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">거리 (선택)</label>
                  <input
                    type="number"
                    placeholder="km"
                    min="0"
                    max="2000"
                    step="0.1"
                    value={formData.distance || ''}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">기사운임 *</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="10000000"
                      value={formData.driverFare || ''}
                      onChange={(e) => setFormData({ ...formData, driverFare: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">청구운임 *</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="10000000"
                      value={formData.billingFare || ''}
                      onChange={(e) => setFormData({ ...formData, billingFare: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">운행요일 *</label>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((weekday) => (
                      <button
                        key={weekday}
                        type="button"
                        onClick={() => handleWeekdayToggle(weekday)}
                        className={`px-3 py-1 text-sm rounded ${
                          formData.weekdayPattern?.includes(weekday)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {getWeekdayName(weekday)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">기본 배정 기사 ID (선택)</label>
                  <input
                    type="text"
                    placeholder="기사 ID 입력..."
                    value={formData.defaultDriverId || ''}
                    onChange={(e) => setFormData({ ...formData, defaultDriverId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive !== false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">활성 상태</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '등록 중...' : '노선 등록'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// 노선 수정 모달
function EditRouteModal({ 
  isOpen, 
  onClose, 
  route, 
  onSubmit, 
  isSubmitting 
}: { 
  isOpen: boolean
  onClose: () => void
  route: RouteResponse | null
  onSubmit: (data: UpdateRouteData) => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState<Partial<UpdateRouteData>>({})

  // route가 변경될 때 폼 데이터 초기화
  React.useEffect(() => {
    if (route) {
      setFormData({
        name: route.name,
        loadingPoint: route.loadingPoint,
        unloadingPoint: route.unloadingPoint,
        distance: route.distance || undefined,
        driverFare: parseInt(route.driverFare),
        billingFare: parseInt(route.billingFare),
        weekdayPattern: route.weekdayPattern,
        defaultDriverId: route.defaultDriver?.id || undefined,
        isActive: route.isActive
      })
    }
  }, [route])

  if (!isOpen || !route) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.loadingPoint || !formData.unloadingPoint || 
        !formData.driverFare || !formData.billingFare || !formData.weekdayPattern?.length) {
      toast.error('필수 필드를 모두 입력해주세요')
      return
    }
    if (formData.billingFare && formData.driverFare && formData.billingFare < formData.driverFare) {
      toast.error('청구운임은 기사운임보다 크거나 같아야 합니다')
      return
    }
    onSubmit(formData as UpdateRouteData)
  }

  const handleWeekdayToggle = (weekday: number) => {
    const current = formData.weekdayPattern || []
    const isSelected = current.includes(weekday)
    
    if (isSelected) {
      setFormData({
        ...formData,
        weekdayPattern: current.filter(d => d !== weekday)
      })
    } else {
      setFormData({
        ...formData,
        weekdayPattern: [...current, weekday].sort()
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">노선 수정</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">노선명 *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">상차지 *</label>
                    <input
                      type="text"
                      value={formData.loadingPoint || ''}
                      onChange={(e) => setFormData({ ...formData, loadingPoint: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">하차지 *</label>
                    <input
                      type="text"
                      value={formData.unloadingPoint || ''}
                      onChange={(e) => setFormData({ ...formData, unloadingPoint: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">거리</label>
                  <input
                    type="number"
                    min="0"
                    max="2000"
                    step="0.1"
                    value={formData.distance || ''}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">기사운임 *</label>
                    <input
                      type="number"
                      min="0"
                      max="10000000"
                      value={formData.driverFare || ''}
                      onChange={(e) => setFormData({ ...formData, driverFare: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">청구운임 *</label>
                    <input
                      type="number"
                      min="0"
                      max="10000000"
                      value={formData.billingFare || ''}
                      onChange={(e) => setFormData({ ...formData, billingFare: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">운행요일 *</label>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((weekday) => (
                      <button
                        key={weekday}
                        type="button"
                        onClick={() => handleWeekdayToggle(weekday)}
                        className={`px-3 py-1 text-sm rounded ${
                          formData.weekdayPattern?.includes(weekday)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {getWeekdayName(weekday)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">기본 배정 기사 ID</label>
                  <input
                    type="text"
                    value={formData.defaultDriverId || ''}
                    onChange={(e) => setFormData({ ...formData, defaultDriverId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive !== false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">활성 상태</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '수정 중...' : '노선 수정'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function RoutesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState<boolean | undefined>()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteResponse | null>(null)

  const { data, isLoading, error } = useRoutes({ 
    page, 
    limit: 20, 
    search: search || undefined,
    isActive 
  })

  const createMutation = useCreateRoute()
  const updateMutation = useUpdateRoute()
  const deleteMutation = useDeleteRoute()

  const handleCreate = (data: CreateRouteData) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateModalOpen(false)
    })
  }

  const handleEdit = (route: RouteResponse) => {
    setEditingRoute(route)
    setEditModalOpen(true)
  }

  const handleUpdate = (data: UpdateRouteData) => {
    if (!editingRoute) return
    updateMutation.mutate({ id: editingRoute.id, data }, {
      onSuccess: () => {
        setEditModalOpen(false)
        setEditingRoute(null)
      }
    })
  }

  const handleDelete = (routeId: string) => {
    if (confirm('정말 이 노선을 비활성화하시겠습니까?')) {
      deleteMutation.mutate(routeId)
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h1 className="ml-3 text-xl font-bold text-gray-900">노선 관리</h1>
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
                노선 등록
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 검색 및 필터 */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  placeholder="노선명, 상차지, 하차지로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
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

        {/* 노선 목록 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : !data?.routes?.length ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">등록된 노선이 없습니다</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        노선명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        구간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        요일패턴
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        운임 (기사/청구)
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
                    {data.routes.map((route) => (
                      <tr key={route.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {route.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="text-sm font-medium">{route.loadingPoint}</div>
                            <div className="text-xs text-gray-500">↓</div>
                            <div className="text-sm">{route.unloadingPoint}</div>
                          </div>
                          {route.distance && (
                            <div className="text-xs text-gray-500 mt-1">{route.distance}km</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getWeekdayNames(route.weekdayPattern)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{parseInt(route.driverFare).toLocaleString()}원</div>
                            <div className="text-gray-500">{parseInt(route.billingFare).toLocaleString()}원</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {route.defaultDriver ? (
                            <div>
                              <div className="font-medium">{route.defaultDriver.name}</div>
                              <div className="text-gray-500">{route.defaultDriver.phone}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">미배정</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            route.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {route.isActive ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(route.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(route)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            수정
                          </button>
                          {route.isActive && (
                            <button
                              onClick={() => handleDelete(route.id)}
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

      {/* 모달 컴포넌트들 */}
      <CreateRouteModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <EditRouteModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingRoute(null)
        }}
        route={editingRoute}
        onSubmit={handleUpdate}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  )
}