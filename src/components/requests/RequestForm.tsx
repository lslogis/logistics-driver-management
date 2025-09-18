'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, PlusIcon, XIcon, CalculatorIcon, RefreshCwIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingPointSelector } from '@/components/ui/LoadingPointSelector'
import { baseRequestSchema } from '@/lib/validations/request'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const RequestFormSchema = baseRequestSchema.extend({
  requestDate: z.string().min(1, '요청일을 선택해주세요'),
  loadingPointId: z.string().min(1, '상차지를 선택해주세요'),
  vehicleTon: z.number().min(0.1, '최소 0.1톤').max(999.9, '최대 999.9톤'),
  regions: z.array(z.string().min(1, '지역을 입력해주세요')).min(1, '최소 1개 지역 필요').max(10, '최대 10개 지역'),
  stops: z.number().int().min(1, '최소 1개 착지').max(50, '최대 50개 착지'),
}).superRefine((data, ctx) => {
  if ((data.extraAdjustment ?? 0) !== 0) {
    const hasReason = typeof data.adjustmentReason === 'string' && data.adjustmentReason.trim().length > 0
    if (!hasReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '추가 조정 시 조정 사유가 필요합니다',
        path: ['adjustmentReason']
      })
    }
  }
})

type RequestFormData = z.infer<typeof RequestFormSchema>

type VehicleOption = {
  value: string
  label: string
  ton: number
}

const parseVehicleTypeLabels = (input: unknown): VehicleOption[] => {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map(item => item.trim())
    .filter((value, index, self) => self.indexOf(value) === index)
    .map(value => {
      const match = value.match(/[0-9]+(?:\.[0-9]+)?/)
      const ton = match ? parseFloat(match[0]) : NaN
      return {
        value,
        label: value,
        ton: Number.isNaN(ton) ? 0 : ton
      }
    })
    .filter(option => option.ton > 0)
    .sort((a, b) => {
      if (a.ton === b.ton) {
        return a.label.localeCompare(b.label, 'ko')
      }
      return a.ton - b.ton
    })
}

interface FareCalculationResult {
  baseFare: number
  extraStopFare: number
  extraRegionFare: number
  subtotal: number
  extraAdjustment: number
  totalFare: number
  calculationBreakdown: {
    appliedRate?: any
    baseFareCalculation: string
    extraStopCalculation: string
    extraRegionCalculation: string
  }
  warnings: string[]
}

