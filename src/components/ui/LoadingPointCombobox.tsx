'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Building2, ChevronDown, Plus, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useLoadingPointSuggestions, 
  useCreateLoadingPoint,
  LoadingPointSuggestion,
  CreateLoadingPointData 
} from '@/hooks/useLoadingPoints'
import AddressSearchInput, { SelectedAddress } from '@/components/ui/AddressSearchInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface LoadingPointComboboxProps {
  value?: string | LoadingPointSuggestion | null
  onChange?: (loadingPoint: LoadingPointSuggestion | null) => void
  onValueChange?: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

function LoadingPointCombobox({
  value,
  onChange,
  onValueChange,
  placeholder = '상차지를 선택하거나 입력하세요',
  label,
  required = false,
  disabled = false,
  className
}: LoadingPointComboboxProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [selectedValue, setSelectedValue] = useState<LoadingPointSuggestion | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: suggestions = [], isLoading } = useLoadingPointSuggestions(
    isOpen ? (searchTerm.length > 0 ? searchTerm : '') : undefined
  )
  
  const createMutation = useCreateLoadingPoint()

  // Update selectedValue when value prop changes
  useEffect(() => {
    if (value && typeof value === 'object') {
      setSelectedValue(value)
    } else if (value && typeof value === 'string') {
      // Try to find matching suggestion for the ID
      const matchingSuggestion = suggestions.find(s => s.id === value)
      if (matchingSuggestion) {
        setSelectedValue(matchingSuggestion)
      }
    } else if (!value) {
      setSelectedValue(null)
    }
  }, [value, suggestions])

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      updateDropdownPosition()
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    setIsOpen(true)
    
    // Clear selection if input is cleared
    if (!newValue) {
      setSelectedValue(null)
      if (onValueChange) {
        onValueChange('')
      }
      if (onChange) {
        onChange(null)
      }
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    if (value) {
      setSearchTerm('')
    }
  }

  const handleSelect = (loadingPoint: LoadingPointSuggestion) => {
    // Store selected value for display
    setSelectedValue(loadingPoint)
    
    // Call onValueChange if provided (for react-hook-form Controller)
    if (onValueChange) {
      onValueChange(loadingPoint.id)
    }
    // Call onChange if provided (for compatibility)
    if (onChange) {
      onChange(loadingPoint)
    }
    setSearchTerm('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setSelectedValue(null)
    if (onValueChange) {
      onValueChange('')
    }
    if (onChange) {
      onChange(null)
    }
    setSearchTerm('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleCreateNew = () => {
    setIsCreateModalOpen(true)
    setIsOpen(false)
  }

  const handleCreateSubmit = (data: CreateLoadingPointData) => {
    createMutation.mutate(data, {
      onSuccess: (newLoadingPoint) => {
        // Convert to suggestion format
        const suggestion: LoadingPointSuggestion = {
          id: newLoadingPoint.id,
          centerName: newLoadingPoint.centerName,
          loadingPointName: newLoadingPoint.loadingPointName
        }
        setSelectedValue(suggestion)
        if (onValueChange) {
          onValueChange(suggestion.id)
        }
        if (onChange) {
          onChange(suggestion)
        }
        setIsCreateModalOpen(false)
        setSearchTerm('')
      }
    })
  }

  // Handle both string (centerId) and object (LoadingPointSuggestion) values
  const displayValue = (() => {
    // If we're searching, show search term
    if (isOpen && searchTerm) return searchTerm
    
    // If we have a stored selected value, show it
    if (selectedValue) {
      return `${selectedValue.centerName} - ${selectedValue.loadingPointName}`
    }
    
    // If value is provided as prop
    if (value) {
      if (typeof value === 'string') {
        // If value is a string (centerId), try to find the matching suggestion
        const matchingSuggestion = suggestions.find(s => s.id === value)
        return matchingSuggestion ? `${matchingSuggestion.centerName} - ${matchingSuggestion.loadingPointName}` : ''
      }
      // If value is an object
      return `${value.centerName} - ${value.loadingPointName}`
    }
    
    return searchTerm
  })()

  const filteredSuggestions = suggestions.filter(suggestion => 
    suggestion.centerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.loadingPointName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={cn('relative', className)}>
      {label && (
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div ref={containerRef} className="relative">
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
              value && 'text-gray-900 font-medium'
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

        {/* Dropdown Portal */}
        {isOpen && !disabled && typeof window !== 'undefined' && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              minWidth: dropdownPosition.width
            }}
          >
            {/* Loading state */}
            {isLoading && searchTerm && (
              <div className="px-3 py-2 text-sm text-gray-500">
                검색 중...
              </div>
            )}

            {/* No results */}
            {!isLoading && searchTerm && filteredSuggestions.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                검색 결과가 없습니다
              </div>
            )}

            {/* Suggestions */}
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {suggestion.centerName} - {suggestion.loadingPointName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {suggestion.centerName}
                  </div>
                </div>
                {((typeof value === 'string' && value === suggestion.id) || 
                  (typeof value === 'object' && value?.id === suggestion.id)) && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}

            {/* Create new option */}
            {searchTerm && !isLoading && (
              <>
                <div className="border-t border-gray-100" />
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center text-sm text-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  &quot;{searchTerm}&quot; 센터 새로 등록
                </button>
              </>
            )}
          </div>,
          document.body
        )}
      </div>

      {/* Create New Loading Point Modal */}
      <CreateLoadingPointModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
        initialName={searchTerm}
      />
    </div>
  )
}

