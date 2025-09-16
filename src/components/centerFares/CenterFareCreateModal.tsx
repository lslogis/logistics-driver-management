'use client'

import React from 'react'
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
import { Plus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useCreateBaseFare } from '@/hooks/useCenterFares'
import { CreateBaseFareDto } from '@/lib/api/center-fares'
import { toast } from 'react-hot-toast'

const baseFareSchema = z.object({
  centerId: z.string().min(1, '센터를 선택하세요'),
  vehicleTypeId: z.string().min(1, '차량톤수를 선택하세요'),
  regionId: z.string().min(1, '지역을 선택하세요'),
  baseFare: z.coerce.number().int().nonnegative('0 이상을 입력하세요'),
  status: z.enum(['active', 'inactive']).default('active')
})

type BaseFareForm = z.infer<typeof baseFareSchema>

interface CenterFareCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CenterFareCreateModal({ open, onOpenChange }: CenterFareCreateModalProps) {
  const createMutation = useCreateBaseFare()

  const form = useForm<BaseFareForm>({
    resolver: zodResolver(baseFareSchema),
    defaultValues: {
      centerId: '',
      vehicleTypeId: '',
      regionId: '',
      baseFare: 0,
      status: 'active',
    },
  })

  const onSubmit = async (data: BaseFareForm) => {
    try {
      await createMutation.mutateAsync(data as CreateBaseFareDto)
      toast.success('요율이 성공적으로 등록되었습니다', {
        icon: '✅',
        duration: 3000,
      })
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      if (error.status === 409) {
        toast.error('이미 등록된 조합입니다. 다른 조합을 선택해주세요', {
          icon: '⚠️',
          duration: 4000,
        })
      } else {
        toast.error(error.message || '요율 등록 중 오류가 발생했습니다', {
          icon: '❌',
          duration: 4000,
        })
      }
    }
  }

  const handleClose = () => {
    if (!createMutation.isPending) {
      form.reset()
      onOpenChange(false)
    }
  }

  // Watch for form validation state
  const watchedValues = form.watch()
  const isFormValid = form.formState.isValid && 
    watchedValues.centerId && 
    watchedValues.vehicleTypeId && 
    watchedValues.regionId &&
    watchedValues.baseFare > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[600px] rounded-2xl shadow-lg p-0 gap-0"
        aria-labelledby="create-fare-title"
        aria-describedby="create-fare-description"
      >
        {/* Header */}
        <DialogHeader className="p-8 pb-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <DialogTitle 
            id="create-fare-title"
            className="text-2xl font-bold flex items-center gap-3 text-gray-900"
          >
            <div className="p-2 bg-blue-100 rounded-xl">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            새 요율 등록
          </DialogTitle>
          <DialogDescription 
            id="create-fare-description"
            className="text-gray-600 mt-2"
          >
            센터, 차량 타입, 지역별 기본 요율을 등록합니다.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="p-8">
          {/* Error Alert */}
          {createMutation.isError && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {createMutation.error?.message || '등록 중 오류가 발생했습니다. 다시 시도해주세요.'}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Center Selection */}
                <FormField
                  control={form.control}
                  name="centerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        센터 <Badge variant="destructive" className="text-xs">필수</Badge>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-base rounded-xl border-2 focus:border-blue-500 transition-colors">
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
                          <SelectTrigger className="h-12 text-base rounded-xl border-2 focus:border-blue-500 transition-colors">
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

              {/* Region and Fare */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Region Selection */}
                <FormField
                  control={form.control}
                  name="regionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        지역 <Badge variant="destructive" className="text-xs">필수</Badge>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-base rounded-xl border-2 focus:border-blue-500 transition-colors">
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
                          <SelectItem value="region-11">충청북도</SelectItem>
                          <SelectItem value="region-12">전라남도</SelectItem>
                          <SelectItem value="region-13">전라북도</SelectItem>
                          <SelectItem value="region-14">경상남도</SelectItem>
                          <SelectItem value="region-15">경상북도</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                {/* Base Fare Input */}
                <FormField
                  control={form.control}
                  name="baseFare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        기본료 <Badge variant="destructive" className="text-xs">필수</Badge>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="예: 50000"
                            className="h-12 text-base rounded-xl border-2 focus:border-blue-500 transition-colors pl-8"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                            ₩
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-gray-600">
                        원 단위로 입력해주세요 (예: 50,000원 → 50000)
                      </FormDescription>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status Selection */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">활성 상태</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-base rounded-xl border-2 focus:border-blue-500 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            활성
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                            비활성
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-gray-600">
                      비활성 상태에서는 요율 계산에 사용되지 않습니다.
                    </FormDescription>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Preview */}
              {isFormValid && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    등록 미리보기
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div><span className="text-blue-700 font-medium">센터:</span> {watchedValues.centerId}</div>
                      <div><span className="text-blue-700 font-medium">차량:</span> {watchedValues.vehicleTypeId}</div>
                    </div>
                    <div className="space-y-2">
                      <div><span className="text-blue-700 font-medium">지역:</span> {watchedValues.regionId}</div>
                      <div><span className="text-blue-700 font-medium">기본료:</span> ₩{watchedValues.baseFare?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createMutation.isPending}
                  className="h-12 px-6 rounded-xl font-medium"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !isFormValid}
                  className="h-12 px-8 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      등록하기
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}