interface RequestFormProps {
  initialData?: Partial<RequestFormData>
  onSubmit: (data: RequestFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function RequestForm({ initialData, onSubmit, onCancel, isLoading }: RequestFormProps) {
  const [fareCalculation, setFareCalculation] = useState<FareCalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showAdjustment, setShowAdjustment] = useState(false)

  const form = useForm<RequestFormData>({
    resolver: zodResolver(RequestFormSchema),
    defaultValues: {
      loadingPointId: initialData?.loadingPointId || '',
      requestDate: initialData?.requestDate || new Date().toISOString().split('T')[0],
      centerCarNo: initialData?.centerCarNo ?? '',
      vehicleTon: initialData?.vehicleTon || 3.5,
      regions: initialData?.regions || [''],
      stops: initialData?.stops || 1,
      notes: initialData?.notes || '',
      extraAdjustment: initialData?.extraAdjustment || 0,
      adjustmentReason: initialData?.adjustmentReason || '',
    }
  })

  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<VehicleOption[]>([])
  const [selectedVehicleTonOption, setSelectedVehicleTonOption] = useState<string>('')

  const { fields: regionFields, append: appendRegion, remove: removeRegion } = useFieldArray({
    control: form.control,
    name: 'regions'
  })

  const watchedValues = form.watch()
  const watchedVehicleTon = watchedValues.vehicleTon

  useEffect(() => {
    let isMounted = true

    const loadVehicleTypes = async () => {
      try {
        const response = await fetch('/api/vehicle-types')
        if (!response.ok) {
          return
        }

        const payload = await response.json()
        const labels = Array.isArray(payload?.data) ? payload.data : payload
        const parsed = parseVehicleTypeLabels(labels)
        if (!isMounted) return

        setVehicleTypeOptions(parsed)
      } catch (error) {
        console.error('Failed to load vehicle types:', error)
      }
    }

    loadVehicleTypes()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const match = vehicleTypeOptions.find(option => option.ton === watchedVehicleTon)
    setSelectedVehicleTonOption(match?.value ?? '')
  }, [watchedVehicleTon, vehicleTypeOptions])

  const calculateFare = useCallback(async () => {
    const values = form.getValues()
    
    if (!values.loadingPointId || !values.vehicleTon || !values.regions?.length || !values.stops) {
      return
    }

    setIsCalculating(true)
    
    try {
      const centerCarNo = values.centerCarNo?.trim()
      const response = await fetch('/api/requests/calculate-fare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadingPointId: values.loadingPointId,
          centerCarNo: centerCarNo ? centerCarNo : undefined,
          vehicleTon: values.vehicleTon,
          regions: values.regions.filter(r => r.trim()),
          stops: values.stops,
          extraAdjustment: values.extraAdjustment || 0
        })
      })

      if (response.ok) {
        const data = await response.json()
        setFareCalculation(data.calculation)
      }
    } catch (error) {
      console.error('Fare calculation error:', error)
    } finally {
      setIsCalculating(false)
    }
  }, [form])

  // Auto-calculate fare when key fields change
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (['loadingPointId', 'vehicleTon', 'regions', 'stops'].includes(name || '')) {
        if (value.loadingPointId && value.vehicleTon && value.regions?.length && value.stops) {
          calculateFare()
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form, calculateFare])

  const handleSubmit = async (data: RequestFormData) => {
    const normalized: RequestFormData = {
      ...data,
      centerCarNo: data.centerCarNo?.trim() ? data.centerCarNo.trim() : undefined
    }

    await onSubmit(normalized)
  }

  const finalBillingAmount = fareCalculation 
    ? fareCalculation.totalFare 
    : (watchedValues.extraAdjustment || 0)

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* LoadingPoint Selection */}
          <div>
            <Label>상차지 *</Label>
            <LoadingPointSelector
              value={form.watch('loadingPointId')}
              onValueChange={(loadingPointId) => form.setValue('loadingPointId', loadingPointId)}
              className={cn(form.formState.errors.loadingPointId && 'border-red-500')}
            />
            {form.formState.errors.loadingPointId && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.loadingPointId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="requestDate">요청일 *</Label>
              <Input
                id="requestDate"
                type="date"
                {...form.register('requestDate')}
                className={cn(form.formState.errors.requestDate && 'border-red-500')}
              />
              {form.formState.errors.requestDate && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.requestDate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="centerCarNo">상차지호차</Label>
              <Input
                id="centerCarNo"
                {...form.register('centerCarNo')}
                placeholder="C001 (선택사항)"
                className={cn(form.formState.errors.centerCarNo && 'border-red-500')}
              />
              {form.formState.errors.centerCarNo && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.centerCarNo.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="vehicleTon">차량톤수 *</Label>
              <Select
                value={selectedVehicleTonOption || undefined}
                onValueChange={(value) => {
                  const option = vehicleTypeOptions.find(opt => opt.value === value)
                  if (!option) {
                    return
                  }

                  form.setValue('vehicleTon', option.ton, { shouldDirty: true, shouldValidate: true, shouldTouch: true })
                }}
              >
                <SelectTrigger id="vehicleTon" className={cn(form.formState.errors.vehicleTon && 'border-red-500')}>
                  <SelectValue placeholder="톤수 선택" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.vehicleTon && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.vehicleTon.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="stops">착지수 *</Label>
              <div className="flex">
                <Input
                  id="stops"
                  type="number"
                  min="1"
                  max="50"
                  {...form.register('stops', { valueAsNumber: true })}
                  className={cn(form.formState.errors.stops && 'border-red-500', 'rounded-r-none')}
                />
                <div className="bg-gray-50 border border-l-0 rounded-r px-3 flex items-center text-sm text-gray-600">
                  개
                </div>
              </div>
              {form.formState.errors.stops && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.stops.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Regions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            🗺️ 배송지역 *
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendRegion('')}
              className="ml-auto"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              지역 추가
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {regionFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <div className="flex-1">
                <div className="flex">
                  <div className="bg-gray-50 border border-r-0 rounded-l px-3 flex items-center text-sm text-gray-600 min-w-[60px]">
                    {index + 1}번째
                  </div>
                  <Input
                    {...form.register(`regions.${index}` as const)}
                    placeholder="서울"
                    className="rounded-l-none"
                  />
                </div>
              </div>
              {regionFields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeRegion(index)}
                  className="px-2"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {form.formState.errors.regions && (
            <p className="text-sm text-red-500">
              {form.formState.errors.regions.message}
            </p>
          )}
          <p className="text-sm text-gray-500">
            💡 팁: 지역 순서는 배송 순서와 동일하게 입력해주세요
          </p>
        </CardContent>
      </Card>

      {/* Fare Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            💰 요금 정보
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={calculateFare}
              disabled={isCalculating}
            >
              {isCalculating ? (
                <RefreshCwIcon className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CalculatorIcon className="h-4 w-4 mr-1" />
              )}
              요금 계산
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fareCalculation ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">요금 계산 완료</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">기본료</div>
                  <div className="font-medium">{fareCalculation.baseFare.toLocaleString()}원</div>
                </div>
                <div>
                  <div className="text-gray-600">지역료</div>
                  <div className="font-medium">{fareCalculation.extraRegionFare.toLocaleString()}원</div>
                </div>
                <div>
                  <div className="text-gray-600">콜료</div>
                  <div className="font-medium">{fareCalculation.extraStopFare.toLocaleString()}원</div>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between items-center font-semibold">
                <span>💳 총 상차지청구금액:</span>
                <span className="text-lg text-blue-600">
                  {fareCalculation.subtotal.toLocaleString()}원
                </span>
              </div>
              {fareCalculation.warnings.length > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="text-sm text-yellow-800">
                    ⚠️ {fareCalculation.warnings.join(', ')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
              기본 정보를 입력한 후 요금 계산 버튼을 클릭해주세요
            </div>
          )}

          {/* Extra Adjustment */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showAdjustment"
              checked={showAdjustment}
              onChange={(e) => setShowAdjustment(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="showAdjustment">추가 조정 사용</Label>
          </div>

          {showAdjustment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="extraAdjustment">조정 금액</Label>
                <div className="flex">
                  <Input
                    id="extraAdjustment"
                    type="number"
                    {...form.register('extraAdjustment', { valueAsNumber: true })}
                    placeholder="0"
                    className="rounded-r-none"
                  />
                  <div className="bg-gray-50 border border-l-0 rounded-r px-3 flex items-center text-sm text-gray-600">
                    원
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="adjustmentReason">조정 사유 *</Label>
                <Input
                  id="adjustmentReason"
                  {...form.register('adjustmentReason')}
                  placeholder="유료비 추가"
                  className={cn(form.formState.errors.adjustmentReason && 'border-red-500')}
                />
                {form.formState.errors.adjustmentReason && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.adjustmentReason.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {(fareCalculation || watchedValues.extraAdjustment !== 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex justify-between items-center font-semibold text-blue-800">
                <span>🏷️ 최종 청구금액:</span>
                <span className="text-xl">{finalBillingAmount.toLocaleString()}원</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>📝 메모</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...form.register('notes')}
            placeholder="추가 요청사항이나 특이사항을 입력해주세요..."
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
