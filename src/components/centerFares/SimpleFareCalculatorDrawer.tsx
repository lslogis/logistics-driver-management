'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calculator, Copy, CheckCircle2, Plus, AlertCircle } from 'lucide-react'
import { type FareRow } from '@/lib/utils/center-fares'
import { VEHICLE_TYPE_OPTIONS } from '@/lib/utils/vehicle-types'
import { toast } from 'react-hot-toast'
import { useLoadingPoints } from '@/hooks/useLoadingPoints'
import { useCenterFares } from '@/hooks/useCenterFares'

const calculatorSchema = z.object({
  loadingPointId: z.string().min(1, '센터를 선택하세요'),
  vehicleTypeId: z.string().min(1, '차량톤수를 선택하세요'),
  regions: z.string().min(1, '지역을 입력하세요 (쉼표로 구분)'),
  stopCount: z.coerce.number().int().min(1, '착지 수는 1 이상이어야 합니다'),
}).refine((data) => {
  // 지역 개수 계산
  const regionCount = data.regions
    .split(',')
    .map(region => region.trim())
    .filter(region => region.length > 0).length
  
  // 착지수는 지역수보다 크거나 같아야 함
  return data.stopCount >= regionCount
}, {
  message: '착지 수는 지역 개수보다 크거나 같아야 합니다',
  path: ['stopCount']
})

type CalculatorForm = z.infer<typeof calculatorSchema>

interface CalculationResult {
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
  total: number
  formula: string
}

interface SimpleFareCalculatorDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenCreate?: (prefilledData: {
    centerId: string
    centerName: string
    vehicleTypeId: string
    vehicleTypeName: string
    region?: string
    fareType: '기본운임' | '경유운임'
    baseFare?: number
    extraStopFee?: number
    extraRegionFee?: number
  }) => void
}


