'use client'

import React, { useEffect, useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingPointCombobox } from '@/components/ui/LoadingPointCombobox'
import { VehicleTypeSelector } from '@/components/ui/VehicleTypeSelector'
import { DriverSelector } from '@/components/ui/DriverSelector'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CenterFareCreateModal } from './CenterFareCreateModal'
import { useQuote, useCreateCenterFare } from '@/hooks/useCharters'
import { CreateCharterRequestData, UpdateCharterRequestData } from '@/lib/services/charter.service'
import { PricingOutput } from '@/lib/services/pricing.service'
import { hasPermission } from '@/lib/auth/rbac'
import { UserRole } from '@prisma/client'
import { Plus, Minus, Calculator, AlertTriangle, CheckCircle, Truck } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

// Validation schema
const charterFormSchema = z.object({
  date: z.string().min(1, '운행일은 필수입니다'),
  centerId: z.string().min(1, '센터를 선택해주세요'),
  vehicleType: z.string().min(1, '차량 타입을 선택해주세요'),
  driverId: z.string().min(1, '기사를 선택해주세요'),
  destinations: z.array(z.object({
    region: z.string().min(1, '지역을 입력해주세요'),
    order: z.number().min(1, '순서는 1 이상이어야 합니다')
  })).min(1, '목적지는 최소 1개 이상이어야 합니다').refine(
    (destinations) => {
      const orders = destinations.map(d => d.order).sort((a, b) => a - b)
      const expectedOrders = Array.from({length: orders.length}, (_, i) => i + 1)
      return JSON.stringify(orders) === JSON.stringify(expectedOrders)
    },
    { message: '목적지 순서가 올바르지 않습니다 (1부터 시작하는 연속된 숫자여야 함)' }
  ).refine(
    (destinations) => {
      const regions = destinations.map(d => d.region)
      return new Set(regions).size === regions.length
    },
    { message: '중복된 지역이 있습니다' }
  ),
  isNegotiated: z.boolean().default(false),
  negotiatedFare: z.number().int().min(0).optional(),
  extraFare: z.number().int().min(0).default(0),
  totalFare: z.number().int().min(0, '총 금액은 0 이상이어야 합니다'),
  driverFare: z.number().int().min(0, '기사 금액은 0 이상이어야 합니다'),
  notes: z.string().optional()
}).refine(
  (data) => {
    if (data.isNegotiated && (data.negotiatedFare === undefined || data.negotiatedFare <= 0)) {
      return false
    }
    return true
  },
  {
    message: '협의금액이 설정되었지만 유효하지 않습니다',
    path: ['negotiatedFare']
  }
)

type CharterFormData = z.infer<typeof charterFormSchema>

