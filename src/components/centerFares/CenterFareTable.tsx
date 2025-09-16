'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Settings,
  Building2,
  Truck,
  MapPin,
  DollarSign,
  Calendar,
  Plus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { CenterFare, CenterFareQuery } from '@/lib/api/center-fares'
import { formatNumber } from '@/lib/utils/format'

interface CenterFareTableProps {
  data?: {
    fares: CenterFare[]
    totalCount: number
    page: number
    size: number
    totalPages: number
  }
  isLoading: boolean
  query: CenterFareQuery
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onEdit: (fare: CenterFare) => void
  onDelete: (fare: CenterFare) => void
  onPolicySettings: (fare: CenterFare) => void
}

export function CenterFareTable({
  data,
  isLoading,
  query,
  onSort,
  onEdit,
  onDelete,
  onPolicySettings,
}: CenterFareTableProps) {
  const handleSort = (field: string) => {
    const newOrder = query.sortBy === field && query.sortOrder === 'asc' ? 'desc' : 'asc'
    onSort(field, newOrder)
  }

  const getSortIcon = (field: string) => {
    if (query.sortBy !== field) return null
    return query.sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    )
  }

  if (isLoading) {
    return <TableSkeleton />
  }

  if (!data?.fares?.length) {
    return <EmptyState />
  }

  return (
    <div className="relative overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label="센터 요율 목록">
          <thead className="bg-gradient-to-r from-gray-50 to-slate-50 border-b-2 border-gray-200">
            <tr>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                onClick={() => handleSort('centerName')}
                role="columnheader"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSort('centerName')
                  }
                }}
                aria-sort={query.sortBy === 'centerName' ? (query.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                aria-label="센터명으로 정렬"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  센터명
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    {getSortIcon('centerName') || <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                onClick={() => handleSort('vehicleTypeName')}
                role="columnheader"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSort('vehicleTypeName')
                  }
                }}
                aria-sort={query.sortBy === 'vehicleTypeName' ? (query.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                aria-label="차량 타입으로 정렬"
              >
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  차량 타입
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    {getSortIcon('vehicleTypeName') || <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                onClick={() => handleSort('regionName')}
                role="columnheader"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSort('regionName')
                  }
                }}
                aria-sort={query.sortBy === 'regionName' ? (query.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                aria-label="배송 지역으로 정렬"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  배송 지역
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    {getSortIcon('regionName') || <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                onClick={() => handleSort('baseFare')}
                role="columnheader"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSort('baseFare')
                  }
                }}
                aria-sort={query.sortBy === 'baseFare' ? (query.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                aria-label="기본료로 정렬"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  기본료
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    {getSortIcon('baseFare') || <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />}
                  </div>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  상태
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                onClick={() => handleSort('createdAt')}
                role="columnheader"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSort('createdAt')
                  }
                }}
                aria-sort={query.sortBy === 'createdAt' ? (query.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                aria-label="등록일로 정렬"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  등록일
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    {getSortIcon('createdAt') || <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />}
                  </div>
                </div>
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700" role="columnheader">
                <PermissionGate resource="centerFares" action="update">
                  작업
                </PermissionGate>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.fares.map((fare, index) => (
              <tr 
                key={fare.id} 
                className="group hover:bg-blue-50/50 transition-colors duration-200"
              >
                <td className="px-6 py-4" role="cell">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center" aria-hidden="true">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{fare.centerName}</div>
                      <div className="text-xs text-gray-500">물류센터</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                      <Truck className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{fare.vehicleTypeName}</div>
                      <div className="text-xs text-gray-500">차량</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{fare.regionName}</div>
                      <div className="text-xs text-gray-500">배송지역</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold text-green-600">₩{formatNumber(fare.baseFare)}</div>
                    <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                      기본료
                    </Badge>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    variant={fare.status === 'active' ? 'default' : 'secondary'}
                    className={`font-medium ${
                      fare.status === 'active' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      fare.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    {fare.status === 'active' ? '활성' : '비활성'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    {new Date(fare.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <PermissionGate resource="centerFares" action="update">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-9 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100"
                          aria-label={`${fare.centerName} ${fare.vehicleTypeName} 요율 작업 메뉴 열기`}
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-0 bg-white" role="menu">
                        <DropdownMenuItem 
                          onClick={() => onEdit(fare)}
                          className="rounded-lg hover:bg-blue-50 focus:bg-blue-50 cursor-pointer p-3"
                          role="menuitem"
                        >
                          <Edit className="h-4 w-4 mr-3 text-blue-600" aria-hidden="true" />
                          <span className="font-medium">요율 수정</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onPolicySettings(fare)}
                          className="rounded-lg hover:bg-purple-50 focus:bg-purple-50 cursor-pointer p-3"
                          role="menuitem"
                        >
                          <Settings className="h-4 w-4 mr-3 text-purple-600" aria-hidden="true" />
                          <span className="font-medium">정책 설정</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem 
                          onClick={() => onDelete(fare)}
                          className="rounded-lg hover:bg-red-50 focus:bg-red-50 cursor-pointer p-3 text-red-600 focus:text-red-600"
                          role="menuitem"
                        >
                          <Trash2 className="h-4 w-4 mr-3" aria-hidden="true" />
                          <span className="font-medium">요율 삭제</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </PermissionGate>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {/* Header Skeleton */}
      <div className="flex space-x-4 pb-4 border-b">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-6 flex-1 rounded-lg" />
        ))}
      </div>
      
      {/* Rows Skeleton */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex space-x-4 items-center py-4">
          <div className="flex items-center space-x-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex items-center space-x-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <div className="flex items-center space-x-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 flex-1" />
          <Skeleton className="h-6 w-16 flex-1" />
          <Skeleton className="h-4 w-16 flex-1" />
          <Skeleton className="h-8 w-8 flex-1 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mb-6">
        <DollarSign className="h-12 w-12 text-blue-600" />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">등록된 요율이 없습니다</h3>
      <p className="text-gray-500 text-center mb-8 max-w-md">
        아직 등록된 센터 요율이 없습니다. 새로운 요율을 등록하여 요율 관리를 시작하세요.
      </p>
      
      <PermissionGate resource="centerFares" action="create">
        <Button className="h-12 px-6 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg" aria-label="첫 번째 센터 요율 등록하기">
          <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
          첫 번째 요율 등록하기
        </Button>
      </PermissionGate>
      
      <div className="mt-8 text-sm text-gray-400">
        💡 팁: 요율은 센터, 차량 타입, 지역별로 구분하여 관리됩니다
      </div>
    </div>
  )
}
