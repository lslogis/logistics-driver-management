'use client'

import React, { useState } from 'react'
import { Plus, Search, Edit, Trash2, Calendar, User, Truck, Route, MapPin, DollarSign, Upload } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { TripResponse, CreateTripData, UpdateTripData, getTripStatusName, getTripStatusColor, canEditTrip, canDeleteTrip } from '@/lib/validations/trip'
import Link from 'next/link'

// 운행 목록 조회
function useTrips(search?: string, dateFrom?: string, dateTo?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['trips', search, dateFrom, dateTo, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      })
      
      const response = await fetch(`/api/trips?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch trips')
      }
      
      return result.data
    },
    staleTime: 30000, // 30초 동안 fresh
    retry: 2
  })
}

// 운행 생성 뮤테이션
function useCreateTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateTripData) => {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create trip')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('운행이 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 운행 수정 뮤테이션
function useUpdateTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTripData }) => {
      const response = await fetch(`/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update trip')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('운행 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 운행 삭제 뮤테이션
function useDeleteTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/trips/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete trip')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('운행이 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 상태 배지 컴포넌트
function StatusBadge({ status }: { status: TripResponse['status'] }) {
  const color = getTripStatusColor(status)
  const name = getTripStatusName(status)
  
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800'}`}>
      {name}
    </span>
  )
}

// 메인 TripsPage 컴포넌트
export default function TripsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: tripsData, isLoading, error } = useTrips(searchTerm, dateFrom, dateTo)
  const deleteMutation = useDeleteTrip()

  const handleDelete = (id: string, status: TripResponse['status']) => {
    if (!canDeleteTrip(status)) {
      toast.error('이 운행은 삭제할 수 없습니다')
      return
    }
    
    if (window.confirm('정말로 이 운행을 삭제하시겠습니까?')) {
      deleteMutation.mutate(id)
    }
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(parseInt(amount))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
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
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                운행 관리
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                메인으로
              </Link>
              <Link
                href="/import/trips"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                CSV 가져오기
              </Link>
              <button
                onClick={() => toast.info('운행 등록 기능은 곧 추가됩니다')}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                운행 등록
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
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="기사명, 차량번호, 노선으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                시작일
              </label>
              <input
                type="date"
                id="dateFrom"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                종료일
              </label>
              <input
                type="date"
                id="dateTo"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 운행 목록 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : !tripsData?.trips?.length ? (
            <div className="p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">등록된 운행이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                새로운 운행을 등록해보세요.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tripsData.trips.map((trip: TripResponse) => (
                <li key={trip.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* 첫 번째 줄: 날짜, 상태, 기사, 차량 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {formatDate(trip.date)}
                          </div>
                          <StatusBadge status={trip.status} />
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>등록: {new Date(trip.createdAt).toLocaleDateString('ko-KR')}</p>
                        </div>
                      </div>

                      {/* 두 번째 줄: 기사 및 차량 정보 */}
                      <div className="flex items-center space-x-6 mb-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          {trip.driver.name}
                          <span className="ml-1 text-gray-500">({trip.driver.phone})</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Truck className="h-4 w-4 mr-1 text-gray-400" />
                          {trip.vehicle.plateNumber}
                          <span className="ml-1 text-gray-500">({trip.vehicle.vehicleType})</span>
                        </div>
                      </div>

                      {/* 세 번째 줄: 노선 정보 */}
                      <div className="flex items-center mb-2">
                        {trip.routeTemplate ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <Route className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="font-medium">{trip.routeTemplate.name}</span>
                            <span className="mx-2 text-gray-400">•</span>
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {trip.routeTemplate.loadingPoint}
                            <span className="mx-2 text-gray-400">→</span>
                            {trip.routeTemplate.unloadingPoint}
                          </div>
                        ) : trip.customRoute ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <Route className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="font-medium">커스텀</span>
                            <span className="mx-2 text-gray-400">•</span>
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {trip.customRoute.loadingPoint}
                            <span className="mx-2 text-gray-400">→</span>
                            {trip.customRoute.unloadingPoint}
                          </div>
                        ) : null}
                      </div>

                      {/* 네 번째 줄: 요금 정보 */}
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                          <span>기사: {formatCurrency(trip.driverFare)}</span>
                          <span className="ml-2">청구: {formatCurrency(trip.billingFare)}</span>
                        </div>
                        {trip.deductionAmount && (
                          <div className="text-sm text-red-600">
                            차감: {formatCurrency(trip.deductionAmount)}
                          </div>
                        )}
                        {trip.substituteFare && (
                          <div className="text-sm text-orange-600">
                            대차: {formatCurrency(trip.substituteFare)}
                          </div>
                        )}
                      </div>

                      {/* 비고 */}
                      {trip.remarks && (
                        <div className="mt-2 text-sm text-gray-500">
                          {trip.remarks}
                        </div>
                      )}

                      {/* 결행 사유 */}
                      {trip.absenceReason && (
                        <div className="mt-2 text-sm text-red-600">
                          결행 사유: {trip.absenceReason}
                        </div>
                      )}

                      {/* 대차 기사 */}
                      {trip.substituteDriver && (
                        <div className="mt-2 text-sm text-orange-600">
                          대차 기사: {trip.substituteDriver.name} ({trip.substituteDriver.phone})
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center space-x-1 ml-4">
                      {canEditTrip(trip.status) && (
                        <button
                          onClick={() => toast.info('운행 수정 기능은 곧 추가됩니다')}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canDeleteTrip(trip.status) && (
                        <button
                          onClick={() => handleDelete(trip.id, trip.status)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 페이지네이션 */}
        {tripsData?.pagination && tripsData.pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-md shadow">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  총 <span className="font-medium">{tripsData.pagination.total}</span>개 중{' '}
                  <span className="font-medium">
                    {(tripsData.pagination.page - 1) * tripsData.pagination.limit + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-medium">
                    {Math.min(
                      tripsData.pagination.page * tripsData.pagination.limit,
                      tripsData.pagination.total
                    )}
                  </span>{' '}
                  개 표시
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}