export function SimpleFareCalculatorDrawer({ 
  open, 
  onOpenChange, 
  onOpenCreate
}: SimpleFareCalculatorDrawerProps) {
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [missingData, setMissingData] = useState<{
    type: 'basic' | 'extra'
    region?: string
    regions?: string[]
    loadingPointId: string
    centerName: string
    loadingPointName?: string
    vehicleTypeId: string
    vehicleTypeName: string
  } | null>(null)
  const loadingPointsQuery = useLoadingPoints()
  const { data: centerFaresData } = useCenterFares()
  // DB 데이터를 FareRow로 변환
  const rows = React.useMemo(() => {
    if (!centerFaresData?.fares) return []
    return centerFaresData.fares.map(dbRow => ({
      id: dbRow.id,
      loadingPointId: dbRow.loadingPointId,
      centerName: dbRow.loadingPoint?.centerName ?? dbRow.centerName ?? '',
      loadingPointName: dbRow.loadingPoint?.loadingPointName ?? dbRow.loadingPointName ?? (dbRow.loadingPoint?.centerName ?? dbRow.centerName ?? ''),
      vehicleTypeId: dbRow.vehicleType,
      vehicleTypeName: dbRow.vehicleType,
      region: dbRow.region || '',
      fareType: dbRow.fareType === 'BASIC' ? '기본운임' as const : '경유운임' as const,
      baseFare: dbRow.baseFare,
      extraStopFee: dbRow.extraStopFee,
      extraRegionFee: dbRow.extraRegionFee,
      createdAt: new Date(dbRow.createdAt).toISOString().slice(0, 10)
    }))
  }, [centerFaresData])

  const loadingPointOptions = React.useMemo(() => {
    const pages = loadingPointsQuery.data?.pages ?? []
    const flattened = pages.flatMap((page: any) => {
      if (Array.isArray(page.items)) return page.items
      if (Array.isArray(page.data)) return page.data
      if (page?.data?.items && Array.isArray(page.data.items)) return page.data.items
      return [] as any[]
    })

    const map = new Map<string, { id: string; centerName: string; loadingPointName?: string }>()

    flattened.forEach((lp: any) => {
      const key = typeof lp.centerName === 'string' ? lp.centerName.trim() : ''
      if (!key || map.has(key)) return
      map.set(key, { id: lp.id, centerName: key, loadingPointName: lp.loadingPointName })
    })

    if (map.size === 0) {
      rows.forEach(row => {
        const key = row.centerName?.trim()
        if (!key || map.has(key)) return
        map.set(key, { id: row.loadingPointId, centerName: key, loadingPointName: row.loadingPointName })
      })
    }

    return Array.from(map.values())
  }, [loadingPointsQuery.data, rows])

  const availableVehicleTypes = React.useMemo(() => VEHICLE_TYPE_OPTIONS, [])

  const form = useForm<CalculatorForm>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      loadingPointId: '',
      vehicleTypeId: '',
      stopCount: 1,
      regions: '',
    },
  })

  const regionsValue = form.watch('regions')
  const stopCountValue = form.watch('stopCount')

  const normalizedRegions = React.useMemo(() => (regionsValue || '')
    .split(',')
    .map(region => region.trim())
    .filter(region => region.length > 0), [regionsValue])

  const extraStopDisplay = Math.max(0, stopCountValue - 1)
  const extraRegionDisplay = Math.max(0, normalizedRegions.length - 1)
  const missingBasicRegionLabel = missingData?.regions && missingData.regions.length > 1
    ? missingData.regions.join(', ')
    : missingData?.region ?? ''

  // 지역이 변경될 때 착지 수를 자동으로 보정
  React.useEffect(() => {
    const regions = regionsValue || ''
    const regionCount = regions
      .split(',')
      .map(region => region.trim())
      .filter(region => region.length > 0).length

    const currentStopCount = stopCountValue || 1

    if (regionCount > 0 && currentStopCount < regionCount) {
      form.setValue('stopCount', regionCount, { shouldValidate: true })
    }
  }, [regionsValue, stopCountValue, form])

  const handleCalculate = (data: CalculatorForm) => {
    const selectedLoadingPoint = loadingPointOptions.find(option => option.id === data.loadingPointId)

    if (!selectedLoadingPoint) {
      toast.error('센터 정보를 찾을 수 없습니다.')
      return
    }

    const regions = (data.regions || '')
      .split(',')
      .map(region => region.trim())
      .filter(region => region.length > 0)
    
    if (regions.length === 0) {
      toast.error('지역을 하나 이상 입력해주세요.')
      return
    }

    const vehicleType = VEHICLE_TYPE_OPTIONS.find(v => v.id === data.vehicleTypeId)
    if (!vehicleType) {
      toast.error('차량톤수 정보를 찾을 수 없습니다.')
      return
    }
    const vehicleTypeName = vehicleType.name || data.vehicleTypeId

    const uniqueRegions = Array.from(new Set(regions))

    const baseFareCandidates = uniqueRegions.map(region => ({
      region,
      row: rows.find(row =>
        row.centerName === selectedLoadingPoint.centerName &&
        row.vehicleTypeId === data.vehicleTypeId &&
        row.fareType === '기본운임' &&
        (row.region || '') === region
      )
    }))

    const missingRegions = baseFareCandidates
      .filter(candidate => !candidate.row || candidate.row.baseFare == null)
      .map(candidate => candidate.region)

    if (missingRegions.length > 0) {
      const targetRegion = missingRegions[0]
      setResult(null)
      setMissingData({
        type: 'basic',
        region: targetRegion,
        regions: missingRegions,
        loadingPointId: selectedLoadingPoint.id,
        centerName: selectedLoadingPoint.centerName,
        loadingPointName: selectedLoadingPoint.loadingPointName,
        vehicleTypeId: data.vehicleTypeId,
        vehicleTypeName
      })
      const missingLabel = missingRegions.length > 1
        ? `${missingRegions.join(', ')} 지역들의 기본운임이`
        : `${targetRegion} 지역의 기본운임이`
      toast.error(`${missingLabel} 등록되지 않았습니다.`)
      return
    }

    const availableBaseFareCandidates = baseFareCandidates.filter((candidate): candidate is { region: string; row: FareRow } => {
      return !!candidate.row && candidate.row.baseFare != null
    })

    const selectedBaseFareCandidate = availableBaseFareCandidates.reduce<{ region: string; row: FareRow } | null>((best, candidate) => {
      if (!best) return candidate
      const bestFare = best.row.baseFare ?? 0
      const currentFare = candidate.row.baseFare ?? 0
      return currentFare > bestFare ? candidate : best
    }, null)

    const baseFareRow = selectedBaseFareCandidate?.row
    const baseFareRegion = selectedBaseFareCandidate?.region ?? regions[0]

    setMissingData(null)
    setResult(null)

    if (!baseFareRow || baseFareRow.baseFare == null) {
      setMissingData({
        type: 'basic',
        region: baseFareRegion ?? '',
        loadingPointId: selectedLoadingPoint.id,
        centerName: selectedLoadingPoint.centerName,
        loadingPointName: selectedLoadingPoint.loadingPointName,
        vehicleTypeId: data.vehicleTypeId,
        vehicleTypeName
      })
      const missingLabel = baseFareRegion ? `${baseFareRegion} 지역의 기본운임이 등록되지 않았습니다.` : '기본운임이 등록되지 않았습니다.'
      toast.error(missingLabel)
      return
    }

    const extraFareRow = rows.find(row =>
      row.centerName === selectedLoadingPoint.centerName &&
      row.vehicleTypeId === data.vehicleTypeId &&
      row.fareType === '경유운임'
    )

    if (!extraFareRow || extraFareRow.extraStopFee == null || extraFareRow.extraRegionFee == null) {
      setMissingData({
        type: 'extra',
        loadingPointId: selectedLoadingPoint.id,
        centerName: selectedLoadingPoint.centerName,
        loadingPointName: selectedLoadingPoint.loadingPointName,
        vehicleTypeId: data.vehicleTypeId,
        vehicleTypeName
      })
      toast.error('경유/지역 요율이 등록되지 않았습니다.')
      return
    }

    const baseFare = baseFareRow.baseFare
    const extraStopFee = (extraFareRow.extraStopFee || 0) * Math.max(0, data.stopCount - 1)
    const extraRegionFee = (extraFareRow.extraRegionFee || 0) * Math.max(0, uniqueRegions.length - 1)
    const total = baseFare + extraStopFee + extraRegionFee

    const baseFareLabel = baseFareRegion ? `${baseFareRegion} 기본료` : '기본료'
    const formula = `${baseFareLabel} ${(baseFare || 0).toLocaleString()}원 + 경유료 ${(extraFareRow.extraStopFee || 0).toLocaleString()}원 × (착지수 ${data.stopCount} - 1) + 지역료 ${(extraFareRow.extraRegionFee || 0).toLocaleString()}원 × (지역수 ${uniqueRegions.length} - 1) = ${total.toLocaleString()}원`

    const uiResult: CalculationResult = {
      baseFare,
      extraStopFee,
      extraRegionFee,
      total,
      formula
    }

    setResult(uiResult)
    toast.success('요율이 계산되었습니다.')
  }

  const handleCopyResult = () => {
    if (!result) return

    let text = `요율 계산 결과\n`
    text += `${result.formula}\n`
    
    text += `- 기본료: ₩${result.baseFare.toLocaleString()}\n`
    text += `- 착당운임: ₩${result.extraStopFee.toLocaleString()}\n`
    text += `- 지역운임: ₩${result.extraRegionFee.toLocaleString()}\n`
    text += `- 총 운임: ₩${result.total.toLocaleString()}`

    navigator.clipboard.writeText(text).then(() => {
      toast.success('계산 결과가 복사되었습니다')
    })
  }

  const handleClose = () => {
    form.reset()
    setResult(null)
    setMissingData(null)
    onOpenChange(false)
  }

  const handleCreateMissingFare = () => {
    if (!missingData || !onOpenCreate) return

    const prefilledData = {
      centerId: missingData.loadingPointId,
      centerName: missingData.centerName,
      vehicleTypeId: missingData.vehicleTypeId,
      vehicleTypeName: missingData.vehicleTypeName,
      region: missingData.type === 'basic' ? (missingData.region || '') : '',
      fareType: missingData.type === 'basic' ? '기본운임' : '경유운임'
    }

    onOpenCreate(prefilledData)
  }

    return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] rounded-2xl shadow-lg">
        <DialogHeader className="text-left pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            요율 계산기
          </DialogTitle>
          <DialogDescription>
            조건을 선택하여 운임을 계산해보세요
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCalculate)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* 상차지 선택 */}
                <FormField
                  control={form.control}
                  name="loadingPointId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">센터 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl border-2 focus:border-blue-500">
                            <SelectValue placeholder="센터 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingPointOptions.map(option => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.centerName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 차량톤수 */}
                <FormField
                  control={form.control}
                  name="vehicleTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">차량톤수 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl border-2 focus:border-blue-500">
                            <SelectValue placeholder="톤수 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableVehicleTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 지역 */}
                <FormField
                  control={form.control}
                  name="regions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">지역 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: 서울, 경기, 인천 (쉼표 구분)"
                          className="h-11 rounded-xl border-2 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 착지 수 */}
                <FormField
                  control={form.control}
                  name="stopCount"
                  render={({ field }) => {
                    const regionCount = (regionsValue || '')
                      .split(',')
                      .map(region => region.trim())
                      .filter(region => region.length > 0).length
                    const minStops = Math.max(1, regionCount)
                    
                    return (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          착지 수 * {regionCount > 0 && `(최소 ${regionCount}개)`}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={minStops}
                            placeholder={`예: ${minStops}`}
                            className="h-11 rounded-xl border-2 focus:border-blue-500"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Calculator className="w-4 h-4 mr-2" />
                요율 계산하기
              </Button>
            </form>
          </Form>

          {/* 누락된 요율 정보 */}
          {missingData && (
            <div className="mt-6">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium text-orange-800">
                      {missingData.type === 'basic' 
                        ? `${missingBasicRegionLabel ? `${missingBasicRegionLabel} 지역의 기본운임이` : '기본운임이'} 등록되지 않았습니다.`
                        : `${missingData.centerName} - ${missingData.vehicleTypeName}의 경유운임 요율이 등록되지 않았습니다.`
                      }
                    </p>
                    <div className="text-sm text-orange-700">
                      <p><strong>필요한 정보:</strong></p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>센터: {missingData.centerName}</li>
                        {missingData.loadingPointName && <li>상차지: {missingData.loadingPointName}</li>}
                        <li>차량톤수: {missingData.vehicleTypeName}</li>
                        {missingData.region && <li>지역: {missingData.region}</li>}
                        <li>요율종류: {missingData.type === 'basic' ? '기본운임' : '경유운임'}</li>
                      </ul>
                    </div>
                    {onOpenCreate && (
                      <Button 
                        onClick={handleCreateMissingFare}
                        className="mt-3 h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        지금 등록하기
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* 계산 결과 */}
          {result && (
            <div className="mt-6">
              <Card className="rounded-2xl shadow-sm border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      계산 결과
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyResult}
                      className="bg-white"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      복사
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-lg border text-sm">
                      <span className="font-semibold text-green-800">계산식:</span>
                      <div className="mt-1 text-gray-700">{result.formula}</div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">기본료:</span>
                      <span className="font-medium">₩{result.baseFare.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">착당운임 (착지 {extraStopDisplay}개):</span>
                      <span className="font-medium">₩{result.extraStopFee.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">지역이동비 (지역 {extraRegionDisplay}개):</span>
                      <span className="font-medium">₩{result.extraRegionFee.toLocaleString()}</span>
                    </div>
                    
                    <hr className="border-green-200" />
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-green-900">총 운임:</span>
                      <span className="text-green-900">₩{result.total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
