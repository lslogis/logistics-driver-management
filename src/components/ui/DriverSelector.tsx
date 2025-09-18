'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, User, X, Check } from 'lucide-react'
import { DriverResponse } from '@/lib/validations/driver'

interface DriverSelectorProps {
  value?: string
  onChange?: (driverId: string | undefined) => void
  onValueChange?: (driverId: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  label?: string
  className?: string
}

import { useDrivers, useDriver } from '@/hooks/useDrivers'

function DriverSelector({
  value,
  onChange,
  onValueChange,
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Load drivers - use search term if provided, otherwise load all
  const { data, isLoading } = useDrivers(searchTerm, 'active')
  
  // Load specific driver if not found in list
  const { data: specificDriver } = useDriver(value, !!value && !selectedDriver)
  
  const drivers = useMemo(() => {
    const allDrivers = data?.pages?.flatMap(page => page.drivers) || []
    const activeDrivers = allDrivers.filter(driver => driver.isActive)
    
    // If we have a specific driver loaded that's not in the list, add it
    if (specificDriver && !activeDrivers.find(d => d.id === specificDriver.id)) {
      return [specificDriver, ...activeDrivers]
    }
    
    return activeDrivers
  }, [data, specificDriver])
  
  // Sync selected driver from value
  useEffect(() => {
    if (!value || value === '') {
      if (selectedDriver) setSelectedDriver(null)
      return
    }
    
    // If already selected, keep it
    if (selectedDriver?.id === value) return
    
    // Only search if we have drivers loaded
    if (drivers.length > 0) {
      const driver = drivers.find(d => d.id === value)
      if (driver && driver.id !== selectedDriver?.id) {
        setSelectedDriver(driver)
      }
    }
  }, [value, drivers, selectedDriver])
  
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
  
  // Calculate dropdown position when opening
  const updateDropdownPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      updateDropdownPosition()
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])
  
  const handleSelect = (driver: DriverResponse) => {
    // Always select on click; deselect only via X button
    setSelectedDriver(driver)
    if (onValueChange) {
      onValueChange(driver.id)
    }
    if (onChange) {
      onChange(driver.id)
    }
    setIsOpen(false)
    setSearchTerm('')
  }
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedDriver(null)
    if (onValueChange) {
      onValueChange('')
    }
    if (onChange) {
      onChange(undefined)
    }
    setSearchTerm('')
  }
  
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }
  
  return (
    <div className={`relative ${className}`} ref={containerRef}>
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
            <div
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClear(e as any)
                }
              }}
              className="p-1 hover:bg-gray-100 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </div>
          )}
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Dropdown Portal */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            minWidth: dropdownPosition.width
          }}
        >
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
                <div
                  key={driver.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(driver)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSelect(driver)
                    }
                  }}
                  className={`
                    w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0
                    flex items-center justify-between group cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
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
                </div>
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
                  if (onValueChange) {
                    onValueChange('')
                  }
                  if (onChange) {
                    onChange(undefined)
                  }
                  setIsOpen(false)
                  setSearchTerm('')
                }}
                className="w-full text-left p-3 hover:bg-gray-50 text-gray-500"
              >
                선택 안함
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

export { DriverSelector }
export default DriverSelector
