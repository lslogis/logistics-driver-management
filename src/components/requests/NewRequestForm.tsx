'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { TruckIcon, MapPinIcon, Plus, User, Phone, Clock, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLoadingPoints } from '@/hooks/useLoadingPoints'
import { useCenterFares } from '@/hooks/useCenterFares'
import { useDriverAssignment } from '@/hooks/useDriverAssignment'
import { DriverSelector } from '@/components/ui/DriverSelector'
import { toast } from 'react-hot-toast'

// 차량 톤수 옵션
const VEHICLE_TON_OPTIONS = [
  { value: 1, label: '1톤' },
  { value: 1.4, label: '1.4톤' },
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
    requestDate: initialData?.requestDate 
      ? (initialData.requestDate instanceof Date 
         ? initialData.requestDate.toISOString().split('T')[0]
         : new Date(initialData.requestDate).toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0],
    centerCarNo: initialData?.centerCarNo || '',
    vehicleTon: initialData?.vehicleTon || '',
    regions: initialData?.regions ? (Array.isArray(initialData.regions) ? initialData.regions.join(', ') : initialData.regions) : '',
    stops: initialData?.stops || 1,
    notes: initialData?.notes || '',
    baseFare: initialData?.baseFare || 0,
    extraStopFee: initialData?.extraStopFee || 0,
    extraRegionFee: initialData?.extraRegionFee || 0,
    extraAdjustment: initialData?.extraAdjustment || 0,
    adjustmentReason: initialData?.adjustmentReason || '',
    centerBillingTotal: initialData?.centerBillingTotal || 0,
    // 기사 배정 관련 필드
    driverId: initialData?.driverId || '',
    driverName: initialData?.driverName || '',
    driverPhone: initialData?.driverPhone || '',
    driverVehicle: initialData?.driverVehicle || '',
    driverFee: initialData?.driverFee || 0,
    driverNotes: initialData?.driverNotes || '',
    deliveryTime: initialData?.deliveryTime || ''
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


  // 자동계산 함수에서 세부 정보를 반환하는 버전 (실시간으로 복원)
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
    
    // 기본운임 찾기 (모든 지역에 대해 체크)
    const baseFareCandidates = regions.map(region => ({
      region,
      fare: fareRows.find(row =>
        row.loadingPoint?.centerName === selectedCenter.centerName &&
        row.vehicleType === vehicleTypeId &&
        row.fareType === 'BASIC' &&
        (row.region || '') === region
      )
    }))

    const missingBaseFareRegions = baseFareCandidates.filter(item => !item.fare).map(item => item.region)
    
    if (missingBaseFareRegions.length > 0) {
      return { canCalculate: false, baseFare: null, extraStopFee: null, extraRegionFee: null }
    }

    const bestBaseFare = baseFareCandidates
      .map(item => item.fare)
      .reduce((best, current) => 
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

  // 자동계산 함수 (실시간 계산으로 복원)
  const calculateFare = () => {
    // 부족한 필드들을 체크하여 안내 메시지 생성
    const missingFields = []
    if (!formData.loadingPointId) missingFields.push('상차지')
    if (!formData.vehicleTon) missingFields.push('차량톤수')
    if (!formData.regions?.trim()) missingFields.push('배송지역')
    if (!formData.stops || formData.stops < 1) missingFields.push('착지수')
    
    if (missingFields.length > 0) {
      return { 
        total: 0, 
        formula: `입력 필요: ${missingFields.join(', ')}`, 
        canCalculate: false 
      }
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
    
    // 기본운임 찾기 (모든 지역에 대해 체크)
    const baseFareCandidates = regions.map(region => ({
      region,
      fare: fareRows.find(row =>
        row.loadingPoint?.centerName === selectedCenter.centerName &&
        row.vehicleType === vehicleTypeId &&
        row.fareType === 'BASIC' &&
        (row.region || '') === region
      )
    }))

    const missingBaseFareRegions = baseFareCandidates.filter(item => !item.fare).map(item => item.region)
    
    if (missingBaseFareRegions.length > 0) {
      return { 
        total: 0, 
        formula: `기본운임 미등록: ${missingBaseFareRegions.join(', ')}`, 
        canCalculate: false 
      }
    }

    const bestBaseFare = baseFareCandidates
      .map(item => item.fare)
      .reduce((best, current) => 
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

  // 자동계산 결과를 실시간으로 계산 (실시간 안내 메시지 포함)
  const fareCalculation = useMemo(() => {
    return calculateFare()
  }, [formData.loadingPointId, formData.vehicleTon, formData.regions, formData.stops, formData.extraAdjustment, fareRows.length])

  // 자동계산 결과를 수동 입력 필드에 자동으로 반영 (실시간)
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
    
    // centerBillingTotal 계산 (항상 업데이트)
    const totalAmount = (formData.baseFare || 0) + 
                       (formData.extraStopFee || 0) + 
                       (formData.extraRegionFee || 0) + 
                       (formData.extraAdjustment || 0)
    
    if (formData.centerBillingTotal !== totalAmount) {
      setFormData(prev => ({
        ...prev,
        centerBillingTotal: totalAmount
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.loadingPointId, formData.vehicleTon, formData.regions, formData.stops, formData.extraAdjustment, formData.baseFare, formData.extraStopFee, formData.extraRegionFee])


  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3">
      {/* 센터 요청 정보 */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border-2 border-emerald-200 shadow-sm">
        <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center">
          <div className="w-2 h-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full mr-2"></div>
          센터 요청 정보
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* 배송일 */}
          <div>
            <Label htmlFor="requestDate" className="text-xs">
              배송일 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              id="requestDate"
              value={formData.requestDate}
              onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
              className={cn(
                "h-8 border-2 bg-white text-gray-900 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-xs rounded-xl",
                errors.requestDate ? "border-red-300" : "border-emerald-300"
              )}
            />
            {errors.requestDate && (
              <p className="text-xs text-red-500 mt-0.5">{errors.requestDate}</p>
            )}
          </div>

          {/* 센터명 */}
          <div>
            <Label htmlFor="loadingPointId" className="text-xs">
              센터명 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.loadingPointId}
              onValueChange={(value) => setFormData({ ...formData, loadingPointId: value })}
            >
              <SelectTrigger className={cn(
                "h-8 border-2 bg-white text-xs rounded-xl",
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
              <p className="text-xs text-red-500 mt-0.5">{errors.loadingPointId}</p>
            )}
          </div>

          {/* 노선번호 */}
          <div>
            <Label htmlFor="centerCarNo" className="text-xs">
              노선번호 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="centerCarNo"
              placeholder="예: R001"
              value={formData.centerCarNo}
              onChange={(e) => setFormData({ ...formData, centerCarNo: e.target.value })}
              className={cn(
                "h-8 border-2 bg-white text-gray-900 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-xs rounded-xl",
                errors.centerCarNo ? "border-red-300" : "border-emerald-300"
              )}
              maxLength={50}
            />
            {errors.centerCarNo && (
              <p className="text-xs text-red-500 mt-0.5">{errors.centerCarNo}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          {/* 배송지역 */}
          <div>
            <Label htmlFor="regions" className="text-xs">
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
                "h-8 border-2 bg-white text-gray-900 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-xs rounded-xl",
                errors.regions ? "border-red-300" : "border-emerald-300"
              )}
            />
            {errors.regions && (
              <p className="text-xs text-red-500 mt-0.5">{errors.regions}</p>
            )}
          </div>

          {/* 착지수 */}
          <div>
            <Label htmlFor="stops" className="text-xs">
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
                "h-8 border-2 bg-white text-gray-900 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-xs rounded-xl",
                errors.stops ? "border-red-300" : "border-emerald-300"
              )}
            />
            {errors.stops && (
              <p className="text-xs text-red-500 mt-0.5">{errors.stops}</p>
            )}
          </div>

          {/* 차량 톤수 */}
          <div>
            <Label htmlFor="vehicleTon" className="text-xs">
              차량 톤수 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.vehicleTon ? formData.vehicleTon.toString() : ''}
              onValueChange={(value) => setFormData({ ...formData, vehicleTon: value ? parseFloat(value) : '' })}
            >
              <SelectTrigger className={cn(
                "h-8 border-2 bg-white text-xs rounded-xl",
                errors.vehicleTon ? "border-red-300" : "border-emerald-300 focus:border-emerald-500"
              )}>
                <SelectValue placeholder="선택안함" />
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
              <p className="text-xs text-red-500 mt-0.5">{errors.vehicleTon}</p>
            )}
          </div>
        </div>
      </div>

      {/* 요금 및 계산 */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border-2 border-emerald-200 shadow-sm">
        <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center">
          <div className="w-2 h-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full mr-2"></div>
          요금 및 계산
        </h3>
        
        {/* 요금 세부 항목 - 한줄로 */}
        <div className="mb-4">          
          <div className="flex gap-1">
            <div className="flex-1">
              <Label htmlFor="manualBaseFare" className="text-xs text-emerald-700 font-semibold">기본운임</Label>
              <Input
                type="number"
                id="manualBaseFare"
                placeholder="기본운임"
                value={formData.baseFare === 0 ? '' : formData.baseFare}
                onChange={(e) => setFormData({ ...formData, baseFare: parseInt(e.target.value) || 0 })}
                className="h-8 border-2 border-emerald-300 focus:border-emerald-500 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-xs rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="manualExtraStopFee" className="text-xs text-emerald-700 font-semibold">착지수당</Label>
              <Input
                type="number"
                id="manualExtraStopFee"
                placeholder="착지수당"
                value={formData.extraStopFee === 0 ? '' : formData.extraStopFee}
                onChange={(e) => setFormData({ ...formData, extraStopFee: parseInt(e.target.value) || 0 })}
                className="h-8 border-2 border-emerald-300 focus:border-emerald-500 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-xs rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="manualExtraRegionFee" className="text-xs text-emerald-700 font-semibold">지역이동</Label>
              <Input
                type="number"
                id="manualExtraRegionFee"
                placeholder="지역이동"
                value={formData.extraRegionFee === 0 ? '' : formData.extraRegionFee}
                onChange={(e) => setFormData({ ...formData, extraRegionFee: parseInt(e.target.value) || 0 })}
                className="h-8 border-2 border-emerald-300 focus:border-emerald-500 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-xs rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="extraAdjustment" className="text-xs text-emerald-700 font-semibold">추가조정금액</Label>
              <Input
                type="number"
                id="extraAdjustment"
                placeholder="추가조정금액"
                value={formData.extraAdjustment === 0 ? '' : formData.extraAdjustment}
                onChange={(e) => setFormData({ ...formData, extraAdjustment: parseInt(e.target.value) || 0 })}
                className="h-8 border-2 border-emerald-300 focus:border-emerald-500 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-xs rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="adjustmentReason" className="text-xs text-emerald-700 font-semibold">조정사유</Label>
              <Input
                type="text"
                id="adjustmentReason"
                placeholder="조정사유"
                value={formData.adjustmentReason}
                onChange={(e) => setFormData({ ...formData, adjustmentReason: e.target.value })}
                className={cn(
                  "h-8 border-2 bg-white text-gray-900 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-xs rounded-xl",
                  errors.adjustmentReason ? "border-red-300" : "border-emerald-300"
                )}
                maxLength={200}
              />
              {errors.adjustmentReason && (
                <p className="text-xs text-red-500 mt-0.5">{errors.adjustmentReason}</p>
              )}
            </div>
          </div>
        </div>

        {/* 자동계산 결과 또는 요율등록 필요 */}
        <div className={cn(
          "border-2 rounded-2xl p-4 mb-3 h-[120px] shadow-sm",
          fareCalculation.canCalculate 
            ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200" 
            : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
        )}>
          {fareCalculation.canCalculate ? (
            <div className="flex items-center justify-between h-full">
              <div className="text-emerald-700 flex-1">
                <div className="font-bold text-sm">계산된 총 운임</div>
                <div className="text-xs mt-2 whitespace-pre-line font-medium">
                  {fareCalculation.formula}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-800">
                  ₩ {fareCalculation.total.toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center h-full">
              <div className="font-bold text-sm text-amber-700 mb-3">
                {fareCalculation.formula.includes('등록') ? `요율 등록 필요 (${fareCalculation.formula})` : '자동계산 불가 (직접 입력/수정 가능)'}
              </div>
              {!fareCalculation.formula.includes('등록') && (
                <div className="text-xs text-amber-600 mb-3 font-medium">
                  {fareCalculation.formula}
                </div>
              )}
              {/* 요율 등록 필요한 경우 바로 여기에 등록 폼 표시 */}
              {formData.loadingPointId && formData.vehicleTon && (
                <MissingFareRegistration 
                  formData={formData}
                  loadingPoints={loadingPoints}
                  fareRows={fareRows}
                  onFareRegistered={() => refetchCenterFares()}
                  compact={true}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 기사 배정 (선택사항) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-200 shadow-sm">
        <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mr-2"></div>
          기사 배정 (선택사항)
        </h3>
        
        {/* 기사 선택 */}
        <div className="mb-3">
          <Label htmlFor="driver-select" className="text-xs text-blue-700 font-semibold">기사 선택</Label>
          <DriverSelector
            value={formData.driverId}
            onValueChange={(driverId) => setFormData({ ...formData, driverId: driverId || '' })}
            placeholder="기사를 선택하세요 (선택사항)"
            className="mt-1"
          />
        </div>

        {/* 기사 정보 입력 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <div>
            <Label htmlFor="driver-name" className="text-xs text-blue-700 font-semibold">
              <User className="h-3 w-3 inline mr-1" />
              기사명
            </Label>
            <Input
              type="text"
              id="driver-name"
              placeholder="기사명"
              value={formData.driverName}
              onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
              className="h-8 border-2 border-blue-300 focus:border-blue-500 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-xs rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="driver-phone" className="text-xs text-blue-700 font-semibold">
              <Phone className="h-3 w-3 inline mr-1" />
              연락처
            </Label>
            <Input
              type="text"
              id="driver-phone"
              placeholder="010-0000-0000"
              value={formData.driverPhone}
              onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
              className="h-8 border-2 border-blue-300 focus:border-blue-500 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-xs rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="driver-vehicle" className="text-xs text-blue-700 font-semibold">
              <TruckIcon className="h-3 w-3 inline mr-1" />
              차량 정보
            </Label>
            <Input
              type="text"
              id="driver-vehicle"
              placeholder="차종 및 차량번호"
              value={formData.driverVehicle}
              onChange={(e) => setFormData({ ...formData, driverVehicle: e.target.value })}
              className="h-8 border-2 border-blue-300 focus:border-blue-500 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-xs rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="delivery-time" className="text-xs text-blue-700 font-semibold">
              <Clock className="h-3 w-3 inline mr-1" />
              배송 시간
            </Label>
            <Input
              type="text"
              id="delivery-time"
              placeholder="예: 오전 9시, 14:00 등"
              value={formData.deliveryTime}
              onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
              className="h-8 border-2 border-blue-300 focus:border-blue-500 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* 기사 운임 및 비고 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <Label htmlFor="driver-fee" className="text-xs text-blue-700 font-semibold">
              <DollarSign className="h-3 w-3 inline mr-1" />
              기사 운임
            </Label>
            <Input
              type="number"
              id="driver-fee"
              placeholder="0"
              min="0"
              step="1000"
              value={formData.driverFee === 0 ? '' : formData.driverFee}
              onChange={(e) => setFormData({ ...formData, driverFee: parseInt(e.target.value) || 0 })}
              className="h-8 border-2 border-blue-300 focus:border-blue-500 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-xs rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div>
            <Label htmlFor="driver-notes" className="text-xs text-blue-700 font-semibold">비고</Label>
            <Textarea
              id="driver-notes"
              placeholder="추가 메모나 특이사항"
              value={formData.driverNotes}
              onChange={(e) => setFormData({ ...formData, driverNotes: e.target.value })}
              className="h-8 border-2 border-blue-300 focus:border-blue-500 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-xs rounded-xl resize-none"
              rows={1}
            />
          </div>
        </div>

        {/* 수익성 미리보기 */}
        {(formData.driverFee > 0 && formData.centerBillingTotal > 0) && (
          <div className="mt-3 p-2 bg-white/60 backdrop-blur rounded-lg border border-blue-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-700">수익성 미리보기:</span>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  청구: {formData.centerBillingTotal.toLocaleString()}원
                </span>
                <span className="text-gray-600">
                  기사비: {formData.driverFee.toLocaleString()}원
                </span>
                <span className={cn(
                  "font-semibold",
                  (formData.centerBillingTotal - formData.driverFee) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  마진: {(formData.centerBillingTotal - formData.driverFee).toLocaleString()}원
                  ({formData.centerBillingTotal > 0 ? 
                    (((formData.centerBillingTotal - formData.driverFee) / formData.centerBillingTotal) * 100).toFixed(1) 
                    : '0'}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} size="sm" className="h-8 text-xs px-4 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition-all duration-300">
          취소
        </Button>
        <Button type="submit" disabled={isLoading} size="sm" className="h-8 text-xs px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg">
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
  compact?: boolean
}

function MissingFareRegistration({ formData, loadingPoints, fareRows, onFareRegistered, compact = false }: MissingFareRegistrationProps) {
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

  if (compact) {
    return (
      <div className="mt-1">
        <div className="flex gap-2 flex-wrap items-center">
          {needsBaseFare && (
            <>
              <span className="text-xs text-orange-700 font-medium">기본운임:</span>
              <Input
                type="number"
                placeholder="기본운임"
                value={registrationForms.baseFare?.baseFare || ''}
                onChange={(e) => setRegistrationForms(prev => ({
                  ...prev,
                  baseFare: { baseFare: parseInt(e.target.value) || 0 }
                }))}
                className="w-20 h-8 text-xs border-2 border-orange-200 focus:border-orange-400 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleRegisterFare('basic')}
                disabled={isRegistering || !registrationForms.baseFare?.baseFare}
                className="h-8 px-3 text-xs bg-orange-500 hover:bg-orange-600 min-w-[50px]"
              >
                등록
              </Button>
            </>
          )}
          
          {needsBaseFare && needsExtraFare && (
            <div className="text-orange-400 text-xs mx-1">|</div>
          )}
          
          {needsExtraFare && (
            <>
              <span className="text-xs text-orange-700 font-medium">경유운임:</span>
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
                className="w-20 h-8 text-xs border-2 border-orange-200 focus:border-orange-400 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                className="w-20 h-8 text-xs border-2 border-orange-200 focus:border-orange-400 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleRegisterFare('extra')}
                disabled={isRegistering || !registrationForms.extraFare?.extraStopFee || !registrationForms.extraFare?.extraRegionFee}
                className="h-8 px-3 text-xs bg-orange-500 hover:bg-orange-600 min-w-[50px]"
              >
                등록
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 mb-4">
      {(needsBaseFare || needsExtraFare) && (
        <div className="mx-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl shadow-md p-4">
          <div className="text-sm font-bold text-amber-800 mb-3 flex items-center">
            <span className="text-amber-600 mr-2 text-lg">⚠️</span>
            요율 등록 필요
          </div>
          
          <div className="space-y-3">
            {needsBaseFare && (
              <div className="bg-white/90 backdrop-blur rounded-lg p-3 border border-amber-200 shadow-sm">
                <div className="text-sm text-amber-900 font-medium mb-2">
                  <span className="inline-block px-2 py-1 bg-amber-100 rounded text-xs font-bold mr-2">기본운임</span>
                  {selectedCenter.centerName} + {vehicleTypeId} + <span className="text-red-600 font-bold">{regions[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="금액 입력"
                    value={registrationForms.baseFare?.baseFare || ''}
                    onChange={(e) => setRegistrationForms(prev => ({
                      ...prev,
                      baseFare: { baseFare: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-24 h-8 text-sm font-medium border-2 border-amber-200 focus:border-amber-400 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleRegisterFare('basic')}
                    disabled={isRegistering || !registrationForms.baseFare?.baseFare}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white h-8 px-3 text-xs font-bold shadow-md"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    등록
                  </Button>
                </div>
              </div>
            )}

            {needsExtraFare && (
              <div className="bg-white/90 backdrop-blur rounded-lg p-3 border border-amber-200 shadow-sm">
                <div className="text-sm text-amber-900 font-medium mb-2">
                  <span className="inline-block px-2 py-1 bg-amber-100 rounded text-xs font-bold mr-2">경유운임</span>
                  {selectedCenter.centerName} + {vehicleTypeId}
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
                    className="w-24 h-8 text-sm font-medium border-2 border-amber-200 focus:border-amber-400 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    className="w-24 h-8 text-sm font-medium border-2 border-amber-200 focus:border-amber-400 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleRegisterFare('extra')}
                    disabled={isRegistering || !registrationForms.extraFare?.extraStopFee || !registrationForms.extraFare?.extraRegionFee}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white h-8 px-3 text-xs font-bold shadow-md"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    등록
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}