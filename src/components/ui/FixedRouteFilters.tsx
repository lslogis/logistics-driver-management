'use client'

import React from 'react'
import { Filter, X } from 'lucide-react'
import { 
  CONTRACT_TYPES, 
  ContractType,
  getContractTypeLabel
} from '@/lib/validations/fixedRoute'
import DriverSelector from './DriverSelector'
import CenterNameSelector from './CenterNameSelector'

interface FixedRouteFiltersProps {
  filters: {
    search: string
    centerName: string | undefined
    isActive: boolean | undefined
    contractType: ContractType | undefined
    assignedDriverId: string | undefined
    weekday: number | undefined
  }
  onFiltersChange: (filters: any) => void
  onClearFilters: () => void
}

export default function FixedRouteFilters({
  filters,
  onFiltersChange,
  onClearFilters
}: FixedRouteFiltersProps) {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  )

  const activeFilterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && value !== null
  ).length

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900">고급 필터</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFilterCount}개 적용
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
            <span>필터 초기화</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            검색
          </label>
          <input
            type="text"
            placeholder="노선명, 센터명, 기사명으로 검색..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Center Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            센터명
          </label>
          <CenterNameSelector
            value={filters.centerName}
            onChange={(centerName) => updateFilter('centerName', centerName || undefined)}
            placeholder="센터 선택"
            className="text-sm"
          />
        </div>

        {/* Contract Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            계약형태
          </label>
          <select
            value={filters.contractType || ''}
            onChange={(e) => updateFilter('contractType', e.target.value || undefined)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체</option>
            {CONTRACT_TYPES.map(ct => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </select>
        </div>


        {/* Weekday */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            요일
          </label>
          <select
            value={filters.weekday?.toString() || ''}
            onChange={(e) => updateFilter('weekday', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체</option>
            <option value="0">일요일</option>
            <option value="1">월요일</option>
            <option value="2">화요일</option>
            <option value="3">수요일</option>
            <option value="4">목요일</option>
            <option value="5">금요일</option>
            <option value="6">토요일</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            상태
          </label>
          <select
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={(e) => {
              updateFilter('isActive', e.target.value === '' ? undefined : e.target.value === 'true')
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체</option>
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
        </div>
      </div>

      {/* Driver Selector - Full Width */}
      <div>
        <DriverSelector
          label="배정 기사"
          value={filters.assignedDriverId}
          onChange={(driverId) => updateFilter('assignedDriverId', driverId)}
          placeholder="기사를 선택하세요 (전체 보기)"
          className="max-w-md"
        />
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">적용된 필터:</span>
            
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                검색: &quot;{filters.search}&quot;
                <button
                  onClick={() => updateFilter('search', '')}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.contractType && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                계약: {getContractTypeLabel(filters.contractType)}
                <button
                  onClick={() => updateFilter('contractType', undefined)}
                  className="ml-1 text-blue-400 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.centerName && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                센터: {filters.centerName}
                <button
                  onClick={() => updateFilter('centerName', undefined)}
                  className="ml-1 text-green-400 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.weekday !== undefined && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                요일: {['일', '월', '화', '수', '목', '금', '토'][filters.weekday]}요일
                <button
                  onClick={() => updateFilter('weekday', undefined)}
                  className="ml-1 text-purple-400 hover:text-purple-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.isActive !== undefined && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                상태: {filters.isActive ? '활성' : '비활성'}
                <button
                  onClick={() => updateFilter('isActive', undefined)}
                  className="ml-1 text-yellow-400 hover:text-yellow-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.assignedDriverId && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                기사 선택됨
                <button
                  onClick={() => updateFilter('assignedDriverId', undefined)}
                  className="ml-1 text-indigo-400 hover:text-indigo-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}