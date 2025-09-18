'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SearchIcon, UserIcon, PhoneIcon, TruckIcon, ClockIcon, EditIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const DispatchFormSchema = z.object({
  driverId: z.string().optional(),
  driverName: z.string().min(1, '기사명을 입력해주세요').max(100),
  driverPhone: z.string().regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다 (010-XXXX-XXXX)'),
  driverVehicle: z.string().min(1, '차량정보를 입력해주세요').max(50),
  deliveryTime: z.string().max(50).optional(),
  driverFee: z.number().int().min(0, '기사운임은 0원 이상이어야 합니다'),
  driverNotes: z.string().optional(),
})

type DispatchFormData = z.infer<typeof DispatchFormSchema>

interface Driver {
  id: string
  name: string
  phone: string
  vehicleNumber: string
  isActive: boolean
  businessName?: string
  relevanceScore: number
  recentDispatches: number
}

interface DispatchFormProps {
  requestId: string
  centerBilling?: number
  initialData?: Partial<DispatchFormData>
  onSubmit: (data: DispatchFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function DispatchForm({ 
  requestId, 
  centerBilling = 0, 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}: DispatchFormProps) {
  const [searchMode, setSearchMode] = useState<'search' | 'manual'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Driver[]>([])
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<DispatchFormData>({
    resolver: zodResolver(DispatchFormSchema),
    defaultValues: {
      driverId: initialData?.driverId || '',
      driverName: initialData?.driverName || '',
      driverPhone: initialData?.driverPhone || '',
      driverVehicle: initialData?.driverVehicle || '',
      deliveryTime: initialData?.deliveryTime || '',
      driverFee: initialData?.driverFee || 0,
      driverNotes: initialData?.driverNotes || '',
    }
  })

  const watchedDriverFee = form.watch('driverFee')

  // Calculate margin in real-time
  const margin = centerBilling - (watchedDriverFee || 0)
  const marginPercentage = centerBilling > 0 ? (margin / centerBilling) * 100 : 0

  const getMarginStatus = () => {
    if (marginPercentage >= 40) return { label: '✅ 양호한 마진', color: 'text-green-600' }
    if (marginPercentage >= 20) return { label: '⚠️ 보통 마진', color: 'text-yellow-600' }
    if (marginPercentage >= 0) return { label: '⚠️ 낮은 마진', color: 'text-orange-600' }
    return { label: '❌ 손실 발생', color: 'text-red-600' }
  }

  // Search drivers
  const searchDrivers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/drivers/search?query=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Driver search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchDrivers(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Select driver from search results
  const selectDriver = (driver: Driver) => {
    setSelectedDriver(driver)
    setSearchQuery(driver.name)
    setShowSearchResults(false)
    
    // Auto-fill form fields
    form.setValue('driverId', driver.id)
    form.setValue('driverName', driver.name)
    form.setValue('driverPhone', driver.phone)
    form.setValue('driverVehicle', driver.vehicleNumber)
  }

  // Switch to manual mode
  const switchToManualMode = () => {
    setSearchMode('manual')
    setSelectedDriver(null)
    setSearchQuery('')
    setShowSearchResults(false)
    form.setValue('driverId', '')
  }

  // Switch to search mode
  const switchToSearchMode = () => {
    setSearchMode('search')
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '')
    if (digits.length === 11 && digits.startsWith('010')) {
      return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`
    }
    return value
  }

  const handleSubmit = async (data: DispatchFormData) => {
    await onSubmit(data)
  }

  const marginStatus = getMarginStatus()

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Driver Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            🚛 기사 정보
            <div className="flex gap-2">
              {searchMode === 'search' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={switchToManualMode}
                >
                  수기 입력으로
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={switchToSearchMode}
                >
                  기사 검색으로
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchMode === 'search' ? (
            <>
              {/* Driver Search */}
              <div className="relative">
                <Label htmlFor="driverSearch">기사 검색</Label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    id="driverSearch"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="기사명, 전화번호, 차량번호로 검색..."
                    className="pl-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 text-sm text-gray-600 border-b">
                      검색 결과 ({searchResults.length}건)
                    </div>
                    {searchResults.map((driver) => (
                      <button
                        key={driver.id}
                        type="button"
                        onClick={() => selectDriver(driver)}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 focus:bg-gray-50 focus:outline-none"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {driver.name}
                              {!driver.isActive && (
                                <Badge variant="secondary" className="text-xs">비활성</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <PhoneIcon className="h-3 w-3" />
                                {driver.phone}
                              </span>
                              <span className="flex items-center gap-1">
                                <TruckIcon className="h-3 w-3" />
                                {driver.vehicleNumber}
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            {driver.recentDispatches > 0 && (
                              <div className="text-green-600">
                                최근 {driver.recentDispatches}건
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Driver Display */}
              {selectedDriver && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">선택된 기사: {selectedDriver.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">연락처:</span> {selectedDriver.phone}
                    </div>
                    <div>
                      <span className="text-gray-600">차량:</span> {selectedDriver.vehicleNumber}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <EditIcon className="h-4 w-4" />
                <span className="font-medium">수기 입력 모드</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                ⚠️ 새로운 기사입니다. 정보를 정확히 입력해주세요.
              </p>
            </div>
          )}

          {/* Driver Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="driverName">기사명 *</Label>
              <Input
                id="driverName"
                {...form.register('driverName')}
                className={cn(form.formState.errors.driverName && 'border-red-500')}
                readOnly={searchMode === 'search' && selectedDriver}
              />
              {form.formState.errors.driverName && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.driverName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="driverPhone">연락처 *</Label>
              <Input
                id="driverPhone"
                {...form.register('driverPhone')}
                placeholder="010-1234-5678"
                className={cn(form.formState.errors.driverPhone && 'border-red-500')}
                readOnly={searchMode === 'search' && selectedDriver}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value)
                  form.setValue('driverPhone', formatted)
                }}
              />
              {form.formState.errors.driverPhone && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.driverPhone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="driverVehicle">차량정보 *</Label>
              <Input
                id="driverVehicle"
                {...form.register('driverVehicle')}
                placeholder="현대 포터"
                className={cn(form.formState.errors.driverVehicle && 'border-red-500')}
                readOnly={searchMode === 'search' && selectedDriver}
              />
              {form.formState.errors.driverVehicle && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.driverVehicle.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="deliveryTime">배송시간</Label>
              <Input
                id="deliveryTime"
                {...form.register('deliveryTime')}
                placeholder="09~12시"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="driverFee">기사운임 *</Label>
            <div className="flex">
              <Input
                id="driverFee"
                type="number"
                min="0"
                {...form.register('driverFee', { valueAsNumber: true })}
                className={cn(form.formState.errors.driverFee && 'border-red-500', 'rounded-r-none')}
              />
              <div className="bg-gray-50 border border-l-0 rounded-r px-3 flex items-center text-sm text-gray-600">
                원
              </div>
            </div>
            {form.formState.errors.driverFee && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.driverFee.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Margin Information */}
      {centerBilling > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>💰 수익 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <div className="text-gray-600">상차지청구</div>
                  <div className="font-medium text-lg">{centerBilling.toLocaleString()}원</div>
                </div>
                <div>
                  <div className="text-gray-600">기사운임</div>
                  <div className="font-medium text-lg">{(watchedDriverFee || 0).toLocaleString()}원</div>
                </div>
                <div>
                  <div className="text-gray-600">마진</div>
                  <div className={cn("font-medium text-lg", marginStatus.color)}>
                    {margin.toLocaleString()}원 ({marginPercentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
              <Separator className="my-3" />
              <div className={cn("text-center font-medium", marginStatus.color)}>
                💎 {marginStatus.label}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver Notes */}
      <Card>
        <CardHeader>
          <CardTitle>📝 기사 메모</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...form.register('driverNotes')}
            placeholder="안전운전 부탁드립니다..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  )
}