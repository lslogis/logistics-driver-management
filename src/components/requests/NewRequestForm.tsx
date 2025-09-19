'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TruckIcon, MapPinIcon, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLoadingPoints } from '@/hooks/useLoadingPoints'
import { useCenterFares } from '@/hooks/useCenterFares'
import { toast } from 'react-hot-toast'

// 차량 톤수 옵션
const VEHICLE_TON_OPTIONS = [
  { value: 1, label: '1톤' },
  { value: 1.5, label: '1.5톤' },
  { value: 2.5, label: '2.5톤' },
  { value: 3.5, label: '3.5톤' },
  { value: 5, label: '5톤' },
  { value: 8, label: '8톤' },
  { value: 11, label: '11톤' },
  { value: 15, label: '15톤' },
  { value: 25, label: '25톤' }
]

export interface NewRequestFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading?: boolean
  initialData?: any
}

export default function NewRequestForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  initialData 
}: NewRequestFormProps) {
  const [formData, setFormData] = useState({
    loadingPointId: initialData?.loadingPointId || '',
    requestDate: initialData?.requestDate || new Date().toISOString().split('T')[0],
    centerCarNo: initialData?.centerCarNo || '',
    vehicleTon: initialData?.vehicleTon || 1,
    regions: initialData?.regions ? initialData.regions.join(', ') : '',
    stops: initialData?.stops || 1,
    notes: initialData?.notes || '',
    baseFare: initialData?.baseFare || 0,
    extraStopFee: initialData?.extraStopFee || 0,
    extraRegionFee: initialData?.extraRegionFee || 0,
    extraAdjustment: initialData?.extraAdjustment || 0,
    adjustmentReason: initialData?.adjustmentReason || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 로딩포인트 데이터 가져오기
  const { data: loadingPointsData } = useLoadingPoints('', 'active')
  const loadingPoints = loadingPointsData?.pages?.flatMap((page: any) => (page.items || page.data || [])) || []

  // 센터 요율 데이터 가져오기
  const { data: centerFaresData, refetch: refetchCenterFares } = useCenterFares()
  const fareRows = centerFaresData?.fares || []

  // 오늘 날짜를 기본값으로 설정
  useEffect(() => {
    if (!initialData) {
      const today = new Date().toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, requestDate: today }))
    }
  }, [initialData])

  // 폼 검증
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.loadingPointId) {
      newErrors.loadingPointId = '상차지를 선택해주세요'
    }

    if (!formData.requestDate) {
      newErrors.requestDate = '요청일을 입력해주세요'
    }

    if (!formData.centerCarNo?.trim()) {
      newErrors.centerCarNo = '센터 차량번호를 입력해주세요'
    }

    if (!formData.vehicleTon || formData.vehicleTon <= 0) {
      newErrors.vehicleTon = '차량 톤수를 선택해주세요'
    }

    if (!formData.regions?.trim()) {
      newErrors.regions = '배송지역을 입력해주세요'
    } else {
      // 콤마로 구분된 지역 수 계산
      const regionCount = formData.regions.split(',').filter(region => region.trim()).length
      if (!formData.stops || formData.stops < 1) {
        newErrors.stops = '착지 수를 입력해주세요'
      } else if (formData.stops < regionCount) {
        newErrors.stops = '착지 수는 지역 수보다 작을 수 없습니다'
      }
    }

    if (formData.extraAdjustment !== 0 && !formData.adjustmentReason?.trim()) {
      newErrors.adjustmentReason = '조정금액이 있을 때는 조정사유를 입력해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  // 자동계산 함수에서 세부 정보를 반환하는 버전
  const getDetailedFareCalculation = () => {
    if (!formData.loadingPointId || !formData.vehicleTon || !formData.regions || !formData.stops) {
      return { canCalculate: false, baseFare: null, extraStopFee: null, extraRegionFee: null }
    }

    const selectedCenter = loadingPoints.find(lp => lp.id === formData.loadingPointId)
    if (!selectedCenter) {
      return { canCalculate: false, baseFare: null, extraStopFee: null, extraRegionFee: null }
    }

    const regions = formData.regions.split(',').map(r => r.trim()).filter(r => r)
    if (regions.length === 0) {
      return { canCalculate: false, baseFare: null, extraStopFee: null, extraRegionFee: null }
    }

    const vehicleTypeId = `${formData.vehicleTon}톤`
    
    // 기본운임 찾기 (지역별로 가장 높은 금액)
    const baseFareCandidates = regions.map(region => {
      return fareRows.find(row =>
        row.loadingPoint?.centerName === selectedCenter.centerName &&
        row.vehicleType === vehicleTypeId &&
        row.fareType === 'BASIC' &&
        (row.region || '') === region
      )
    }).filter(Boolean)

    if (baseFareCandidates.length === 0) {
      return { canCalculate: false, baseFare: null, extraStopFee: null, extraRegionFee: null }
    }

    const bestBaseFare = baseFareCandidates.reduce((best, current) => 
      (current?.baseFare || 0) > (best?.baseFare || 0) ? current : best
    )

    // 경유운임 찾기
    const extraFareRow = fareRows.find(row =>
      row.loadingPoint?.centerName === selectedCenter.centerName &&
      row.vehicleType === vehicleTypeId &&
      row.fareType === 'STOP_FEE'
    )

    if (!extraFareRow) {
      return { canCalculate: false, baseFare: null, extraStopFee: null, extraRegionFee: null }
    }

    const baseFare = bestBaseFare?.baseFare || 0
    const extraStopFee = (extraFareRow.extraStopFee || 0) * Math.max(0, formData.stops - 1)
    const extraRegionFee = (extraFareRow.extraRegionFee || 0) * Math.max(0, regions.length - 1)

    return {
      canCalculate: true,
      baseFare,
      extraStopFee,
      extraRegionFee
    }
  }

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('입력 정보를 확인해주세요')
      return
    }

    // 콤마로 구분된 지역을 배열로 변환
    const regions = formData.regions.split(',').map(region => region.trim()).filter(region => region)
    
    // 자동계산된 요금 정보 포함
    const detailedCalculation = getDetailedFareCalculation()
    
    const submitData = {
      ...formData,
      regions,
      centerCarNo: formData.centerCarNo.trim(),
      notes: formData.notes.trim() || undefined,
      adjustmentReason: formData.adjustmentReason.trim() || undefined,
      // 계산된 요금 정보 추가
      baseFare: detailedCalculation.baseFare,
      extraStopFee: detailedCalculation.extraStopFee,
      extraRegionFee: detailedCalculation.extraRegionFee
    }

    onSubmit(submitData)
  }

  // 선택된 로딩포인트 정보
  const selectedLoadingPoint = loadingPoints.find(lp => lp.id === formData.loadingPointId)

  // 자동계산 함수
  const calculateFare = () => {
    if (!formData.loadingPointId || !formData.vehicleTon || !formData.regions || !formData.stops) {
      return { total: 0, formula: '필요한 정보를 모두 입력하세요', canCalculate: false }
    }

    const selectedCenter = loadingPoints.find(lp => lp.id === formData.loadingPointId)
    if (!selectedCenter) {
      return { total: 0, formula: '센터 정보를 찾을 수 없습니다', canCalculate: false }
    }

    const regions = formData.regions.split(',').map(r => r.trim()).filter(r => r)
    if (regions.length === 0) {
      return { total: 0, formula: '배송지역을 입력하세요', canCalculate: false }
    }

    const vehicleTypeId = `${formData.vehicleTon}톤`
    
    // 기본운임 찾기 (지역별로 가장 높은 금액)
    const baseFareCandidates = regions.map(region => {
      return fareRows.find(row =>
        row.loadingPoint?.centerName === selectedCenter.centerName &&
        row.vehicleType === vehicleTypeId &&
        row.fareType === 'BASIC' &&
        (row.region || '') === region
      )
    }).filter(Boolean)

    if (baseFareCandidates.length === 0) {
      return { 
        total: 0, 
        formula: `기본운임이 등록되지 않았습니다`, 
        canCalculate: false 
      }
    }

    const bestBaseFare = baseFareCandidates.reduce((best, current) => 
      (current?.baseFare || 0) > (best?.baseFare || 0) ? current : best
    )

    // 경유운임 찾기
    const extraFareRow = fareRows.find(row =>
      row.loadingPoint?.centerName === selectedCenter.centerName &&
      row.vehicleType === vehicleTypeId &&
      row.fareType === 'STOP_FEE'
    )

    if (!extraFareRow) {
      return { 
        total: 0, 
        formula: `경유운임이 등록되지 않았습니다`, 
        canCalculate: false 
      }
    }

    const baseFare = bestBaseFare?.baseFare || 0
    const extraStopFee = (extraFareRow.extraStopFee || 0) * Math.max(0, formData.stops - 1)
    const extraRegionFee = (extraFareRow.extraRegionFee || 0) * Math.max(0, regions.length - 1)
    const total = baseFare + extraStopFee + extraRegionFee + (formData.extraAdjustment || 0)

    const adjustmentText = formData.extraAdjustment ? ` + 조정 ${formData.extraAdjustment.toLocaleString()}원` : ''
    const formula = `기본료 ${baseFare.toLocaleString()}원 + 경유료 ${(extraFareRow.extraStopFee || 0).toLocaleString()}원 × ${Math.max(0, formData.stops - 1)}개\n+ 지역료 ${(extraFareRow.extraRegionFee || 0).toLocaleString()}원 × ${Math.max(0, regions.length - 1)}개${adjustmentText} = ${total.toLocaleString()}원`

    return { total, formula, canCalculate: true }
  }

  const fareCalculation = calculateFare()

  // 자동계산 결과를 수동 입력 필드에 자동으로 반영
  useEffect(() => {
    const detailedCalculation = getDetailedFareCalculation()
    if (detailedCalculation.canCalculate) {
      // 현재 값과 다를 때만 업데이트
      const newBaseFare = detailedCalculation.baseFare || 0
      const newExtraStopFee = detailedCalculation.extraStopFee || 0
      const newExtraRegionFee = detailedCalculation.extraRegionFee || 0
      
      if (formData.baseFare !== newBaseFare || 
          formData.extraStopFee !== newExtraStopFee || 
          formData.extraRegionFee !== newExtraRegionFee) {
        setFormData(prev => ({
          ...prev,
          baseFare: newBaseFare,
          extraStopFee: newExtraStopFee,
          extraRegionFee: newExtraRegionFee
        }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.loadingPointId, formData.vehicleTon, formData.regions, formData.stops, formData.extraAdjustment])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 센터 ↔ 운수사 간 계약 */}
      <Card className="bg-white shadow-lg border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
          <CardTitle className="flex items-center text-emerald-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <span className="text-lg">🏢</span>
              </div>
              <span>센터 ↔ 운수사 간 계약</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 센터명 */}
            <div>
              <Label htmlFor="loadingPointId">
                센터명 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.loadingPointId}
                onValueChange={(value) => setFormData({ ...formData, loadingPointId: value })}
              >
                <SelectTrigger className={cn(
                  "h-11 border-2 bg-white",
                  errors.loadingPointId ? "border-red-300" : "border-emerald-300 focus:border-emerald-500"
                )}>
                  <SelectValue placeholder="센터를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {loadingPoints.map((point: any) => (
                    <SelectItem key={point.id} value={point.id}>
                      {point.centerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.loadingPointId && (
                <p className="text-sm text-red-500 mt-1">{errors.loadingPointId}</p>
              )}
            </div>

            {/* 배송일 */}
            <div>
              <Label htmlFor="requestDate">
                배송일 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id="requestDate"
                value={formData.requestDate}
                onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                className={cn(
                  "h-11 border-2 bg-white",
                  errors.requestDate ? "border-red-300" : "border-emerald-300 focus:border-emerald-500"
                )}
              />
              {errors.requestDate && (
                <p className="text-sm text-red-500 mt-1">{errors.requestDate}</p>
              )}
            </div>

            {/* 노선번호 */}
            <div>
              <Label htmlFor="centerCarNo">
                노선번호 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="centerCarNo"
                placeholder="예: R001"
                value={formData.centerCarNo}
                onChange={(e) => setFormData({ ...formData, centerCarNo: e.target.value })}
                className={cn(
                  "h-11 border-2 bg-white",
                  errors.centerCarNo ? "border-red-300" : "border-emerald-300 focus:border-emerald-500"
                )}
                maxLength={50}
              />
              {errors.centerCarNo && (
                <p className="text-sm text-red-500 mt-1">{errors.centerCarNo}</p>
              )}
            </div>

            {/* 차량 톤수 */}
            <div>
              <Label htmlFor="vehicleTon">
                차량 톤수 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.vehicleTon.toString()}
                onValueChange={(value) => setFormData({ ...formData, vehicleTon: parseFloat(value) })}
              >
                <SelectTrigger className={cn(
                  "h-11 border-2 bg-white",
                  errors.vehicleTon ? "border-red-300" : "border-emerald-300 focus:border-emerald-500"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleTon && (
                <p className="text-sm text-red-500 mt-1">{errors.vehicleTon}</p>
              )}
            </div>
          </div>
          {/* 배송지역과 착지수 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 배송지역 */}
            <div>
              <Label htmlFor="regions">
                배송지역 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="regions"
                placeholder="지역1, 지역2, 지역3..."
                value={formData.regions}
                onChange={(e) => {
                  const newRegions = e.target.value
                  const regionCount = newRegions.split(',').filter(region => region.trim()).length
                  setFormData({ 
                    ...formData, 
                    regions: newRegions,
                    stops: Math.max(formData.stops, regionCount)
                  })
                }}
                className={cn(
                  "h-11 border-2 bg-white",
                  errors.regions ? "border-red-300" : "border-emerald-300 focus:border-emerald-500"
                )}
              />
              {errors.regions && (
                <p className="text-sm text-red-500 mt-1">{errors.regions}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">콤마(,)로 구분하여 입력하세요</p>
            </div>

            {/* 착지수 */}
            <div>
              <Label htmlFor="stops">
                착지 수 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                id="stops"
                min={Math.max(1, formData.regions.split(',').filter(region => region.trim()).length)}
                max="99"
                value={formData.stops}
                onChange={(e) => setFormData({ ...formData, stops: parseInt(e.target.value) || 1 })}
                className={cn(
                  "h-11 border-2 bg-white",
                  errors.stops ? "border-red-300" : "border-emerald-300 focus:border-emerald-500"
                )}
              />
              {errors.stops && (
                <p className="text-sm text-red-500 mt-1">{errors.stops}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">최소 {Math.max(1, formData.regions.split(',').filter(region => region.trim()).length)}개</p>
            </div>
          </div>

          {/* 추가조정금액과 조정사유 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="extraAdjustment">추가 조정금액</Label>
              <Input
                type="number"
                id="extraAdjustment"
                placeholder="추가 조정금액 입력"
                value={formData.extraAdjustment === 0 ? '' : formData.extraAdjustment}
                onChange={(e) => setFormData({ ...formData, extraAdjustment: parseInt(e.target.value) || 0 })}
                className="h-11 border-2 border-emerald-300 focus:border-emerald-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <Label htmlFor="adjustmentReason">조정 사유</Label>
              <Input
                type="text"
                id="adjustmentReason"
                placeholder="조정금액이 있을 때 입력하세요"
                value={formData.adjustmentReason}
                onChange={(e) => setFormData({ ...formData, adjustmentReason: e.target.value })}
                className={cn(
                  "h-11 border-2 bg-white",
                  errors.adjustmentReason ? "border-red-300" : "border-emerald-300 focus:border-emerald-500"
                )}
                maxLength={200}
              />
              {errors.adjustmentReason && (
                <p className="text-sm text-red-500 mt-1">{errors.adjustmentReason}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 자동계산 */}
      <Card className="bg-white shadow-lg border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center justify-between text-blue-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-lg">🧮</span>
              </div>
              <span>자동계산</span>
            </div>
            <div className="text-sm font-normal text-blue-600">
              기본운임 + 경유운임 요율표 기반
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className={cn(
            "border rounded-lg p-4",
            fareCalculation.canCalculate 
              ? "bg-green-50 border-green-200" 
              : "bg-orange-50 border-orange-200"
          )}>
            <div className="flex items-center justify-between">
              <div className={fareCalculation.canCalculate ? "text-green-700" : "text-orange-700"}>
                <div className="font-medium">
                  {fareCalculation.canCalculate ? "계산된 총 운임" : "자동계산 불가"}
                </div>
                <div className="text-sm mt-1 whitespace-pre-line">
                  {fareCalculation.formula}
                </div>
              </div>
              <div className="text-right">
                <div className={cn(
                  "text-2xl font-bold",
                  fareCalculation.canCalculate ? "text-green-800" : "text-orange-800"
                )}>
                  ₩ {fareCalculation.total.toLocaleString()}
                </div>
                {!fareCalculation.canCalculate && (
                  <div className="text-xs text-orange-600 mt-1">
                    모든 정보 입력 후 계산됩니다
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 요금 수동 입력/편집 섹션 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-800">요금 세부 항목</h4>
              <div className="text-xs text-blue-600">직접 입력/수정 가능</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="manualBaseFare" className="text-sm text-blue-700">기본운임</Label>
                <Input
                  type="number"
                  id="manualBaseFare"
                  placeholder="기본운임"
                  value={formData.baseFare === 0 ? '' : formData.baseFare}
                  onChange={(e) => setFormData({ ...formData, baseFare: parseInt(e.target.value) || 0 })}
                  className="h-10 border-2 border-blue-300 focus:border-blue-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <Label htmlFor="manualExtraStopFee" className="text-sm text-blue-700">착지수당</Label>
                <Input
                  type="number"
                  id="manualExtraStopFee"
                  placeholder="착지수당"
                  value={formData.extraStopFee === 0 ? '' : formData.extraStopFee}
                  onChange={(e) => setFormData({ ...formData, extraStopFee: parseInt(e.target.value) || 0 })}
                  className="h-10 border-2 border-blue-300 focus:border-blue-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <Label htmlFor="manualExtraRegionFee" className="text-sm text-blue-700">지역이동</Label>
                <Input
                  type="number"
                  id="manualExtraRegionFee"
                  placeholder="지역이동"
                  value={formData.extraRegionFee === 0 ? '' : formData.extraRegionFee}
                  onChange={(e) => setFormData({ ...formData, extraRegionFee: parseInt(e.target.value) || 0 })}
                  className="h-10 border-2 border-blue-300 focus:border-blue-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* 요율 등록이 필요한 경우 */}
            {formData.loadingPointId && formData.vehicleTon && (
              <MissingFareRegistration 
                formData={formData}
                loadingPoints={loadingPoints}
                fareRows={fareRows}
                onFareRegistered={() => refetchCenterFares()}
              />
            )}
          </div>
        </CardContent>
      </Card>


      {/* 비고 */}
      <Card className="bg-white shadow-lg border-gray-200">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
          <CardTitle className="flex items-center text-gray-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <span className="text-lg">📝</span>
              </div>
              <span>비고</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div>
            <Label htmlFor="notes">추가 요청사항</Label>
            <textarea
              id="notes"
              placeholder="추가 요청사항이나 특이사항을 입력하세요"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all duration-200 resize-none"
              rows={3}
              maxLength={1000}
            />
          </div>
        </CardContent>
      </Card>

      {/* 버튼 */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          취소
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          {isLoading ? '처리중...' : (initialData ? '수정' : '등록')}
        </Button>
      </div>
    </form>
  )
}

// 누락된 요율 등록 컴포넌트
interface MissingFareRegistrationProps {
  formData: any
  loadingPoints: any[]
  fareRows: any[]
  onFareRegistered: () => void
}

function MissingFareRegistration({ formData, loadingPoints, fareRows, onFareRegistered }: MissingFareRegistrationProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationForms, setRegistrationForms] = useState<{
    baseFare?: { baseFare: number }
    extraFare?: { extraStopFee: number, extraRegionFee: number }
  }>({})

  if (!formData.loadingPointId || !formData.vehicleTon) return null

  const selectedCenter = loadingPoints.find(lp => lp.id === formData.loadingPointId)
  if (!selectedCenter) return null

  const vehicleTypeId = `${formData.vehicleTon}톤`
  const regions = formData.regions.split(',').map((r: string) => r.trim()).filter((r: string) => r)

  // 기본운임 체크
  const hasBaseFare = regions.length > 0 && regions.some(region => 
    fareRows.find(row =>
      row.loadingPoint?.centerName === selectedCenter.centerName &&
      row.vehicleType === vehicleTypeId &&
      row.fareType === 'BASIC' &&
      (row.region || '') === region
    )
  )

  // 경유운임 체크
  const hasExtraFare = fareRows.find(row =>
    row.loadingPoint?.centerName === selectedCenter.centerName &&
    row.vehicleType === vehicleTypeId &&
    row.fareType === 'STOP_FEE'
  )

  const needsBaseFare = !hasBaseFare && regions.length > 0
  const needsExtraFare = !hasExtraFare

  if (!needsBaseFare && !needsExtraFare) return null

  const handleRegisterFare = async (type: 'basic' | 'extra') => {
    setIsRegistering(true)
    try {
      const baseData = {
        loadingPointId: formData.loadingPointId,
        vehicleType: vehicleTypeId,
      }

      if (type === 'basic' && registrationForms.baseFare) {
        const createData = {
          ...baseData,
          region: regions[0] || '',
          fareType: 'BASIC',
          baseFare: registrationForms.baseFare.baseFare,
          extraStopFee: null,
          extraRegionFee: null
        }

        const response = await fetch('/api/center-fares', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createData)
        })

        if (!response.ok) throw new Error('기본운임 등록 실패')
        toast.success('기본운임이 등록되었습니다')
      }

      if (type === 'extra' && registrationForms.extraFare) {
        const createData = {
          ...baseData,
          region: null,
          fareType: 'STOP_FEE',
          baseFare: null,
          extraStopFee: registrationForms.extraFare.extraStopFee,
          extraRegionFee: registrationForms.extraFare.extraRegionFee
        }

        const response = await fetch('/api/center-fares', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createData)
        })

        if (!response.ok) throw new Error('경유운임 등록 실패')
        toast.success('경유운임이 등록되었습니다')
      }

      onFareRegistered()
    } catch (error) {
      console.error('요율 등록 오류:', error)
      toast.error('요율 등록에 실패했습니다')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="space-y-4">
      {(needsBaseFare || needsExtraFare) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm font-medium text-yellow-800 mb-3">
            🚨 등록이 필요한 요율이 있습니다
          </div>
          
          {needsBaseFare && (
            <div className="mb-4">
              <div className="text-sm text-yellow-700 mb-2">
                <strong>기본운임 등록:</strong> {selectedCenter.centerName} + {vehicleTypeId} + {regions[0]} + 기본운임
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="기본운임 입력"
                  value={registrationForms.baseFare?.baseFare || ''}
                  onChange={(e) => setRegistrationForms(prev => ({
                    ...prev,
                    baseFare: { baseFare: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-32 h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleRegisterFare('basic')}
                  disabled={isRegistering || !registrationForms.baseFare?.baseFare}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  등록
                </Button>
              </div>
            </div>
          )}

          {needsExtraFare && (
            <div>
              <div className="text-sm text-yellow-700 mb-2">
                <strong>경유운임 등록:</strong> {selectedCenter.centerName} + {vehicleTypeId} + 경유운임
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="착당운임"
                  value={registrationForms.extraFare?.extraStopFee || ''}
                  onChange={(e) => setRegistrationForms(prev => ({
                    ...prev,
                    extraFare: { 
                      ...prev.extraFare,
                      extraStopFee: parseInt(e.target.value) || 0,
                      extraRegionFee: prev.extraFare?.extraRegionFee || 0
                    }
                  }))}
                  className="w-32 h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Input
                  type="number"
                  placeholder="지역운임"
                  value={registrationForms.extraFare?.extraRegionFee || ''}
                  onChange={(e) => setRegistrationForms(prev => ({
                    ...prev,
                    extraFare: { 
                      extraStopFee: prev.extraFare?.extraStopFee || 0,
                      extraRegionFee: parseInt(e.target.value) || 0
                    }
                  }))}
                  className="w-32 h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleRegisterFare('extra')}
                  disabled={isRegistering || !registrationForms.extraFare?.extraStopFee || !registrationForms.extraFare?.extraRegionFee}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  등록
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}