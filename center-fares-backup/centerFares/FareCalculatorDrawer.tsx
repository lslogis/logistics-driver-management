'use client'

import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calculator, 
  Plus, 
  X, 
  Copy, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  MapPin, 
  Truck, 
  Receipt,
  Info
} from 'lucide-react'
import { useCalculateFare } from '@/hooks/useCenterFares'
import { CalculateFareResult } from '@/lib/api/center-fares'
import { formatNumber } from '@/lib/utils/format'
import { toast } from 'react-hot-toast'

const fareCalculatorSchema = z.object({
  centerId: z.string().min(1, '센터를 선택해주세요'),
  vehicleTypeId: z.string().min(1, '차량 타입을 선택해주세요'),
  legs: z.array(
    z.object({
      regionId: z.string().min(1, '지역을 선택해주세요'),
      stops: z.coerce.number().min(1, '착지 수는 1 이상이어야 합니다'),
    })
  ).min(1, '최소 1개의 지역을 추가해주세요'),
})

type FareCalculatorForm = z.infer<typeof fareCalculatorSchema>

interface FareCalculatorDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FareCalculatorDrawer({ open, onOpenChange }: FareCalculatorDrawerProps) {
  const [result, setResult] = useState<CalculateFareResult | null>(null)
  const calculateMutation = useCalculateFare()

