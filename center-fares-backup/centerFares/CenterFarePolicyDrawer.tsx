'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Loader2, AlertCircle, CheckCircle2, Info, Truck, Calculator } from 'lucide-react'
import { useFarePolicy, useUpsertFarePolicy } from '@/hooks/useCenterFares'
import { CenterFare, FarePolicy } from '@/lib/api/center-fares'
import { formatNumber } from '@/lib/utils/format'
import { toast } from 'react-hot-toast'

const farePolicySchema = z.object({
  extraRegionFee: z.coerce.number().nonnegative('0 이상을 입력하세요'),
  extraStopFee: z.coerce.number().nonnegative('0 이상을 입력하세요'),
  maxStops: z.coerce.number().nullable().optional(),
})

type FarePolicyForm = z.infer<typeof farePolicySchema>

interface CenterFarePolicyDrawerProps {
  fare: CenterFare | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CenterFarePolicyDrawer({ fare, open, onOpenChange }: CenterFarePolicyDrawerProps) {
  const { data: policy, isLoading } = useFarePolicy(fare?.centerId, fare?.vehicleTypeId)
  const upsertMutation = useUpsertFarePolicy()

  const form = useForm<FarePolicyForm>({
    resolver: zodResolver(farePolicySchema),
    defaultValues: {
      extraRegionFee: 0,
      extraStopFee: 0,
      maxStops: null,
    },
  })

  // Reset form when policy data changes
  useEffect(() => {
    if (policy && open) {
      form.reset({
        extraRegionFee: policy.extraRegionFee,
        extraStopFee: policy.extraStopFee,
        maxStops: policy.maxStops,
      })
    } else if (!policy && open) {
      form.reset({
        extraRegionFee: 0,
        extraStopFee: 0,
        maxStops: null,
      })
    }
  }, [policy, open, form])

  const onSubmit = async (data: FarePolicyForm) => {
    if (!fare) return

    try {
      const policyData: FarePolicy = {
        centerId: fare.centerId,
        vehicleTypeId: fare.vehicleTypeId,
        extraRegionFee: data.extraRegionFee,
        extraStopFee: data.extraStopFee,
        maxStops: data.maxStops || null,
      }

      await upsertMutation.mutateAsync(policyData)
      toast.success('요율 정책이 성공적으로 저장되었습니다', {
        icon: '✅',
        duration: 3000,
      })
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || '정책 저장 중 오류가 발생했습니다', {
        icon: '❌',
        duration: 4000,
      })
    }
  }

  const handleClose = () => {
    if (!upsertMutation.isPending) {
      onOpenChange(false)
    }
  }