interface CharterFormProps {
  initialData?: Partial<CreateCharterRequestData>
  mode: 'create' | 'edit'
  onSubmit: (data: CreateCharterRequestData | UpdateCharterRequestData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  userRole?: UserRole
}

export function CharterForm({ 
  initialData, 
  mode, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  userRole 
}: CharterFormProps) {
  const [isQuoteLoading, setIsQuoteLoading] = useState(false)
  const [quoteResult, setQuoteResult] = useState<PricingOutput | null>(null)
  const [showFareModal, setShowFareModal] = useState(false)
  const [fareModalData, setFareModalData] = useState<{
    centerId: string
    vehicleType: string
    missingRegions: string[]
  } | null>(null)

  const quoteMutation = useQuote()
  const isReadOnly = userRole && !hasPermission(userRole, 'charters', mode === 'create' ? 'create' : 'update')

  const form = useForm<CharterFormData>({
    resolver: zodResolver(charterFormSchema),
    defaultValues: {
      date: initialData?.date ? dayjs(initialData.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      centerId: initialData?.centerId || '',
      vehicleType: initialData?.vehicleType || '',
      driverId: initialData?.driverId || '',
      destinations: initialData?.destinations || [{ region: '', order: 1 }],
      isNegotiated: initialData?.isNegotiated || false,
      negotiatedFare: initialData?.negotiatedFare || undefined,
      extraFare: initialData?.extraFare || 0,
      totalFare: initialData?.totalFare || 0,
      driverFare: initialData?.driverFare || 0,
      notes: initialData?.notes || ''
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'destinations'
  })

  const { watch, setValue, getValues } = form
  const watchedValues = watch()

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { 
      style: 'currency', 
      currency: 'KRW' 
    }).format(amount)
  }

  // Auto-calculate when key inputs change (debounced) - disabled for now to prevent performance issues
  // This can be enabled later with proper optimization
  /*
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const { centerId, vehicleType, destinations } = watchedValues
      
      // Only auto-calculate if all required fields are present and we have destinations with regions
      if (centerId && vehicleType && destinations.length > 0 && destinations.every(d => d.region?.trim())) {
        // Only auto-calculate if no quote exists yet to avoid spam
        if (!quoteResult && !isQuoteLoading) {
          handleCalculateQuote()
        }
      }
    }, 2000) // 2 second debounce

    return () => clearTimeout(timeoutId)
  }, [watchedValues.centerId, watchedValues.vehicleType, watchedValues.destinations])
  */

  // Keyboard shortcut for quote calculation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to calculate quote
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isReadOnly) {
        e.preventDefault()
        handleCalculateQuote()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isReadOnly])

  // Calculate quote with improved validation and error handling
  const handleCalculateQuote = async () => {
    const { centerId, vehicleType, destinations, extraFare, isNegotiated, negotiatedFare } = getValues()
    
    // Enhanced validation with specific error messages
    if (!centerId) {
      toast.error('센터를 선택해주세요')
      return
    }
    
    if (!vehicleType) {
      toast.error('차량 타입을 선택해주세요')
      return
    }
    
    if (destinations.length === 0) {
      toast.error('목적지를 최소 1개 이상 입력해주세요')
      return
    }

    // Check for empty regions with more specific feedback
    const emptyRegionIndices = destinations
      .map((d, index) => ({ region: d.region?.trim(), index }))
      .filter(({ region }) => !region)
      .map(({ index }) => index + 1)
    
    if (emptyRegionIndices.length > 0) {
      toast.error(`${emptyRegionIndices.join(', ')}번째 목적지를 입력해주세요`)
      return
    }

    // Check for duplicate regions
    const regions = destinations.map(d => d.region.trim())
    const duplicateRegions = regions.filter((region, index) => regions.indexOf(region) !== index)
    if (duplicateRegions.length > 0) {
      toast.error(`중복된 지역이 있습니다: ${[...new Set(duplicateRegions)].join(', ')}`)
      return
    }

    setIsQuoteLoading(true)
    
    try {
      const input = {
        centerId,
        vehicleType,
        regions,
        stopCount: regions.length,
        extras: {
          regionMove: regions.length >= 2 ? 10000 : 0, // Default region move fee
          stopExtra: regions.length >= 2 ? 5000 * (regions.length - 1) : 0, // Default stop fee
          misc: extraFare || 0
        },
        isNegotiated,
        negotiatedFare
      }

      const result = await quoteMutation.mutateAsync(input)
      setQuoteResult(result)
      
      // Update form values
      if (!isNegotiated) {
        setValue('totalFare', result.totalFare)
      }

      toast.success('요금이 계산되었습니다')
    } catch (error: any) {
      console.error('Quote error:', error)
      
      // Enhanced error handling with more specific messages
      if (error.code === 'MISSING_RATES' && error.details) {
        const { missingRegions, centerName, vehicleType: errorVehicleType } = error.details
        
        // Set modal data from API error response
        setFareModalData({
          centerId,
          vehicleType: errorVehicleType,
          missingRegions: missingRegions || []
        })
        setShowFareModal(true)
        
        // If there's partial result, use it
        if (error.partialResult) {
          setQuoteResult(error.partialResult)
          toast('일부 지역의 요율로 계산된 결과입니다. 누락된 요율을 등록해주세요.', {
            icon: 'ℹ️',
            duration: 5000
          })
        }
        
        toast.error(`${centerName}의 ${errorVehicleType} 차량에 대한 요율이 없습니다. 요율을 등록해주세요.`)
      } else if (error.code === 'VALIDATION_ERROR') {
        toast.error('입력 정보를 다시 확인해주세요')
      } else if (error.message?.includes('요율')) {
        toast.error('해당 조합의 요율이 없습니다. 요율을 등록해 주세요.')
      } else if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
        toast.error('네트워크 연결을 확인해주세요')
      } else {
        toast.error(`요금 계산 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
      }
    } finally {
      setIsQuoteLoading(false)
    }
  }

  // Handle fare modal success
  const handleFareCreated = () => {
    setShowFareModal(false)
    // Recalculate quote
    setTimeout(() => {
      handleCalculateQuote()
    }, 500)
  }

  // Add destination
  const addDestination = () => {
    const nextOrder = Math.max(...fields.map(f => f.order), 0) + 1
    append({ region: '', order: nextOrder })
  }

  // Remove destination
  const removeDestination = (index: number) => {
    if (fields.length > 1) {
      remove(index)
      // Reorder remaining destinations
      const currentDestinations = getValues('destinations')
      const reorderedDestinations = currentDestinations
        .filter((_, i) => i !== index)
        .map((dest, i) => ({ ...dest, order: i + 1 }))
      setValue('destinations', reorderedDestinations)
    }
  }

  // Handle negotiated fare toggle
  const handleNegotiatedToggle = (checked: boolean) => {
    setValue('isNegotiated', checked)
    if (checked) {
      setValue('negotiatedFare', watchedValues.totalFare || 0)
      setValue('totalFare', watchedValues.totalFare || 0)
    } else {
      setValue('negotiatedFare', undefined)
      if (quoteResult) {
        setValue('totalFare', quoteResult.totalFare)
      }
    }
  }

  // Handle negotiated fare change
  const handleNegotiatedFareChange = (value: string) => {
    const numValue = parseInt(value) || 0
    setValue('negotiatedFare', numValue)
    setValue('totalFare', numValue)
  }

  // Form submission
  const handleSubmit = async (data: CharterFormData) => {
    if (isReadOnly) return

    try {
      const submitData = {
        ...data,
        date: new Date(data.date),
        baseFare: quoteResult?.baseFare || 0,
        regionFare: quoteResult?.regionFare || 0,
        stopFare: quoteResult?.stopFare || 0
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">운행일 *</Label>
                <Input
                  id="date"
                  type="date"
                  disabled={isReadOnly}
                  {...form.register('date')}
                  className="mt-1"
                />
                {form.formState.errors.date && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.date.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="centerId">센터 *</Label>
                <Controller
                  name="centerId"
                  control={form.control}
                  render={({ field }) => (
                    <LoadingPointCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isReadOnly}
                      className="mt-1"
                    />
                  )}
                />
                {form.formState.errors.centerId && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.centerId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="vehicleType">차량 타입 *</Label>
                <Controller
                  name="vehicleType"
                  control={form.control}
                  render={({ field }) => (
                    <VehicleTypeSelector
                      value={field.value as any}
                      onChange={field.onChange}
                      disabled={isReadOnly}
                      className="mt-1"
                    />
                  )}
                />
                {form.formState.errors.vehicleType && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.vehicleType.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="driverId">기사 *</Label>
                <Controller
                  name="driverId"
                  control={form.control}
                  render={({ field }) => (
                    <DriverSelector
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isReadOnly}
                      className="mt-1"
                    />
                  )}
                />
                {form.formState.errors.driverId && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.driverId.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Destinations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>목적지 정보</span>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDestination}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  목적지 추가
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex-shrink-0">
                  <Badge variant="outline" className="min-w-[2rem] justify-center">
                    {index + 1}
                  </Badge>
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="지역명 (예: 부산, 대구, 광주)"
                    disabled={isReadOnly}
                    {...form.register(`destinations.${index}.region`)}
                    aria-label={`${index + 1}번째 목적지`}
                    onKeyDown={(e) => {
                      // Enter to add new destination
                      if (e.key === 'Enter' && !isReadOnly && index === fields.length - 1) {
                        e.preventDefault()
                        addDestination()
                      }
                      // Backspace on empty field to remove current destination
                      if (e.key === 'Backspace' && !e.currentTarget.value && fields.length > 1 && !isReadOnly) {
                        e.preventDefault()
                        removeDestination(index)
                        // Focus previous input if available
                        if (index > 0) {
                          setTimeout(() => {
                            const prevInput = document.querySelector(`input[name="destinations.${index - 1}.region"]`) as HTMLInputElement
                            prevInput?.focus()
                          }, 0)
                        }
                      }
                    }}
                    className={cn(
                      form.formState.errors.destinations?.[index]?.region && 'border-red-300 focus:border-red-300'
                    )}
                  />
                  {form.formState.errors.destinations?.[index]?.region && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.destinations[index].region.message}
                    </p>
                  )}
                </div>
                {!isReadOnly && fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDestination(index)}
                    className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    aria-label={`${index + 1}번째 목적지 삭제`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            {!isReadOnly && (
              <div className="text-sm text-gray-500 space-y-1">
                <p>💡 팁: Enter 키로 목적지 추가, 빈 필드에서 Backspace로 삭제</p>
                {fields.length > 1 && (
                  <p>📍 {fields.length}개 목적지 ({fields.filter(f => watch(`destinations.${fields.indexOf(f)}.region`)).length}개 입력 완료)</p>
                )}
              </div>
            )}
            
            {form.formState.errors.destinations && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {form.formState.errors.destinations.message || 
                   form.formState.errors.destinations.root?.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Pricing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>요금 정보</span>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCalculateQuote}
                  disabled={isQuoteLoading || !watchedValues.centerId || !watchedValues.vehicleType || watchedValues.destinations.some(d => !d.region?.trim())}
                  className="flex items-center gap-2"
                  aria-label="요금 계산하기"
                >
                  <Calculator className="h-4 w-4" />
                  {isQuoteLoading ? '계산 중...' : '요금 계산'}
                </Button>
              )}
            </CardTitle>
            {!isReadOnly && (!watchedValues.centerId || !watchedValues.vehicleType || watchedValues.destinations.some(d => !d.region?.trim())) && (
              <p className="text-sm text-gray-500 mt-1">
                센터, 차량 타입, 목적지를 모두 입력한 후 요금을 계산할 수 있습니다
                <span className="ml-2 text-xs text-blue-600">
                  (단축키: Ctrl+Enter)
                </span>
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Negotiated fare toggle */}
            <div className="flex items-center space-x-2">
              <Controller
                name="isNegotiated"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="isNegotiated"
                    checked={field.value}
                    onCheckedChange={handleNegotiatedToggle}
                    disabled={isReadOnly}
                  />
                )}
              />
              <Label htmlFor="isNegotiated" className="text-sm font-medium">
                협의금액 사용
              </Label>
            </div>

            {/* Negotiated fare input */}
            {watchedValues.isNegotiated && (
              <div>
                <Label htmlFor="negotiatedFare">협의금액 *</Label>
                <Input
                  id="negotiatedFare"
                  type="number"
                  min="0"
                  placeholder="협의금액을 입력하세요"
                  disabled={isReadOnly}
                  value={watchedValues.negotiatedFare || ''}
                  onChange={(e) => handleNegotiatedFareChange(e.target.value)}
                  className="mt-1"
                />
                {form.formState.errors.negotiatedFare && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.negotiatedFare.message}</p>
                )}
              </div>
            )}

            {/* Quote result display */}
            {quoteResult && !watchedValues.isNegotiated && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4" role="region" aria-label="요금 계산 결과">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                  <span className="font-medium text-green-800">요금 계산 결과</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <div className="text-gray-600">기본료</div>
                    <div className="font-medium" aria-label={`기본료 ${formatCurrency(quoteResult.baseFare)}`}>
                      {formatCurrency(quoteResult.baseFare)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">지역료</div>
                    <div className="font-medium" aria-label={`지역료 ${formatCurrency(quoteResult.regionFare)}`}>
                      {formatCurrency(quoteResult.regionFare)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">콜료</div>
                    <div className="font-medium" aria-label={`콜료 ${formatCurrency(quoteResult.stopFare)}`}>
                      {formatCurrency(quoteResult.stopFare)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">기타료</div>
                    <div className="font-medium" aria-label={`기타료 ${formatCurrency(quoteResult.extraFare)}`}>
                      {formatCurrency(quoteResult.extraFare)}
                    </div>
                  </div>
                  <div className="border-l pl-3">
                    <div className="text-gray-600">총액</div>
                    <div className="font-bold text-lg" aria-label={`총액 ${formatCurrency(quoteResult.totalFare)}`}>
                      {formatCurrency(quoteResult.totalFare)}
                    </div>
                  </div>
                </div>
                {quoteResult.metadata && quoteResult.metadata.missingRates && quoteResult.metadata.missingRates.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        일부 지역의 요율이 누락되어 참고용으로만 사용하세요
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="extraFare">기타료</Label>
                <Input
                  id="extraFare"
                  type="number"
                  min="0"
                  disabled={isReadOnly}
                  {...form.register('extraFare', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="totalFare">받는 금액 *</Label>
                <Input
                  id="totalFare"
                  type="number"
                  min="0"
                  disabled={isReadOnly || watchedValues.isNegotiated}
                  {...form.register('totalFare', { valueAsNumber: true })}
                  className="mt-1"
                />
                {form.formState.errors.totalFare && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.totalFare.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="driverFare">주는 금액 *</Label>
                <Input
                  id="driverFare"
                  type="number"
                  min="0"
                  disabled={isReadOnly}
                  {...form.register('driverFare', { valueAsNumber: true })}
                  className="mt-1"
                />
                {form.formState.errors.driverFare && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.driverFare.message}</p>
                )}
              </div>
            </div>

            {/* Margin calculation */}
            {(watchedValues.totalFare > 0 || watchedValues.driverFare > 0) && (
              <div className={cn(
                "border rounded-lg p-3",
                watchedValues.totalFare - watchedValues.driverFare >= 0
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">마진: </span>
                    <span className={cn(
                      "font-bold text-lg",
                      watchedValues.totalFare - watchedValues.driverFare >= 0 
                        ? "text-green-600" 
                        : "text-red-600"
                    )}>
                      {formatCurrency(watchedValues.totalFare - watchedValues.driverFare)}
                    </span>
                  </div>
                  {watchedValues.totalFare > 0 && (
                    <div className="text-xs text-gray-500">
                      마진율: {((watchedValues.totalFare - watchedValues.driverFare) / watchedValues.totalFare * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
                {watchedValues.totalFare - watchedValues.driverFare < 0 && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span>기사에게 주는 금액이 받는 금액보다 큽니다</span>
                  </div>
                )}
                {watchedValues.totalFare > 0 && watchedValues.driverFare > 0 && 
                 ((watchedValues.totalFare - watchedValues.driverFare) / watchedValues.totalFare * 100) < 10 && 
                 (watchedValues.totalFare - watchedValues.driverFare) >= 0 && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-yellow-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span>마진율이 10% 미만입니다 ({((watchedValues.totalFare - watchedValues.driverFare) / watchedValues.totalFare * 100).toFixed(1)}%)</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>메모</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="추가 메모사항을 입력하세요"
              disabled={isReadOnly}
              {...form.register('notes')}
              className="min-h-20"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              취소
            </Button>
          )}
          {!isReadOnly && (
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-24"
            >
              {isLoading ? '저장 중...' : mode === 'create' ? '등록' : '수정'}
            </Button>
          )}
        </div>
      </form>

      {/* Center Fare Creation Modal */}
      {showFareModal && fareModalData && (
        <CenterFareCreateModal
          isOpen={showFareModal}
          onClose={() => setShowFareModal(false)}
          centerId={fareModalData.centerId}
          vehicleType={fareModalData.vehicleType}
          missingRegions={fareModalData.missingRegions}
          onSuccess={handleFareCreated}
        />
      )}
    </div>
  )
}