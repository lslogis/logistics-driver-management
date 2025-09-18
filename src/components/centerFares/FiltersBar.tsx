'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  X, 
  Filter, 
  RotateCcw, 
  Settings2, 
  Building2, 
  Truck, 
  MapPin, 
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { CenterFareQuery } from '@/lib/api/center-fares'
import { VEHICLE_TYPE_OPTIONS } from '@/lib/utils/vehicle-types'
import { useDebounce } from '@/hooks/useDebounce'

interface FiltersBarProps {
  onFiltersChange: (filters: Partial<CenterFareQuery>) => void
  activeFilters: CenterFareQuery
}

export function FiltersBar({ onFiltersChange, activeFilters }: FiltersBarProps) {
  const [searchTerm, setSearchTerm] = useState(activeFilters.q || '')
  const [isExpanded, setIsExpanded] = useState(false)
  const debouncedSearch = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (debouncedSearch !== activeFilters.q) {
      onFiltersChange({ q: debouncedSearch || undefined })
    }
  }, [debouncedSearch, activeFilters.q, onFiltersChange])

  const handleClearFilters = () => {
    setSearchTerm('')
    onFiltersChange({
      q: undefined,
      centerId: undefined,
      vehicleTypeId: undefined,
      regionId: undefined,
      status: undefined,
    })
  }

  const handleClearSpecificFilter = (filterKey: keyof CenterFareQuery) => {
    if (filterKey === 'q') {
      setSearchTerm('')
    }
    onFiltersChange({ [filterKey]: undefined })
  }

  const hasActiveFilters = !!(
    activeFilters.q ||
    activeFilters.centerId ||
    activeFilters.vehicleTypeId ||
    activeFilters.regionId ||
    activeFilters.status
  )

  const activeFilterCount = [
    activeFilters.q,
    activeFilters.centerId,
    activeFilters.vehicleTypeId,
    activeFilters.regionId,
    activeFilters.status,
  ].filter(Boolean).length

  return (
    <Card className="border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header with Search and Toggle */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="센터명, 차량 타입, 지역명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-12 pr-4 text-base rounded-xl border-2 focus:border-blue-500 transition-colors bg-white"
                aria-label="센터 요율 검색"
                role="searchbox"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    onFiltersChange({ q: undefined })
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                  aria-label="검색어 지우기"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-12 px-4 rounded-xl border-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
              aria-expanded={isExpanded}
              aria-controls="filters-panel"
              aria-label={`필터 옵션 ${isExpanded ? '닫기' : '열기'}`}
            >
              <Filter className="h-5 w-5" aria-hidden="true" />
              <span className="font-medium">필터</span>
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 bg-blue-600 text-white min-w-[20px] h-5 text-xs" aria-label={`${activeFilterCount}개 필터 적용됨`}>
                  {activeFilterCount}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 ml-1" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" aria-hidden="true" />
              )}
            </Button>

            {/* Clear All Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="h-12 px-4 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-2"
                aria-label="모든 필터 초기화"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">초기화</span>
              </Button>
            )}
          </div>

          {/* Expanded Filter Options */}
          {isExpanded && (
            <>
              <Separator className="border-gray-200" />
              <div className="space-y-6" id="filters-panel" role="region" aria-label="상세 필터 옵션">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Settings2 className="h-4 w-4" aria-hidden="true" />
                  상세 필터 옵션
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <ToggleLeft className="h-4 w-4 text-gray-500" />
                      활성 상태
                    </label>
                    <Select
                      value={activeFilters.status || 'all'}
                      onValueChange={(value) => onFiltersChange({ 
                        status: value === 'all' ? undefined : value as 'active' | 'inactive' 
                      })}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-2 focus:border-blue-500 transition-colors" aria-label="활성 상태 선택">
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">전체 상태</SelectItem>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <ToggleRight className="h-4 w-4 text-green-600" />
                            활성
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                            비활성
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Center Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      물류 센터
                    </label>
                    <Select
                      value={activeFilters.centerId || 'all'}
                      onValueChange={(value) => onFiltersChange({ 
                        centerId: value === 'all' ? undefined : value 
                      })}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-2 focus:border-blue-500 transition-colors" aria-label="물류 센터 선택">
                        <SelectValue placeholder="센터 선택" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">전체 센터</SelectItem>
                        <SelectItem value="center-1">서울물류센터</SelectItem>
                        <SelectItem value="center-2">부산물류센터</SelectItem>
                        <SelectItem value="center-3">대구물류센터</SelectItem>
                        <SelectItem value="center-4">인천물류센터</SelectItem>
                        <SelectItem value="center-5">광주물류센터</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Vehicle Type Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-500" />
                      차량 타입
                    </label>
                    <Select
                      value={activeFilters.vehicleTypeId || 'all'}
                      onValueChange={(value) => onFiltersChange({ 
                        vehicleTypeId: value === 'all' ? undefined : value 
                      })}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-2 focus:border-blue-500 transition-colors" aria-label="차량 타입 선택">
                        <SelectValue placeholder="차량 선택" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">전체 차량</SelectItem>
                        {VEHICLE_TYPE_OPTIONS.map(vehicleType => (
                          <SelectItem key={vehicleType.id} value={vehicleType.id}>
                            {vehicleType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Region Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      배송 지역
                    </label>
                    <Select
                      value={activeFilters.regionId || 'all'}
                      onValueChange={(value) => onFiltersChange({ 
                        regionId: value === 'all' ? undefined : value 
                      })}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-2 focus:border-blue-500 transition-colors" aria-label="배송 지역 선택">
                        <SelectValue placeholder="지역 선택" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">전체 지역</SelectItem>
                        <SelectItem value="region-1">서울특별시</SelectItem>
                        <SelectItem value="region-2">부산광역시</SelectItem>
                        <SelectItem value="region-3">대구광역시</SelectItem>
                        <SelectItem value="region-4">인천광역시</SelectItem>
                        <SelectItem value="region-5">광주광역시</SelectItem>
                        <SelectItem value="region-6">대전광역시</SelectItem>
                        <SelectItem value="region-7">울산광역시</SelectItem>
                        <SelectItem value="region-8">경기도</SelectItem>
                        <SelectItem value="region-9">강원도</SelectItem>
                        <SelectItem value="region-10">충청남도</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <>
              <Separator className="border-gray-200" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">적용된 필터:</span>
                  <Badge variant="outline" className="text-xs">
                    {activeFilterCount}개 활성
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {activeFilters.q && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <Search className="h-3 w-3" />
                      <span className="text-sm font-medium">검색: {activeFilters.q}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearSpecificFilter('q')}
                        className="h-4 w-4 p-0 hover:bg-blue-200 rounded"
                        aria-label="검색 필터 제거"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </Badge>
                  )}
                  
                  {activeFilters.status && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      {activeFilters.status === 'active' ? (
                        <ToggleRight className="h-3 w-3" />
                      ) : (
                        <ToggleLeft className="h-3 w-3" />
                      )}
                      <span className="text-sm font-medium">
                        상태: {activeFilters.status === 'active' ? '활성' : '비활성'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearSpecificFilter('status')}
                        className="h-4 w-4 p-0 hover:bg-green-200 rounded"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  
                  {activeFilters.centerId && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      <Building2 className="h-3 w-3" />
                      <span className="text-sm font-medium">센터: {activeFilters.centerId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearSpecificFilter('centerId')}
                        className="h-4 w-4 p-0 hover:bg-purple-200 rounded"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  
                  {activeFilters.vehicleTypeId && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                    >
                      <Truck className="h-3 w-3" />
                      <span className="text-sm font-medium">차량: {activeFilters.vehicleTypeId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearSpecificFilter('vehicleTypeId')}
                        className="h-4 w-4 p-0 hover:bg-orange-200 rounded"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  
                  {activeFilters.regionId && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors"
                    >
                      <MapPin className="h-3 w-3" />
                      <span className="text-sm font-medium">지역: {activeFilters.regionId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearSpecificFilter('regionId')}
                        className="h-4 w-4 p-0 hover:bg-teal-200 rounded"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}