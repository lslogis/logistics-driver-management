'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Truck, Check } from 'lucide-react'
import { VEHICLE_TYPES, VehicleType } from '@/lib/validations/fixedRoute'

interface VehicleTypeSelectorProps {
  value?: VehicleType
  onChange: (vehicleType: VehicleType) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  label?: string
  className?: string
}

export default function VehicleTypeSelector({
  value,
  onChange,
  placeholder = '차종을 선택하세요...',
  disabled = false,
  error,
  required = false,
  label,
  className = ''
}: VehicleTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const selectedVehicleType = VEHICLE_TYPES.find(vt => vt.value === value)
  
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
  
  const handleSelect = (vehicleType: VehicleType) => {
    onChange(vehicleType)
    setIsOpen(false)
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
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
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
        </div>
      )}
    </div>
  )
}

// Helper function to get vehicle type description
const getVehicleTypeDescription = (vehicleType: VehicleType): string => {
  switch (vehicleType) {
    case '5TON':
      return '5톤 화물차'
    case '8TON':
      return '8톤 화물차'
    case '11TON':
      return '11톤 화물차'
    case '15TON':
      return '15톤 화물차'
    case '25TON':
      return '25톤 대형 화물차'
    case 'TRAILER':
      return '트레일러 (견인차)'
    case 'CARGO':
      return '카고트럭'
    case 'WING':
      return '윙바디 (적재함)'
    case 'REFRIGERATED':
      return '냉동/냉장 화물차'
    case 'TANK':
      return '탱크로리 (액체 운반)'
    case 'OTHER':
      return '기타 차종'
    default:
      return '차종 정보'
  }
}