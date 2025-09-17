'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
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
import { Edit } from 'lucide-react'
import { checkDuplicateFare, type FareRow, VEHICLE_TYPE_OPTIONS } from '@/lib/utils/center-fares'
import { toast } from 'react-hot-toast'
import { useCenters } from '@/hooks/useCenters'

// 조건부 검증 스키마
const fareSchema = z.object({
  centerId: z.string().min(1, '센터를 선택하세요'),
  centerName: z.string().min(1, '센터명이 필요합니다'),
  vehicleTypeId: z.string().min(1, '차량톤수를 선택하세요'),
  vehicleTypeName: z.string().min(1, '차량톤수명이 필요합니다'),
  region: z.string().optional(),
  fareType: z.enum(['기본운임', '경유+지역'], {
    required_error: '요율종류를 선택하세요'
  }),
  baseFare: z.coerce.number().optional(),
  extraStopFee: z.coerce.number().optional(),
  extraRegionFee: z.coerce.number().optional(),
}).refine((data) => {
  // 기본운임일 때: 지역과 기본운임 필수
  if (data.fareType === '기본운임') {
    return data.region && data.region.trim() && 
           data.baseFare !== undefined && data.baseFare > 0
  }
  // 경유+지역일 때: 경유운임, 지역운임만 필수 (지역 불필요)
  if (data.fareType === '경유+지역') {
    return data.extraStopFee !== undefined && data.extraStopFee > 0 &&
           data.extraRegionFee !== undefined && data.extraRegionFee > 0
  }
  return false
}, {
  message: '요율종류에 맞는 필수 항목을 입력하세요',
  path: ['fareType']
})

type FareForm = z.infer<typeof fareSchema>

interface SimpleCenterFareEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: FareRow | null
  onSubmit: (row: FareRow) => void
  existingRows: FareRow[]
}


