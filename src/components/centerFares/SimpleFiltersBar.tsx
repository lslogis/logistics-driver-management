'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Search } from 'lucide-react'
import { useCenters } from '@/hooks/useCenters'

interface SimpleFiltersBarProps {
  onFilterChange: (filters: { center?: string; fareType?: string; searchText?: string }) => void
}

export function SimpleFiltersBar({ onFilterChange }: SimpleFiltersBarProps) {
  const [selectedCenter, setSelectedCenter] = useState<string>('')
  const [selectedFareType, setSelectedFareType] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  
  const { getCenterNames } = useCenters()
  const centerOptions = getCenterNames

  const fareTypeOptions = [
    '기본운임',
    '경유+지역'
  ]

  const updateFilters = (center?: string, fareType?: string, search?: string) => {
    onFilterChange({
      center: center === 'all' ? undefined : center,
      fareType: fareType === 'all' ? undefined : fareType,
      searchText: search?.trim() || undefined
    })
  }

  const handleCenterChange = (value: string) => {
    setSelectedCenter(value)
    updateFilters(value, selectedFareType, searchText)
  }

  const handleFareTypeChange = (value: string) => {
    setSelectedFareType(value)
    updateFilters(selectedCenter, value, searchText)
  }

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    updateFilters(selectedCenter, selectedFareType, value)
  }

  const handleClearFilters = () => {
    setSelectedCenter('')
    setSelectedFareType('')
    setSearchText('')
    onFilterChange({})
  }

  const hasActiveFilters = selectedCenter || selectedFareType || searchText

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">🏢</span>
              <span className="text-sm font-medium text-gray-700">센터:</span>
            </div>
            <Select value={selectedCenter} onValueChange={handleCenterChange}>
              <SelectTrigger className="w-44 h-11 rounded-xl border-2 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="전체 센터" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">전체 센터</SelectItem>
                {centerOptions.map(center => (
                  <SelectItem key={center} value={center}>
                    {center}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">⚡</span>
              <span className="text-sm font-medium text-gray-700">요율종류:</span>
            </div>
            <Select value={selectedFareType} onValueChange={handleFareTypeChange}>
              <SelectTrigger className="w-36 h-11 rounded-xl border-2 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">전체</SelectItem>
                {fareTypeOptions.map(fareType => (
                  <SelectItem key={fareType} value={fareType}>
                    {fareType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">검색:</span>
            </div>
            <Input
              type="text"
              placeholder="차량톤수, 지역 검색..."
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-52 h-11 rounded-xl border-2 focus:border-blue-500 transition-colors"
            />
          </div>

          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearFilters}
              className="h-11 px-4 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium"
            >
              <X className="h-4 w-4 mr-1" />
              필터 초기화
            </Button>
          )}

          {hasActiveFilters && (
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs font-medium text-gray-600">활성 필터:</span>
              <div className="flex gap-2">
                {selectedCenter && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                    센터: {selectedCenter}
                  </span>
                )}
                {selectedFareType && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                    요율: {selectedFareType}
                  </span>
                )}
                {searchText && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                    검색: {searchText}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}