'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingPointCombobox } from '@/components/ui/LoadingPointCombobox'
import { VehicleTypeSelector } from '@/components/ui/VehicleTypeSelector'
import { DriverSelector } from '@/components/ui/DriverSelector'
import { useLoadingPoints } from '@/hooks/useLoadingPoints'
import { useDrivers } from '@/hooks/useDrivers'
import { Search, Filter, X, Calendar } from 'lucide-react'
import { debounce } from 'lodash'
import dayjs from 'dayjs'

export interface CharterFilters {
  search?: string
  centerId?: string
  driverId?: string
  vehicleType?: string
  dateFrom?: string
  dateTo?: string
  isNegotiated?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface CharterFiltersProps {
  filters: CharterFilters
  onFiltersChange: (filters: CharterFilters) => void
  className?: string
}

export function CharterFilters({ filters, onFiltersChange, className }: CharterFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [localSearch, setLocalSearch] = useState(filters.search || '')
  const [isExpanded, setIsExpanded] = useState(false)

  // Debounced search
  const debouncedSearchChange = useMemo(
    () => debounce((value: string) => {
      onFiltersChange({ ...filters, search: value || undefined })
    }, 300),
    [filters, onFiltersChange]
  )

  useEffect(() => {
    debouncedSearchChange(localSearch)
    return () => {
      debouncedSearchChange.cancel()
    }
  }, [localSearch, debouncedSearchChange])

  // Sync URL with filters
  useEffect(() => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.set(key, String(value))
      }
    })

    const newURL = `${window.location.pathname}?${params.toString()}`
    router.replace(newURL, { scroll: false })
  }, [filters, router])

  const handleFilterChange = (key: keyof CharterFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value
    })
  }

  const clearFilters = () => {
    setLocalSearch('')
    onFiltersChange({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => 
      key !== 'sortBy' && 
      key !== 'sortOrder' && 
      value !== undefined && 
      value !== ''
    )
  }, [filters])

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            필터
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                초기화
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? '접기' : '펼치기'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search - Always visible */}
        <div>
          <Label htmlFor="search" className="text-sm font-medium">검색</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search"
              placeholder="기사명, 차량번호, 센터명, 지역 검색..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Expandable filters */}
        {isExpanded && (
          <>
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom" className="text-sm font-medium">시작일</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="dateTo" className="text-sm font-medium">종료일</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">센터</Label>
                <LoadingPointCombobox
                  value={filters.centerId || ''}
                  onValueChange={(value) => handleFilterChange('centerId', value)}
                  placeholder="센터 선택"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">차량 타입</Label>
                <VehicleTypeSelector
                  value={filters.vehicleType as any}
                  onChange={(value) => handleFilterChange('vehicleType', value)}
                  placeholder="차량 타입 선택"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">기사</Label>
                <DriverSelector
                  value={filters.driverId || ''}
                  onValueChange={(value) => handleFilterChange('driverId', value)}
                  placeholder="기사 선택"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">협의금액</Label>
                <Select
                  value={filters.isNegotiated === undefined ? 'all' : filters.isNegotiated.toString()}
                  onValueChange={(value) => handleFilterChange('isNegotiated', value === 'all' ? undefined : value === 'true')}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="true">협의금액</SelectItem>
                    <SelectItem value="false">계산금액</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">정렬 기준</Label>
                <Select
                  value={filters.sortBy || 'createdAt'}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">등록일</SelectItem>
                    <SelectItem value="date">운행일</SelectItem>
                    <SelectItem value="totalFare">받는금액</SelectItem>
                    <SelectItem value="driverFare">주는금액</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">정렬 순서</Label>
                <Select
                  value={filters.sortOrder || 'desc'}
                  onValueChange={(value) => handleFilterChange('sortOrder', value as 'asc' | 'desc')}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">최신순</SelectItem>
                    <SelectItem value="asc">오래된순</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick date filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = dayjs().format('YYYY-MM-DD')
                  handleFilterChange('dateFrom', today)
                  handleFilterChange('dateTo', today)
                }}
              >
                오늘
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = dayjs()
                  handleFilterChange('dateFrom', today.startOf('week').format('YYYY-MM-DD'))
                  handleFilterChange('dateTo', today.endOf('week').format('YYYY-MM-DD'))
                }}
              >
                이번 주
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = dayjs()
                  handleFilterChange('dateFrom', today.startOf('month').format('YYYY-MM-DD'))
                  handleFilterChange('dateTo', today.endOf('month').format('YYYY-MM-DD'))
                }}
              >
                이번 달
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = dayjs()
                  const lastMonth = today.subtract(1, 'month')
                  handleFilterChange('dateFrom', lastMonth.startOf('month').format('YYYY-MM-DD'))
                  handleFilterChange('dateTo', lastMonth.endOf('month').format('YYYY-MM-DD'))
                }}
              >
                지난 달
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