export function SimpleCenterFareEditModal({ 
  open, 
  onOpenChange, 
  row,
  onSubmit,
  existingRows
}: SimpleCenterFareEditModalProps) {
  const { centers } = useCenters()
  
  const form = useForm<FareForm>({
    resolver: zodResolver(fareSchema),
    defaultValues: {
      centerId: '',
      centerName: '',
      vehicleTypeId: '',
      vehicleTypeName: '',
      region: '',
      fareType: '기본운임',
      baseFare: undefined,
      extraStopFee: undefined,
      extraRegionFee: undefined,
    },
  })

  const watchedFareType = form.watch('fareType')

  // Load row data when modal opens
  useEffect(() => {
    if (row && open) {
      form.reset({
        centerId: row.centerId,
        centerName: row.centerName,
        vehicleTypeId: row.vehicleTypeId,
        vehicleTypeName: row.vehicleTypeName,
        region: row.region,
        fareType: row.fareType,
        baseFare: row.baseFare,
        extraStopFee: row.extraStopFee,
        extraRegionFee: row.extraRegionFee,
      })
    }
  }, [row, open, form])

  const handleSubmit = (data: FareForm) => {
    if (!row) return

    // 요율종류별 중복 체크 (자기 자신 제외)
    let isDuplicate = false
    if (data.fareType === '기본운임') {
      // 기본운임: 센터 + 차량톤수 + 지역 조합 체크
      isDuplicate = existingRows.some(existingRow => 
        existingRow.id !== row.id &&
        existingRow.centerId === data.centerId && 
        existingRow.vehicleTypeId === data.vehicleTypeId &&
        existingRow.region === data.region &&
        existingRow.fareType === '기본운임'
      )
      if (isDuplicate) {
        toast.error(`동일한 센터(${data.centerName}), 차량톤수(${data.vehicleTypeName}), 지역(${data.region})의 기본운임이 이미 존재합니다.`)
        return
      }
    } else {
      // 경유+지역: 센터 + 차량톤수 조합 체크
      isDuplicate = existingRows.some(existingRow => 
        existingRow.id !== row.id &&
        existingRow.centerId === data.centerId && 
        existingRow.vehicleTypeId === data.vehicleTypeId &&
        existingRow.fareType === '경유+지역'
      )
      if (isDuplicate) {
        toast.error(`동일한 센터(${data.centerName}), 차량톤수(${data.vehicleTypeName})의 경유+지역 요율이 이미 존재합니다.`)
        return
      }
    }

    // 요율종류에 따른 조건부 필드 설정
    const updatedRow: FareRow = {
      ...row,
      centerId: data.centerId,
      centerName: data.centerName,
      vehicleTypeId: data.vehicleTypeId,
      vehicleTypeName: data.vehicleTypeName,
      // 기본운임일 때만 지역 저장, 경유+지역일 때는 빈 문자열
      region: data.fareType === '기본운임' ? (data.region || '') : '',
      fareType: data.fareType,
      // 기본운임일 때: 기본운임만 설정, 나머지는 undefined
      // 경유+지역일 때: 경유운임, 지역운임만 설정, 기본운임은 undefined
      baseFare: data.fareType === '기본운임' ? data.baseFare : undefined,
      extraStopFee: data.fareType === '경유+지역' ? data.extraStopFee : undefined,
      extraRegionFee: data.fareType === '경유+지역' ? data.extraRegionFee : undefined,
    }
    
    onSubmit(updatedRow)
    onOpenChange(false)
  }

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const handleCenterChange = (centerId: string) => {
    const center = centers.find(c => c.id === centerId)
    if (center) {
      form.setValue('centerId', centerId)
      form.setValue('centerName', center.name)
    }
  }

  const handleVehicleTypeChange = (vehicleTypeId: string) => {
    const vehicleType = VEHICLE_TYPE_OPTIONS.find(v => v.id === vehicleTypeId)
    if (vehicleType) {
      form.setValue('vehicleTypeId', vehicleTypeId)
      form.setValue('vehicleTypeName', vehicleType.name)
    }
  }


  if (!row) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Edit className="h-6 w-6 text-blue-600" />
            요율 수정
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
              {/* 센터명 */}
              <FormField
                control={form.control}
                name="centerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">센터명</FormLabel>
                    <Select onValueChange={handleCenterChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-2 focus:border-blue-500">
                          <SelectValue placeholder="센터 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {centers.map(center => (
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
                    <FormLabel className="text-sm font-semibold text-gray-700">차량톤수</FormLabel>
                    <Select onValueChange={handleVehicleTypeChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-2 focus:border-blue-500">
                          <SelectValue placeholder="톤수 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VEHICLE_TYPE_OPTIONS.map(type => (
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
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      지역 {watchedFareType === '기본운임' ? '*' : ''}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={watchedFareType === '기본운임' ? "지역 입력 (예: 서울, 경기, 부산)" : "사용안함"}
                        className="h-11 rounded-xl border-2 focus:border-blue-500"
                        disabled={watchedFareType !== '기본운임'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

              <div className="grid grid-cols-2 gap-4">
              {/* 요율종류 */}
              <FormField
                control={form.control}
                name="fareType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">요율종류</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-2 focus:border-blue-500">
                          <SelectValue placeholder="요율종류" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="기본운임">기본운임</SelectItem>
                        <SelectItem value="경유+지역">경유+지역</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div></div>

              </div>

              <div className="grid grid-cols-3 gap-4">
              {/* 기본료 - 기본운임일 때만 필수 */}
              <FormField
                control={form.control}
                name="baseFare"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      기본료 (원) {watchedFareType === '기본운임' ? '*' : ''}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder={watchedFareType === '기본운임' ? "예: 120000" : "사용안함"}
                        className="h-11 rounded-xl border-2 focus:border-blue-500"
                        disabled={watchedFareType !== '기본운임'}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 경유운임 - 경유+지역일 때만 필수 */}
              <FormField
                control={form.control}
                name="extraStopFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      경유운임 (원) {watchedFareType === '경유+지역' ? '*' : ''}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder={watchedFareType === '경유+지역' ? "예: 15000" : "사용안함"}
                        className="h-11 rounded-xl border-2 focus:border-blue-500"
                        disabled={watchedFareType !== '경유+지역'}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 지역운임 - 경유+지역일 때만 필수 */}
              <FormField
                control={form.control}
                name="extraRegionFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      지역운임 (원) {watchedFareType === '경유+지역' ? '*' : ''}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder={watchedFareType === '경유+지역' ? "예: 20000" : "사용안함"}
                        className="h-11 rounded-xl border-2 focus:border-blue-500"
                        disabled={watchedFareType !== '경유+지역'}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

              {/* 버튼 - 우측 하단 고정 */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="h-11 px-6 rounded-xl border-2 hover:bg-gray-50"
              >
                취소
              </Button>
              <Button 
                type="submit"
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold"
              >
                <Edit className="w-4 h-4 mr-2" />
                수정하기
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}