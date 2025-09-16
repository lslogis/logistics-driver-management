'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDebouncedCallback } from 'use-debounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useOptimisticQuote } from '@/hooks/useOptimisticQuote'
import { ErrorRecovery, MissingFareError } from '@/components/ui/error-boundary'
import { 
  Calculator, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  TrendingUp,
  Clock
} from 'lucide-react'

// 기존 스키마는 동일...
const charterFormSchema = z.object({
  date: z.string().min(1, '운행일은 필수입니다'),
  centerId: z.string().min(1, '센터를 선택해주세요'),
  vehicleType: z.string().min(1, '차량 타입을 선택해주세요'),
  driverId: z.string().min(1, '기사를 선택해주세요'),
  destinations: z.array(z.object({
    region: z.string().min(1, '지역을 입력해주세요'),
    order: z.number().min(1, '순서는 1 이상이어야 합니다')
  })).min(1, '목적지는 최소 1개 이상이어야 합니다'),
  totalFare: z.number().int().min(0, '총 금액은 0 이상이어야 합니다'),
  driverFare: z.number().int().min(0, '기사 금액은 0 이상이어야 합니다'),
})

type CharterFormData = z.infer<typeof charterFormSchema>

export function EnhancedCharterForm({ onSubmit, initialData }: {
  onSubmit: (data: CharterFormData) => Promise<void>
  initialData?: Partial<CharterFormData>
}) {
  const [formProgress, setFormProgress] = useState(0)
  const [showMissingFareModal, setShowMissingFareModal] = useState(false)
  
  const form = useForm<CharterFormData>({
    resolver: zodResolver(charterFormSchema),
    defaultValues: initialData,
    mode: 'onChange' // 실시간 검증
  })

  const { 
    isCalculating, 
    result, 
    error: quoteError,
    calculateQuote,
    cancelCalculation 
  } = useOptimisticQuote()

  // 폼 완성도 계산
  const calculateProgress = useCallback(() => {
    const values = form.getValues()
    const fields = ['date', 'centerId', 'vehicleType', 'driverId']
    const completed = fields.filter(field => {
      const value = values[field as keyof CharterFormData]
      return value && value.toString().trim() !== ''
    }).length
    
    const destinationsScore = values.destinations?.length > 0 ? 1 : 0
    const totalFields = fields.length + 1
    
    return Math.round(((completed + destinationsScore) / totalFields) * 100)
  }, [form])

  // 실시간 폼 진행률 업데이트
  useEffect(() => {
    const subscription = form.watch(() => {
      setFormProgress(calculateProgress())
    })
    return () => subscription.unsubscribe()
  }, [form, calculateProgress])

  // 디바운스된 요금 계산
  const debouncedCalculate = useDebouncedCallback(
    (values: CharterFormData) => {
      if (values.centerId && values.vehicleType && values.destinations?.length > 0) {
        calculateQuote({
          centerId: values.centerId,
          vehicleType: values.vehicleType,
          destinations: values.destinations.map(d => ({
            region: d.region,
            order: d.order
          }))
        })
      }
    },
    800 // 800ms 디바운스
  )

  // 폼 값 변경 시 자동 계산
  useEffect(() => {
    const subscription = form.watch((values) => {
      debouncedCalculate(values as CharterFormData)
    })
    return () => subscription.unsubscribe()
  }, [form, debouncedCalculate])

  // 실시간 유효성 검사 상태
  const fieldValidationStates = useMemo(() => {
    const errors = form.formState.errors
    const touchedFields = form.formState.touchedFields
    
    return {
      date: touchedFields.date ? (errors.date ? 'error' : 'success') : 'default',
      centerId: touchedFields.centerId ? (errors.centerId ? 'error' : 'success') : 'default',
      vehicleType: touchedFields.vehicleType ? (errors.vehicleType ? 'error' : 'success') : 'default',
      driverId: touchedFields.driverId ? (errors.driverId ? 'error' : 'success') : 'default',
    }
  }, [form.formState.errors, form.formState.touchedFields])

  const handleMissingFareError = () => {
    setShowMissingFareModal(true)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* 폼 진행률 표시 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-blue-800">용차 등록 진행률</CardTitle>
            <Badge variant={formProgress === 100 ? "default" : "secondary"}>
              {formProgress}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={formProgress} className="w-full h-2" />
          <p className="text-sm text-blue-600 mt-2">
            {formProgress < 100 
              ? '필수 정보를 모두 입력하면 자동으로 요금이 계산됩니다'
              : '모든 정보가 입력되었습니다!'
            }
          </p>
        </CardContent>
      </Card>

      {/* 기본 정보 입력 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {/* 각 필드에 실시간 검증 상태 표시 */}
          <div>
            <Label htmlFor="date" className="flex items-center gap-2">
              운행일
              {fieldValidationStates.date === 'success' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {fieldValidationStates.date === 'error' && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </Label>
            <Input
              id="date"
              type="date"
              {...form.register('date')}
              className={`mt-1 ${
                fieldValidationStates.date === 'success' ? 'border-green-300 focus:border-green-500' :
                fieldValidationStates.date === 'error' ? 'border-red-300 focus:border-red-500' : ''
              }`}
            />
            {form.formState.errors.date && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.date.message}</p>
            )}
          </div>

          {/* 다른 필드들도 동일한 패턴... */}
        </CardContent>
      </Card>

      {/* 실시간 요금 계산 표시 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              요금 정보
              {isCalculating && <Loader2 className="h-4 w-4 animate-spin" />}
            </span>
            {result && (
              <Badge variant="outline" className="text-green-600 border-green-300">
                <Clock className="h-3 w-3 mr-1" />
                실시간 계산됨
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 요금 계산 중 상태 */}
          {isCalculating && !result && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-3" />
              <p className="text-gray-600">요금을 계산하고 있습니다...</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelCalculation}
                className="mt-2"
              >
                취소
              </Button>
            </div>
          )}

          {/* 요금 계산 결과 (추정값 포함) */}
          {result && (
            <div className={`p-4 rounded-lg border ${
              (result as any).isEstimated 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {(result as any).isEstimated ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">예상 요금 (계산 중)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">최종 계산 요금</span>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">기본료</div>
                  <div className="font-medium">{result.baseFare?.toLocaleString()}원</div>
                </div>
                <div>
                  <div className="text-gray-600">지역료</div>
                  <div className="font-medium">{result.regionFare?.toLocaleString()}원</div>
                </div>
                <div>
                  <div className="text-gray-600">콜료</div>
                  <div className="font-medium">{result.stopFare?.toLocaleString()}원</div>
                </div>
                <div>
                  <div className="text-gray-600">총 요금</div>
                  <div className="font-bold text-lg">{result.totalFare?.toLocaleString()}원</div>
                </div>
              </div>
            </div>
          )}

          {/* 요금 계산 오류 */}
          {quoteError && (
            <ErrorRecovery
              error={{
                type: 'missing_fare',
                message: quoteError,
              }}
              onQuickFix={handleMissingFareError}
              onRetry={() => {
                const values = form.getValues()
                debouncedCalculate(values)
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* 제출 버튼 */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={formProgress < 100 || isCalculating}
          className="px-8"
        >
          {isCalculating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              계산 완료 대기 중...
            </>
          ) : (
            '용차 등록'
          )}
        </Button>
      </div>
    </form>
  )
}