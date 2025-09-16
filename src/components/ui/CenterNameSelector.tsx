'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Building2, ChevronDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingPointSuggestion } from '@/hooks/useLoadingPoints'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

// 센터명 목록을 상차지에서 가져오는 훅 (임시로 mock 데이터 사용)
const useCenterNames = () => {
  // 실제로는 상차지 API에서 centerName들을 가져와야 함
  const mockCenterNames = [
    '서울물류센터',
    '부산물류센터', 
    '대구물류센터',
    '인천냉동센터',
    '광주공단센터',
    '대전배송센터',
    '울산항만센터',
    '안양통합센터'
  ]
  
  return {
    data: mockCenterNames,
    isLoading: false
  }
}

interface CenterNameSelectorProps {
  value?: string
  onChange: (centerName: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
  error?: string
}

export default function CenterNameSelector({
  value,
  onChange,
  placeholder = '센터명을 선택하세요',
  label,
  required = false,
  disabled = false,
  className,
  error
}: CenterNameSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: centerNames = [], isLoading } = useCenterNames()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    setIsOpen(true)
    
    // Clear selection if input is cleared
    if (!newValue && value) {
      onChange('')
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    if (value) {
      setSearchTerm('')
    }
  }

  const handleSelect = (centerName: string) => {
    onChange(centerName)
    setSearchTerm('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    onChange('')
    setSearchTerm('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const displayValue = value || searchTerm

  const filteredCenterNames = centerNames.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={cn('relative', className)}>
      {label && (
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
              'pl-10 pr-16',
              value && 'text-gray-900 font-medium',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              disabled={disabled}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className={cn(
                'h-4 w-4 transition-transform',
                isOpen && 'rotate-180'
              )} />
            </button>
          </div>
        </div>

        {isOpen && !disabled && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {/* Loading state */}
            {isLoading && (
              <div className="px-3 py-2 text-sm text-gray-500">
                불러오는 중...
              </div>
            )}

            {/* No results */}
            {!isLoading && filteredCenterNames.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchTerm ? '검색 결과가 없습니다' : '센터명이 없습니다'}
              </div>
            )}

            {/* Center names */}
            {filteredCenterNames.map((centerName) => (
              <button
                key={centerName}
                type="button"
                onClick={() => handleSelect(centerName)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between"
              >
                <div className="text-sm font-medium text-gray-900">
                  {centerName}
                </div>
                {value === centerName && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}