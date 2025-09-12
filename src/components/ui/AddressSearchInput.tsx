'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

// 카카오 주소 검색 결과 인터페이스
interface KakaoAddressResult {
  place_name: string
  address_name: string
  road_address_name: string
  category_name: string
  phone: string
  place_url: string
  distance: string
  x: string // 경도
  y: string // 위도
}

interface KakaoSearchResponse {
  documents: KakaoAddressResult[]
  meta: {
    total_count: number
    pageable_count: number
    is_end: boolean
  }
}

export interface SelectedAddress {
  placeName: string
  lotAddress: string
  roadAddress: string
  phone?: string
}

interface AddressSearchInputProps {
  lotAddress: string
  roadAddress: string
  onAddressSelect: (address: SelectedAddress) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export default function AddressSearchInput({
  lotAddress,
  roadAddress,
  onAddressSelect,
  placeholder = '주소를 검색하세요',
  label = '주소 검색',
  required = false,
  disabled = false,
  className
}: AddressSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<KakaoAddressResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 클릭 외부 영역 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 카카오 주소 검색 API 호출 (프록시를 통해)
  const searchKakaoAddress = async (keyword: string) => {
    if (!keyword.trim() || keyword.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/kakao/search?query=${encodeURIComponent(keyword)}&size=10`
      )

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`)
      }

      const data: KakaoSearchResponse = await response.json()
      setSearchResults(data.documents)
      setIsDropdownOpen(true)
    } catch (err) {
      console.error('주소 검색 실패:', err)
      setError('주소 검색에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 검색어 입력 핸들러 (디바운싱)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchKakaoAddress(searchTerm)
      } else {
        setSearchResults([])
        setIsDropdownOpen(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setError(null)
  }

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setIsDropdownOpen(true)
    }
  }

  const handleAddressSelect = (result: KakaoAddressResult) => {
    const selectedAddress: SelectedAddress = {
      placeName: result.place_name,
      lotAddress: result.address_name,
      roadAddress: result.road_address_name || result.address_name,
      phone: result.phone || undefined
    }

    onAddressSelect(selectedAddress)
    setSearchTerm('')
    setIsDropdownOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    onAddressSelect({
      placeName: '',
      lotAddress: '',
      roadAddress: '',
      phone: undefined
    })
    setSearchTerm('')
    setSearchResults([])
    setIsDropdownOpen(false)
    inputRef.current?.focus()
  }

  const hasAddress = lotAddress || roadAddress

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <Label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      {/* 검색 입력 */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-10 pr-10"
          />
          {(searchTerm || hasAddress) && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 검색 결과 드롭다운 */}
        {isDropdownOpen && !disabled && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto"
          >
            {/* 로딩 상태 */}
            {isSearching && (
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                주소 검색 중...
              </div>
            )}

            {/* 오류 상태 */}
            {error && (
              <div className="px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* 검색 결과 없음 */}
            {!isSearching && !error && searchTerm && searchResults.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500">
                검색 결과가 없습니다
              </div>
            )}

            {/* 검색 결과 목록 */}
            {!isSearching && !error && searchResults.map((result, index) => (
              <button
                key={`${result.place_name}-${index}`}
                type="button"
                onClick={() => handleAddressSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.place_name}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {result.road_address_name && (
                        <div className="truncate">{result.road_address_name}</div>
                      )}
                      <div className="truncate text-gray-500">
                        {result.address_name}
                      </div>
                      {result.category_name && (
                        <div className="text-blue-600 truncate mt-0.5">
                          {result.category_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 선택된 주소 표시 */}
      {hasAddress && (
        <div className="space-y-2">
          <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-md">
            <MapPin className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1 text-sm">
              {roadAddress && (
                <div className="font-medium text-gray-900 mb-1">
                  <span className="text-xs text-blue-600 mr-2">도로명</span>
                  {roadAddress}
                </div>
              )}
              {lotAddress && (
                <div className="text-gray-700">
                  <span className="text-xs text-gray-500 mr-2">지번</span>
                  {lotAddress}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="p-1 hover:bg-blue-100 rounded text-blue-400 hover:text-blue-600 ml-2"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}