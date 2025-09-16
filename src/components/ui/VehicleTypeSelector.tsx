'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Truck, Check } from 'lucide-react'
// Vehicle type definitions for Charter system
export type VehicleType = 
  | 'TRUCK_1T'
  | 'TRUCK_2_5T' 
  | 'TRUCK_3T'
  | 'TRUCK_5T'
  | 'TRUCK_8T'
  | 'TRUCK_11T'
  | 'VAN'
  | 'SEDAN'
  | 'OTHER'

export const VEHICLE_TYPES: Array<{ value: VehicleType; label: string }> = [
  { value: 'TRUCK_1T', label: '1톤 트럭' },
  { value: 'TRUCK_2_5T', label: '2.5톤 트럭' },
  { value: 'TRUCK_3T', label: '3톤 트럭' },
  { value: 'TRUCK_5T', label: '5톤 트럭' },
  { value: 'TRUCK_8T', label: '8톤 트럭' },
  { value: 'TRUCK_11T', label: '11톤 트럭' },
  { value: 'VAN', label: '승합차' },
  { value: 'SEDAN', label: '승용차' },
  { value: 'OTHER', label: '기타' }
]

interface VehicleTypeSelectorProps {
  value?: VehicleType
  onChange: (vehicleType: VehicleType) => void
  onValueChange?: (vehicleType: VehicleType) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  label?: string
  className?: string
}

function VehicleTypeSelector({
  value,
  onChange,
  onValueChange,
  placeholder = '차종을 선택하세요...',
  disabled = false,
  error,
  required = false,
  label,
  className = ''
}: VehicleTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const selectedVehicleType = VEHICLE_TYPES.find(vt => vt.value === value)
  
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
  
  const handleSelect = (vehicleType: VehicleType) => {
    if (onValueChange) {
      onValueChange(vehicleType)
    }
    onChange(vehicleType)
    setIsOpen(false)
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
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Truck className="h-4 w-4 text-gray-400 flex-shrink-0" />
          {selectedVehicleType ? (
            <span className="font-medium text-gray-900 truncate">
              {selectedVehicleType.label}
            </span>
          ) : (
            <span className="text-gray-500 truncate">{placeholder}</span>
          )}
        </div>
        
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Dropdown Portal */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            minWidth: dropdownPosition.width
          }}
        >
          {VEHICLE_TYPES.map((vehicleType) => (
            <button
              key={vehicleType.value}
              type="button"
              onClick={() => handleSelect(vehicleType.value)}
              className={`
                w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0
                flex items-center justify-between group
                ${value === vehicleType.value ? 'bg-blue-50' : ''}
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center
                  ${value === vehicleType.value 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  <Truck className="h-4 w-4" />
                </div>
                
                <div className="flex-1">
                  <div className={`
                    font-medium
                    ${value === vehicleType.value ? 'text-blue-900' : 'text-gray-900'}
                  `}>
                    {vehicleType.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getVehicleTypeDescription(vehicleType.value)}
                  </div>
                </div>
              </div>
              
              {value === vehicleType.value && (
                <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

// Helper function to get vehicle type description
const getVehicleTypeDescription = (vehicleType: VehicleType): string => {
  switch (vehicleType) {
    case 'TRUCK_1T':
      return '1톤 트럭'
    case 'TRUCK_2_5T':
      return '2.5톤 트럭'
    case 'TRUCK_3T':
      return '3톤 트럭'
    case 'TRUCK_5T':
      return '5톤 트럭'
    case 'TRUCK_8T':
      return '8톤 트럭'
    case 'TRUCK_11T':
      return '11톤 트럭'
    case 'VAN':
      return '승합차'
    case 'SEDAN':
      return '승용차'
    case 'OTHER':
      return '기타'
    default:
      return '알 수 없는 차종'
  }
}

export { VehicleTypeSelector }
export default VehicleTypeSelector