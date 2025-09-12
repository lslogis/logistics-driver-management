'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, User, X, Check } from 'lucide-react'
import { DriverResponse } from '@/lib/validations/driver'

interface DriverSelectorProps {
  value?: string
  onChange: (driverId: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  label?: string
  className?: string
}

// Mock hook for drivers - replace with actual hook when available
const useDrivers = () => {
  const [drivers, setDrivers] = useState<DriverResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Mock data for demonstration
  useEffect(() => {
    const mockDrivers: DriverResponse[] = [
      {
        id: '1',
        name: '김철수',
        phone: '010-1234-5678',
        vehicleNumber: '12가1234',
        businessName: '철수운송',
        representative: '김철수',
        businessNumber: '123-45-67890',
        bankName: '국민은행',
        accountNumber: '123456-78-901234',
        remarks: null,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: '박영희',
        phone: '010-2345-6789',
        vehicleNumber: '34나5678',
        businessName: '영희물류',
        representative: '박영희',
        businessNumber: '234-56-78901',
        bankName: '신한은행',
        accountNumber: '234567-89-012345',
        remarks: null,
        isActive: true,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      },
      {
        id: '3',
        name: '이민수',
        phone: '010-3456-7890',
        vehicleNumber: '56다7890',
        businessName: null,
        representative: null,
        businessNumber: null,
        bankName: '우리은행',
        accountNumber: '345678-90-123456',
        remarks: '경력 10년',
        isActive: true,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z'
      }
    ]
    setDrivers(mockDrivers)
  }, [])
  
  return { data: { drivers }, isLoading }
}

export default function DriverSelector({
  value,
  onChange,
  placeholder = '기사를 선택하세요...',
  disabled = false,
  error,
  required = false,
  label,
  className = ''
}: DriverSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<DriverResponse | null>(null)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const { data, isLoading } = useDrivers()
  const drivers = data?.drivers || []
  
  // Find selected driver when value changes
  useEffect(() => {
    if (value) {
      const driver = drivers.find(d => d.id === value)
      setSelectedDriver(driver || null)
    } else {
      setSelectedDriver(null)
    }
  }, [value, drivers])
  
  // Filter drivers based on search term
  const filteredDrivers = drivers.filter(driver => {
    if (!searchTerm) return driver.isActive
    
    const search = searchTerm.toLowerCase()
    return driver.isActive && (
      driver.name.toLowerCase().includes(search) ||
      driver.phone.includes(search) ||
      driver.vehicleNumber.toLowerCase().includes(search) ||
      (driver.businessName && driver.businessName.toLowerCase().includes(search))
    )
  })
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])
  
  const handleSelect = (driver: DriverResponse) => {
    setSelectedDriver(driver)
    onChange(driver.id)
    setIsOpen(false)
    setSearchTerm('')
  }
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedDriver(null)
    onChange(undefined)
    setSearchTerm('')
  }
  
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Selector Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 border rounded-md bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center flex-1 min-w-0">
          {selectedDriver ? (
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {selectedDriver.name}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {selectedDriver.phone} • {selectedDriver.vehicleNumber}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-500">
              <User className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {selectedDriver && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-md"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="기사명, 연락처, 차량번호로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Driver List */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                로딩 중...
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? '검색 결과가 없습니다' : '등록된 기사가 없습니다'}
              </div>
            ) : (
              filteredDrivers.map((driver) => (
                <button
                  key={driver.id}
                  type="button"
                  onClick={() => handleSelect(driver)}
                  className={`
                    w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0
                    flex items-center justify-between group
                    ${selectedDriver?.id === driver.id ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 truncate">
                          {driver.name}
                        </span>
                        {driver.businessName && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {driver.businessName}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {driver.phone} • {driver.vehicleNumber}
                      </div>
                      {driver.remarks && (
                        <div className="text-xs text-gray-400 truncate mt-1">
                          {driver.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedDriver?.id === driver.id && (
                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
          
          {/* No Selection Option */}
          {!required && (
            <>
              <div className="border-t border-gray-200" />
              <button
                type="button"
                onClick={() => {
                  setSelectedDriver(null)
                  onChange(undefined)
                  setIsOpen(false)
                  setSearchTerm('')
                }}
                className="w-full text-left p-3 hover:bg-gray-50 text-gray-500"
              >
                선택 안함
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}