  // Watch for form validation state
  const watchedValues = form.watch()
  const isFormValid = form.formState.isValid

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh] rounded-t-2xl" role="dialog" aria-labelledby="policy-title" aria-describedby="policy-description">
        {/* Header */}
        <DrawerHeader className="p-8 pb-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
          <DrawerTitle id="policy-title" className="text-2xl font-bold flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            요율 정책 설정
          </DrawerTitle>
          <DrawerDescription id="policy-description" className="text-gray-600 mt-2">
            {fare ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  {fare.centerName} • {fare.vehicleTypeName} • {fare.regionName}
                </div>
                <div className="text-sm text-purple-700">
                  기본료: ₩{formatNumber(fare.baseFare)}
                </div>
              </div>
            ) : (
              '센터별, 차량 타입별 요율 계산 정책을 설정합니다.'
            )}
          </DrawerDescription>
        </DrawerHeader>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          {/* Fare Info Card */}
          {fare && (
            <Card className="mb-6 bg-purple-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    정책 적용 대상
                  </h4>
                  <Badge variant={fare.status === 'active' ? 'default' : 'secondary'}>
                    {fare.status === 'active' ? '활성' : '비활성'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-purple-600 font-medium">센터</span>
                    <div className="font-semibold">{fare.centerName}</div>
                  </div>
                  <div>
                    <span className="text-purple-600 font-medium">차량</span>
                    <div className="font-semibold">{fare.vehicleTypeName}</div>
                  </div>
                  <div>
                    <span className="text-purple-600 font-medium">지역</span>
                    <div className="font-semibold">{fare.regionName}</div>
                  </div>
                  <div>
                    <span className="text-purple-600 font-medium">기본료</span>
                    <div className="font-semibold text-green-600">₩{formatNumber(fare.baseFare)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Alert */}
          <Alert className="mb-6 border-purple-200 bg-purple-50">
            <Info className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              요율 정책은 기본료에 추가로 적용되는 지역별 추가비용과 경유지별 추가비용을 설정합니다.
            </AlertDescription>
          </Alert>

          {/* Error Alert */}
          {upsertMutation.isError && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {upsertMutation.error?.message || '정책 저장 중 오류가 발생했습니다. 다시 시도해주세요.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading ? (
            <Card className="border-gray-200">
              <CardContent className="p-8">
                <div className="flex items-center justify-center space-x-2 text-purple-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>기존 정책을 불러오는 중...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Policy Configuration */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      요율 정책 설정
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Extra Region Fee */}
                      <FormField
                        control={form.control}
                        name="extraRegionFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">
                              지역별 추가비용
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  placeholder="예: 5000"
                                  className="h-12 text-base rounded-xl border-2 focus:border-purple-500 transition-colors pl-8"
                                  aria-describedby="extra-region-help"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                  ₩
                                </span>
                              </div>
                            </FormControl>
                            <FormDescription id="extra-region-help" className="text-gray-600">
                              기본 지역 외 다른 지역으로 갈 때 추가되는 비용
                            </FormDescription>
                            <FormMessage className="text-red-600" />
                          </FormItem>
                        )}
                      />

                      {/* Extra Stop Fee */}
                      <FormField
                        control={form.control}
                        name="extraStopFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">
                              경유지별 추가비용
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  placeholder="예: 3000"
                                  className="h-12 text-base rounded-xl border-2 focus:border-purple-500 transition-colors pl-8"
                                  aria-describedby="extra-stop-help"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                  ₩
                                </span>
                              </div>
                            </FormControl>
                            <FormDescription id="extra-stop-help" className="text-gray-600">
                              각 경유지마다 추가되는 비용
                            </FormDescription>
                            <FormMessage className="text-red-600" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Max Stops */}
                    <FormField
                      control={form.control}
                      name="maxStops"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            최대 경유지 수 (선택사항)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="예: 5 (제한 없음은 빈 칸)"
                              className="h-12 text-base rounded-xl border-2 focus:border-purple-500 transition-colors"
                              aria-describedby="max-stops-help"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormDescription id="max-stops-help" className="text-gray-600">
                            빈 칸으로 두면 경유지 수에 제한이 없습니다
                          </FormDescription>
                          <FormMessage className="text-red-600" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Existing Policy Status */}
                {policy && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      기존 정책이 발견되어 폼에 적용되었습니다. 수정 후 저장하세요.
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* Policy Preview */}
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      정책 미리보기
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="text-purple-700 font-medium">기본료:</span> ₩{formatNumber(fare?.baseFare)}
                        </div>
                        <div>
                          <span className="text-purple-700 font-medium">지역 추가비용:</span> ₩{watchedValues.extraRegionFee?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-purple-700 font-medium">경유지 추가비용:</span> ₩{watchedValues.extraStopFee?.toLocaleString() || '0'}
                        </div>
                        <div>
                          <span className="text-purple-700 font-medium">최대 경유지:</span> {watchedValues.maxStops || '제한 없음'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={upsertMutation.isPending}
                    className="h-12 px-6 rounded-xl font-medium"
                    aria-label="정책 설정 취소"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={upsertMutation.isPending || !isFormValid}
                    className="h-12 px-8 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
                  >
                    {upsertMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        정책 저장
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
