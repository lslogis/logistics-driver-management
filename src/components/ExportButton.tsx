'use client'

import React, { useState } from 'react'
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportButtonProps {
  onExport: (format: 'excel' | 'csv') => void
  isLoading?: boolean
  variant?: 'button' | 'dropdown'
  className?: string
  label?: string
}

export function ExportButton({ 
  onExport, 
  isLoading = false, 
  variant = 'dropdown',
  className = '',
  label = '내보내기'
}: ExportButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        onClick={() => onExport('excel')}
        disabled={isLoading}
        className={className}
      >
        <Download className="h-4 w-4 mr-2" />
        {isLoading ? '다운로드 중...' : label}
      </Button>
    )
  }

  return (
    <div className="relative inline-block">
      <Button 
        variant="outline" 
        disabled={isLoading}
        className={className}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Download className="h-4 w-4 mr-2" />
        {isLoading ? '다운로드 중...' : label}
        <ChevronDown className="h-4 w-4 ml-1" />
      </Button>
      
      {showDropdown && (
        <div 
          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50"
          onBlur={() => setShowDropdown(false)}
        >
          <div className="py-1">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => {
                onExport('excel')
                setShowDropdown(false)
              }}
              disabled={isLoading}
            >
              <FileSpreadsheet className="h-4 w-4 mr-3 text-green-600" />
              <div className="flex flex-col text-left">
                <span className="font-medium">Excel 파일</span>
                <span className="text-xs text-gray-500">.xlsx 형식</span>
              </div>
            </button>
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => {
                onExport('csv')
                setShowDropdown(false)
              }}
              disabled={isLoading}
            >
              <FileText className="h-4 w-4 mr-3 text-blue-600" />
              <div className="flex flex-col text-left">
                <span className="font-medium">CSV 파일</span>
                <span className="text-xs text-gray-500">.csv 형식</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExportButton