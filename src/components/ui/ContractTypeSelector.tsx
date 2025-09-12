'use client'

import React from 'react'
import { CONTRACT_TYPES, ContractType, getContractTypeColor } from '@/lib/validations/fixedRoute'
import { FileText, Calendar, Building2 } from 'lucide-react'

interface ContractTypeSelectorProps {
  value?: ContractType
  onChange: (contractType: ContractType) => void
  disabled?: boolean
  error?: string
  required?: boolean
  label?: string
  className?: string
}

// Contract type icons mapping
const getContractTypeIcon = (contractType: ContractType) => {
  switch (contractType) {
    case 'DAILY':
      return <FileText className="h-5 w-5" />
    case 'MONTHLY':
      return <Calendar className="h-5 w-5" />
    case 'COMPLETE':
      return <Building2 className="h-5 w-5" />
    default:
      return <FileText className="h-5 w-5" />
  }
}

export default function ContractTypeSelector({
  value,
  onChange,
  disabled = false,
  error,
  required = false,
  label = '계약형태',
  className = ''
}: ContractTypeSelectorProps) {
  return (
    <div className={className}>
      {label && (
        <legend className="block text-sm font-medium text-gray-700 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </legend>
      )}
      
      <div className="space-y-3">
        {CONTRACT_TYPES.map((contractType) => (
          <label
            key={contractType.value}
            className={`
              relative flex cursor-pointer rounded-lg border p-4 focus:outline-none
              ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-400'}
              ${value === contractType.value 
                ? 'border-blue-600 ring-2 ring-blue-600 bg-blue-50' 
                : 'border-gray-300'
              }
              ${error ? 'border-red-500' : ''}
            `}
          >
            <input
              type="radio"
              name="contractType"
              value={contractType.value}
              checked={value === contractType.value}
              onChange={(e) => onChange(e.target.value as ContractType)}
              disabled={disabled}
              className="sr-only"
            />
            
            <div className="flex items-start space-x-3 w-full">
              {/* Icon */}
              <div className={`
                flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg
                ${value === contractType.value 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {getContractTypeIcon(contractType.value)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`
                    text-sm font-medium
                    ${value === contractType.value ? 'text-blue-900' : 'text-gray-900'}
                  `}>
                    {contractType.label}
                  </h3>
                  
                  {/* Radio Circle */}
                  <div className={`
                    h-4 w-4 rounded-full border-2 flex items-center justify-center
                    ${value === contractType.value 
                      ? 'border-blue-600 bg-blue-600' 
                      : 'border-gray-300'
                    }
                  `}>
                    {value === contractType.value && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                
                <p className={`
                  text-sm mt-1
                  ${value === contractType.value ? 'text-blue-700' : 'text-gray-500'}
                `}>
                  {contractType.description}
                </p>
                
                {/* Additional info based on contract type */}
                <div className={`
                  text-xs mt-2 px-2 py-1 rounded-md inline-block
                  ${getContractTypeColor(contractType.value)}
                `}>
                  {contractType.value === 'DAILY' && '회별 운행 기준 정산'}
                  {contractType.value === 'MONTHLY' && '월정액 + 추가 운행 정산'}
                  {contractType.value === 'COMPLETE' && '월 고정 지입료'}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {/* Help text */}
      <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
        <div className="font-medium mb-2">계약형태별 설명:</div>
        <ul className="space-y-1">
          <li><span className="font-medium text-blue-600">고정회별:</span> 일일 운행 횟수에 따라 운임 계산</li>
          <li><span className="font-medium text-green-600">고정월별:</span> 월 기본료 + 운행 횟수에 따른 추가 운임</li>
          <li><span className="font-medium text-purple-600">고정지입:</span> 월 단위 완전 지입 계약 (고정료 지급)</li>
        </ul>
      </div>
    </div>
  )
}