// Create Loading Point Modal Component
interface CreateLoadingPointModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateLoadingPointData) => void
  isLoading: boolean
  initialName: string
}

function CreateLoadingPointModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  initialName
}: CreateLoadingPointModalProps) {
  const [formData, setFormData] = useState({
    centerName: initialName,
    loadingPointName: '',
    lotAddress: '',
    roadAddress: '',
    manager1: '',
    manager2: '',
    phone1: '',
    phone2: ''
  })

  const handleAddressSelect = (address: SelectedAddress) => {
    setFormData(prev => ({
      ...prev,
      lotAddress: address.lotAddress,
      roadAddress: address.roadAddress
    }))
  }

  useEffect(() => {
    if (isOpen) {
      setFormData({
        centerName: initialName,
        loadingPointName: '',
        lotAddress: '',
        roadAddress: '',
        manager1: '',
        manager2: '',
        phone1: '',
        phone2: ''
      })
    }
  }, [isOpen, initialName])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 상차지 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="centerName">
                센터명 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="centerName"
                required
                value={formData.centerName}
                onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                placeholder="예: 서울물류센터"
              />
            </div>
            <div>
              <Label htmlFor="loadingPointName">
                상차지명 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="loadingPointName"
                required
                value={formData.loadingPointName}
                onChange={(e) => setFormData({ ...formData, loadingPointName: e.target.value })}
                placeholder="예: A동 1층"
              />
            </div>
          </div>

          <AddressSearchInput
            label="주소 검색"
            placeholder="주소를 검색하세요"
            lotAddress={formData.lotAddress}
            roadAddress={formData.roadAddress}
            onAddressSelect={handleAddressSelect}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manager1">담당자1</Label>
              <Input
                type="text"
                id="manager1"
                value={formData.manager1}
                onChange={(e) => setFormData({ ...formData, manager1: e.target.value })}
                placeholder="예: 김담당"
              />
            </div>
            <div>
              <Label htmlFor="manager2">담당자2</Label>
              <Input
                type="text"
                id="manager2"
                value={formData.manager2}
                onChange={(e) => setFormData({ ...formData, manager2: e.target.value })}
                placeholder="예: 박부담당"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone1">연락처1</Label>
              <Input
                type="tel"
                id="phone1"
                value={formData.phone1}
                onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                placeholder="예: 02-1234-5678"
              />
            </div>
            <div>
              <Label htmlFor="phone2">연락처2</Label>
              <Input
                type="tel"
                id="phone2"
                value={formData.phone2}
                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                placeholder="예: 010-1234-5678"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '등록 중...' : '등록'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { LoadingPointCombobox }
export default LoadingPointCombobox