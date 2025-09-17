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
import { Calculator, Copy, CheckCircle2 } from 'lucide-react'
import { type FareRow, VEHICLE_TYPE_OPTIONS } from '@/lib/utils/center-fares'
import { toast } from 'react-hot-toast'
import { useCenters } from '@/hooks/useCenters'

const calculatorSchema = z.object({
  centerId: z.string().min(1, '센터를 선택하세요'),
  vehicleTypeId: z.string().min(1, '차량톤수를 선택하세요'),
  region: z.string().min(1, '지역을 입력하세요'),
  stopCount: z.coerce.number().int().min(1, '착지 수는 1 이상이어야 합니다'),
  regionCount: z.coerce.number().int().min(1, '지역 수는 1 이상이어야 합니다'),
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
  rows: FareRow[]
}


export function SimpleFareCalculatorDrawer({ 
  open, 
  onOpenChange, 
  rows 
}: SimpleFareCalculatorDrawerProps) {
  const [result, setResult] = useState<CalculationResult | null>(null)
  const { centers } = useCenters()

  const form = useForm<CalculatorForm>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      centerId: '',
      vehicleTypeId: '',
      region: '',
      stopCount: 1,
      regionCount: 1,
    },
  })

  const watchedValues = form.watch()

  const handleCalculate = (data: CalculatorForm) => {
    // 기본운임과 경유+지역 요율을 각각 찾기
    const baseFareRow = rows.find(row => 
      row.centerId === data.centerId &&
      row.vehicleTypeId === data.vehicleTypeId &&
      row.region === data.region &&
      row.fareType === '기본운임'
    )
    
    const extraFareRow = rows.find(row => 
      row.centerId === data.centerId &&
      row.vehicleTypeId === data.vehicleTypeId &&
      row.fareType === '경유+지역'
    )

    // 필요한 요율 정보가 없는 경우 에러
    if (!baseFareRow) {
      toast.error('선택한 센터, 차량톤수, 지역의 기본운임을 찾을 수 없습니다. 먼저 기본운임을 등록해주세요.')
      return
    }
    
    if (!extraFareRow) {
      toast.error('선택한 센터, 차량톤수의 경유+지역 요율을 찾을 수 없습니다. 먼저 경유+지역 요율을 등록해주세요.')
      return
    }

    // 필드 검증
    if (baseFareRow.baseFare === undefined || baseFareRow.baseFare === null) {
      toast.error('기본운임 정보가 설정되지 않았습니다.')
      return
    }
    
    if (extraFareRow.extraStopFee === undefined || extraFareRow.extraStopFee === null ||
        extraFareRow.extraRegionFee === undefined || extraFareRow.extraRegionFee === null) {
      toast.error('경유+지역 요율 정보가 완전하지 않습니다.')
      return
    }

    // 계산: 기본운임 + 경유운임 + 지역운임
    const baseFare = baseFareRow.baseFare
    const extraStopFee = extraFareRow.extraStopFee * Math.max(0, data.stopCount - 1)
    const extraRegionFee = extraFareRow.extraRegionFee * Math.max(0, data.regionCount - 1)
    const total = baseFare + extraStopFee + extraRegionFee

    const formula = `총 요율 = 기본료 ${baseFare.toLocaleString()}원 + (착지수 ${data.stopCount} - 1) × ${extraFareRow.extraStopFee.toLocaleString()}원 + (지역수 ${data.regionCount} - 1) × ${extraFareRow.extraRegionFee.toLocaleString()}원 = ${total.toLocaleString()}원`

    const calculationResult: CalculationResult = {
      baseFare,
      extraStopFee,
      extraRegionFee,
      total,
      formula
    }

    setResult(calculationResult)
    toast.success('요율이 계산되었습니다')
  }

  const handleCopyResult = () => {
    if (!result) return

    let text = `요율 계산 결과\n`
    text += `${result.formula}\n`
    
    text += `- 기본료: ₩${result.baseFare.toLocaleString()}\n`
    text += `- 경유운임: ₩${result.extraStopFee.toLocaleString()}\n`
    text += `- 지역운임: ₩${result.extraRegionFee.toLocaleString()}\n`
    text += `- 총 운임: ₩${result.total.toLocaleString()}`

    navigator.clipboard.writeText(text).then(() => {
      toast.success('계산 결과가 복사되었습니다')
    })
  }

  const handleClose = () => {
    form.reset()
    setResult(null)
    onOpenChange(false)
  }

  // Get available options - use all centers and vehicle types, but only registered regions
  const getAvailableOptions = () => {
    // 모든 센터 옵션 표시
    const centerOptions = centers
    
    // 모든 차량톤수 옵션 표시
    const vehicleTypeOptionsList = VEHICLE_TYPE_OPTIONS
    
    return { centerOptions, vehicleTypeOptionsList }
  }

  const { centerOptions, vehicleTypeOptionsList: availableVehicleTypes } = getAvailableOptions()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl shadow-lg">
        <DialogHeader className="text-left pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            요율 계산기
          </DialogTitle>
          <DialogDescription>
            조건을 선택하여 운임을 계산해보세요
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCalculate)} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {/* 센터 선택 */}
                <FormField
                  control={form.control}
                  name="centerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">센터명 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl border-2 focus:border-blue-500">
                            <SelectValue placeholder="센터 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {centerOptions.map(center => (
                            <SelectItem key={center.id} value={center.id}>
                              {center.name}
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

                {/* 지역 */}
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">지역 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="지역 입력 (예: 서울, 경기, 부산)"
                          className="h-11 rounded-xl border-2 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 착지수와 지역수 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 착지 수 */}
                <FormField
                  control={form.control}
                  name="stopCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">착지 수 *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="예: 2"
                          className="h-11 rounded-xl border-2 focus:border-blue-500"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 지역 수 */}
                <FormField
                  control={form.control}
                  name="regionCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">지역 수 *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="예: 1"
                          className="h-11 rounded-xl border-2 focus:border-blue-500"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Calculator className="w-4 h-4 mr-2" />
                요율 계산하기
              </Button>
            </form>
          </Form>

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
                      <span className="text-green-700">경유운임 (착지 {watchedValues.stopCount - 1}개):</span>
                      <span className="font-medium">₩{result.extraStopFee.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">지역운임 (지역 {watchedValues.regionCount - 1}개):</span>
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