  const form = useForm<FareCalculatorForm>({
    resolver: zodResolver(fareCalculatorSchema),
    defaultValues: {
      centerId: '',
      vehicleTypeId: '',
      legs: [{ regionId: '', stops: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'legs',
  })

  const onSubmit = async (data: FareCalculatorForm) => {
    try {
      const calculationResult = await calculateMutation.mutateAsync(data)
      setResult(calculationResult)
      toast.success('운임이 성공적으로 계산되었습니다', {
        icon: '🧮',
        duration: 3000,
      })
    } catch (error: any) {
      toast.error(error.message || '계산 중 오류가 발생했습니다', {
        icon: '❌',
        duration: 4000,
      })
    }
  }

  const handleClose = () => {
    if (!calculateMutation.isPending) {
      form.reset()
      setResult(null)
      onOpenChange(false)
    }
  }

  const handleCopyResult = () => {
    if (result) {
      const copyText = `운임 계산 결과\n기본료: ₩${formatNumber(result.baseFare)}\n지역 이동비: ₩${formatNumber(result.extraRegionTotal)}\n착지 추가금: ₩${formatNumber(result.extraStopTotal)}\n총 운임: ₩${formatNumber(result.total)}`
      
      navigator.clipboard.writeText(copyText).then(() => {
        toast.success('계산 결과가 클립보드에 복사되었습니다', {
          icon: '📋',
          duration: 2000,
        })
      })
    }
  }

  const totalStops = fields.reduce((sum, field, index) => {
    const stops = form.watch(`legs.${index}.stops`)
    return sum + (stops || 0)
  }, 0)

  const totalRegions = fields.length
  const isFormValid = form.formState.isValid && form.watch('centerId') && form.watch('vehicleTypeId')

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[95vh] rounded-t-2xl" role="dialog" aria-labelledby="calculator-title" aria-describedby="calculator-description">
        {/* Header */}
        <DrawerHeader className="p-8 pb-6 border-b bg-gradient-to-r from-teal-50 to-cyan-50 rounded-t-2xl">
          <DrawerTitle id="calculator-title" className="text-2xl font-bold flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-teal-100 rounded-xl">
              <Calculator className="h-6 w-6 text-teal-600" />
            </div>
            운임 계산기
          </DrawerTitle>
          <DrawerDescription id="calculator-description" className="text-gray-600 mt-2">
            센터, 차량 타입, 배송 지역을 선택하여 정확한 운임을 계산합니다.
          </DrawerDescription>
        </DrawerHeader>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          {/* Info Alert */}
          <Alert className="mb-6 border-teal-200 bg-teal-50">
            <Info className="h-4 w-4 text-teal-600" />
            <AlertDescription className="text-teal-800">
              모든 필드를 정확히 입력하여 정밀한 운임 계산을 받아보세요. 계산 결과는 복사하여 활용할 수 있습니다.
            </AlertDescription>
          </Alert>

          {/* Error Alert */}
          {calculateMutation.isError && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {calculateMutation.error?.message || '계산 중 오류가 발생했습니다. 다시 시도해주세요.'}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Selection Section */}
              <Card className="border-teal-200 bg-teal-50/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-teal-900 flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    기본 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Center Selection */}
                    <FormField
                      control={form.control}
                      name="centerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            출발 센터 <Badge variant="destructive" className="text-xs">필수</Badge>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base rounded-xl border-2 focus:border-teal-500 transition-colors" aria-label="출발 센터 선택">
                                <SelectValue placeholder="센터를 선택해주세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="center-1">서울물류센터</SelectItem>
                              <SelectItem value="center-2">부산물류센터</SelectItem>
                              <SelectItem value="center-3">대구물류센터</SelectItem>
                              <SelectItem value="center-4">인천물류센터</SelectItem>
                              <SelectItem value="center-5">광주물류센터</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-600" />
                        </FormItem>
                      )}
                    />

                    {/* Vehicle Type Selection */}
                    <FormField
                      control={form.control}
                      name="vehicleTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            차량 타입 <Badge variant="destructive" className="text-xs">필수</Badge>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base rounded-xl border-2 focus:border-teal-500 transition-colors" aria-label="차량 타입 선택">
                                <SelectValue placeholder="차량 타입을 선택해주세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="vehicle-1">1TON</SelectItem>
                              <SelectItem value="vehicle-2">2.5TON</SelectItem>
                              <SelectItem value="vehicle-3">5TON</SelectItem>
                              <SelectItem value="vehicle-4">11TON</SelectItem>
                              <SelectItem value="vehicle-5">25TON</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-600" />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Legs Section */}
              <Card className="border-gray-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      배송 지역 설정
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm">
                        {totalRegions}개 지역
                      </Badge>
                      <Badge variant="outline" className="text-sm">
                        총 {totalStops}개 착지
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormDescription className="text-gray-600">
                    배송할 지역과 각 지역의 착지 수를 입력하세요. 여러 지역에 배송하는 경우 지역을 추가할 수 있습니다.
                  </FormDescription>

                  {fields.map((field, index) => (
                    <Card key={field.id} className="border-gray-200 bg-gray-50">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 text-sm font-bold">
                                {index + 1}
                              </div>
                              배송 지역 {index + 1}
                            </h4>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                aria-label={`배송 지역 ${index + 1} 제거`}
                              >
                                <X className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name={`legs.${index}.regionId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base font-semibold">배송 지역</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-12 text-base rounded-xl border-2 focus:border-teal-500 transition-colors" aria-label={`배송 지역 ${index + 1} 선택`}>
                                        <SelectValue placeholder="지역을 선택해주세요" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-xl">
                                      <SelectItem value="region-1">서울특별시</SelectItem>
                                      <SelectItem value="region-2">부산광역시</SelectItem>
                                      <SelectItem value="region-3">대구광역시</SelectItem>
                                      <SelectItem value="region-4">인천광역시</SelectItem>
                                      <SelectItem value="region-5">광주광역시</SelectItem>
                                      <SelectItem value="region-6">대전광역시</SelectItem>
                                      <SelectItem value="region-7">울산광역시</SelectItem>
                                      <SelectItem value="region-8">경기도</SelectItem>
                                      <SelectItem value="region-9">강원도</SelectItem>
                                      <SelectItem value="region-10">충청남도</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-red-600" />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`legs.${index}.stops`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base font-semibold">착지 수</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      placeholder="예: 3"
                                      className="h-12 text-base rounded-xl border-2 focus:border-teal-500 transition-colors"
                                      aria-label={`지역 ${index + 1} 착지 수`}
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormDescription className="text-gray-600">
                                    이 지역에서 배송할 착지의 개수
                                  </FormDescription>
                                  <FormMessage className="text-red-600" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ regionId: '', stops: 1 })}
                    className="w-full h-12 rounded-xl border-2 border-dashed border-teal-300 text-teal-600 hover:bg-teal-50 hover:border-teal-400 transition-colors font-medium"
                    aria-label="배송 지역 추가"
                  >
                    <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
                    지역 추가
                  </Button>
                </CardContent>
              </Card>

              <Separator />

              {/* Calculate Button */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={calculateMutation.isPending || !isFormValid}
                  className="h-14 px-12 rounded-xl font-semibold text-lg bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg"
                >
                  {calculateMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      계산 중...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5 mr-3" />
                      운임 계산하기
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {/* Calculation Result */}
          {result && (
            <Card className="mt-8 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-teal-900 flex items-center gap-2">
                    <Receipt className="h-6 w-6" />
                    계산 결과
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyResult}
                    className="h-10 px-4 rounded-xl border-teal-300 text-teal-700 hover:bg-teal-100 font-medium"
                    aria-label="운임 계산 결과를 클립보드에 복사"
                  >
                    <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                    결과 복사
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-teal-200">
                    <div className="text-sm text-teal-600 font-medium mb-1">기본료</div>
                    <div className="text-xl font-bold text-gray-900">₩{formatNumber(result.baseFare)}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-teal-200">
                    <div className="text-sm text-teal-600 font-medium mb-1">지역 이동비</div>
                    <div className="text-xl font-bold text-gray-900">₩{formatNumber(result.extraRegionTotal)}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-teal-200">
                    <div className="text-sm text-teal-600 font-medium mb-1">착지 추가금</div>
                    <div className="text-xl font-bold text-gray-900">₩{formatNumber(result.extraStopTotal)}</div>
                  </div>
                </div>

                <Separator className="border-teal-200" />

                {/* Total */}
                <div className="bg-white rounded-xl p-6 border-2 border-teal-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-teal-600" />
                      <span className="text-xl font-bold text-gray-900">총 운임</span>
                    </div>
                    <div className="text-3xl font-bold text-teal-600">
                      ₩{formatNumber(result.total)}
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>참고사항:</strong> 이 계산 결과는 기본 요율표를 기준으로 한 참고용입니다. 
                    실제 운임은 거리, 도로 상황, 특수 조건 등에 따라 달라질 수 있습니다.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
