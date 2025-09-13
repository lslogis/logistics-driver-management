'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { FixedRouteResponse } from '@/lib/validations/fixedRoute'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useLoadingPoints } from '@/hooks/useLoadingPoints'
import { useDrivers } from '@/hooks/useDrivers'

const WEEKDAYS = [
  { value: 0, label: '일' },
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' }
]

const CONTRACT_TYPES = [
  { value: 'FIXED_DAILY', label: '고정(일대)' },
  { value: 'FIXED_MONTHLY', label: '고정(월대)' }
]

export interface FixedRouteFormProps {
  fixedRoute?: FixedRouteResponse | null
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

export default function FixedRouteForm({ fixedRoute, onSubmit, isLoading, onCancel }: FixedRouteFormProps) {
  const [formData, setFormData] = useState({
    routeName: fixedRoute?.routeName || '',
    centerName: fixedRoute?.centerName || '',
    assignedDriverId: fixedRoute?.assignedDriverId || '',
    driverSearchQuery: fixedRoute?.assignedDriverName || '',
    contractType: fixedRoute?.contractType || 'FIXED_DAILY',
    weekdayPattern: fixedRoute?.weekdayPattern || [],
    remarks: fixedRoute?.remarks || '',
    // 일대 계약
    revenueDaily: fixedRoute?.revenueDaily || 0,
    costDaily: fixedRoute?.costDaily || 0,
    // 월대 계약
    revenueMonthly: fixedRoute?.revenueMonthly || 0,
    costMonthly: fixedRoute?.costMonthly || 0,
    // 기사 정보 (수기입력 + 자동완성)
    driverPhone: fixedRoute?.driverPhone || '',
    vehicleNumber: fixedRoute?.vehicleNumber || ''
  })

  const [showDriverDropdown, setShowDriverDropdown] = useState(false)
  const [showRevenueWarning, setShowRevenueWarning] = useState(false)

  // Props 변경 시 formData 업데이트
  useEffect(() => {
    if (fixedRoute) {
      setFormData({
        routeName: fixedRoute.routeName || '',
        centerName: fixedRoute.centerName || '',
        assignedDriverId: fixedRoute.assignedDriverId || '',
        driverSearchQuery: fixedRoute.assignedDriverName || '',
        contractType: fixedRoute.contractType || 'FIXED_DAILY',
        weekdayPattern: fixedRoute.weekdayPattern || [],
        remarks: fixedRoute.remarks || '',
        revenueDaily: fixedRoute.revenueDaily || 0,
        costDaily: fixedRoute.costDaily || 0,
        revenueMonthly: fixedRoute.revenueMonthly || 0,
        costMonthly: fixedRoute.costMonthly || 0,
        driverPhone: fixedRoute.driverPhone || '',
        vehicleNumber: fixedRoute.vehicleNumber || ''
      })
    }
  }, [fixedRoute])

  // Fetch loading points and drivers for select options
  const { data: loadingPointsData } = useLoadingPoints('', 'active')
  // 기사 검색: 검색어가 있을 때만 API 호출
  const { data: driversData, error: driversError, isLoading: driversLoading } = useDrivers(
    formData.driverSearchQuery.trim() || undefined,  // 빈 문자열이면 undefined로 비활성화
    'active'
  )
  
  const loadingPoints = loadingPointsData?.pages?.flatMap((page: any) => page.items || []) || []
  const drivers = useMemo(
    () => driversData?.pages?.flatMap((page: any) => page.drivers || []) || [],
    [driversData]
  )
  
  // 디버깅 로그
  useEffect(() => {
    console.log('기사 검색 상태:', {
      searchQuery: formData.driverSearchQuery,
      showDriverDropdown,
      driversData,
      driversError,
      driversLoading,
      driversCount: drivers.length
    })
  }, [formData.driverSearchQuery, showDriverDropdown, driversData, driversError, driversLoading, drivers])

  // 매출/매입 경고 체크
  useEffect(() => {
    let hasWarning = false
    
    if (formData.contractType === 'FIXED_DAILY') {
      // 일대 계약: 일매출이 일매입보다 작은 경우
      if (formData.revenueDaily > 0 && formData.costDaily > 0 && formData.revenueDaily < formData.costDaily) {
        hasWarning = true
      }
    } else if (formData.contractType === 'FIXED_MONTHLY') {
      // 월대 계약: 월매출이 월매입보다 작은 경우
      if (formData.revenueMonthly > 0 && formData.costMonthly > 0 && formData.revenueMonthly < formData.costMonthly) {
        hasWarning = true
      }
    }
    
    setShowRevenueWarning(hasWarning)
  }, [formData.contractType, formData.revenueDaily, formData.costDaily, formData.revenueMonthly, formData.costMonthly])
  
  // Get unique center names for dropdown
  const centerNames = [...new Set(loadingPoints.map((point: any) => point.centerName))].sort()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 배정기사 필수 검증
    if (!formData.assignedDriverId) {
      alert('배정기사를 선택해주세요.')
      return
    }
    
    // centerName으로 loadingPointId 찾기
    const selectedLoadingPoint = loadingPoints.find(point => point.centerName === formData.centerName)
    if (!selectedLoadingPoint) {
      alert('선택한 센터에 해당하는 상차지를 찾을 수 없습니다.')
      return
    }
    
    // 매출/매입 경고 확인
    if (showRevenueWarning) {
      const confirmMessage = formData.contractType === 'FIXED_DAILY' 
        ? `일매출(${formData.revenueDaily.toLocaleString()}원)이 일매입(${formData.costDaily.toLocaleString()}원)보다 작습니다.\n그래도 저장하시겠습니까?`
        : `월매출(${formData.revenueMonthly.toLocaleString()}원)이 월매입(${formData.costMonthly.toLocaleString()}원)보다 작습니다.\n그래도 저장하시겠습니까?`
      
      if (!window.confirm(confirmMessage)) {
        return
      }
    }
    
    const submitData: any = {
      routeName: formData.routeName,
      loadingPointId: selectedLoadingPoint.id, // centerName 대신 loadingPointId 사용
      assignedDriverId: formData.assignedDriverId || null,
      contractType: formData.contractType,
      weekdayPattern: formData.weekdayPattern,
      remarks: formData.remarks || undefined,
      // 기사 정보
      driverPhone: formData.driverPhone || undefined,
      vehicleNumber: formData.vehicleNumber || undefined
    }

    // 계약 형태에 따른 필드 추가
    if (formData.contractType === 'FIXED_DAILY') {
      submitData.revenueDaily = formData.revenueDaily || undefined
      submitData.costDaily = formData.costDaily || undefined
    } else if (formData.contractType === 'FIXED_MONTHLY') {
      submitData.revenueMonthly = formData.revenueMonthly || undefined
      submitData.costMonthly = formData.costMonthly || undefined
    }

    onSubmit(submitData)
  }

  const handleDriverSearch = (query: string) => {
    setFormData(prev => ({ ...prev, driverSearchQuery: query, assignedDriverId: '' }))
    // 글자를 칠 때만 드롭다운 표시
    setShowDriverDropdown(query.trim().length > 0)
  }

  const selectDriver = (driver: any) => {
    setFormData(prev => ({
      ...prev,
      assignedDriverId: driver.id,
      driverSearchQuery: driver.name,
      // 자동완성: 기사 선택 시 연락처와 차량번호 자동 입력
      driverPhone: driver.phone || prev.driverPhone,
      vehicleNumber: driver.vehicleNumber || prev.vehicleNumber
    }))
    setShowDriverDropdown(false)
  }

  const handleWeekdayChange = (day: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      weekdayPattern: checked 
        ? [...prev.weekdayPattern, day].sort()
        : prev.weekdayPattern.filter(d => d !== day)
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="centerName">
            센터명 <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.centerName}
            onValueChange={(value) => setFormData({ ...formData, centerName: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="센터명 선택" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {centerNames.map((centerName: string) => (
                <SelectItem key={centerName} value={centerName}>
                  {centerName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="routeName">
            노선명 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="routeName"
            required
            value={formData.routeName}
            onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            placeholder="노선명을 입력하세요"
          />
        </div>

        <div className="relative">
          <Label htmlFor="assignedDriverId">
            배정기사 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="assignedDriverId"
            placeholder="기사명을 입력하세요 (검색하여 선택)"
            value={formData.driverSearchQuery}
            onChange={(e) => handleDriverSearch(e.target.value)}
            onFocus={() => {
              // 포커스시에도 글자가 있을 때만 드롭다운 표시
              if (formData.driverSearchQuery.trim().length > 0) {
                setShowDriverDropdown(true)
              }
            }}
            onBlur={() => setTimeout(() => setShowDriverDropdown(false), 200)}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
          {showDriverDropdown && formData.driverSearchQuery.trim().length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-500 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {driversLoading ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  기사 검색 중...
                </div>
              ) : drivers.length > 0 ? (
                drivers.map((driver: any) => (
                  <div
                    key={driver.id}
                    className="px-4 py-3 hover:bg-blue-600 hover:text-white cursor-pointer text-sm border-b border-gray-200 last:border-b-0 transition-all duration-200 active:bg-blue-700"
                    onMouseDown={() => selectDriver(driver)}
                  >
                    <div className="font-bold">{driver.name}</div>
                    <div className="text-xs opacity-90 mt-1">{driver.phone}</div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="contractType">계약형태</Label>
          <Select
            value={formData.contractType}
            onValueChange={(value) => setFormData({ ...formData, contractType: value as 'FIXED_DAILY' | 'FIXED_MONTHLY' | 'CONSIGNED_MONTHLY' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTRACT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 계약 형태별 금액 입력 필드 */}
        {formData.contractType === 'FIXED_DAILY' && (
          <>
            <div>
              <Label htmlFor="revenueDaily">일매출 (원)</Label>
              <p className="text-xs text-gray-500 mb-1">일대 계약: 하루 운행 매출 금액</p>
              <Input
                type="text"
                id="revenueDaily"
                value={formData.revenueDaily}
                onChange={(e) => setFormData({ ...formData, revenueDaily: Number(e.target.value) })}
                className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="costDaily">일매입 (원)</Label>
              <p className="text-xs text-gray-500 mb-1">일대 계약: 하루 운행 매입 비용 (유류비, 톨게이트 등)</p>
              <Input
                type="text"
                id="costDaily"
                value={formData.costDaily}
                onChange={(e) => setFormData({ ...formData, costDaily: Number(e.target.value) })}
                className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                placeholder="0"
              />
            </div>
            
            {/* 매출/매입 경고 메시지 */}
            {showRevenueWarning && formData.contractType === 'FIXED_DAILY' && (
              <div className="md:col-span-2 p-3 bg-yellow-50 border border-yellow-400 rounded-md">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ 주의: 일매출({formData.revenueDaily.toLocaleString()}원)이 일매입({formData.costDaily.toLocaleString()}원)보다 작습니다.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  손실이 발생하는 노선입니다. 계약 조건을 다시 확인해주세요.
                </p>
              </div>
            )}
          </>
        )}

        {formData.contractType === 'FIXED_MONTHLY' && (
          <>
            <div>
              <Label htmlFor="revenueMonthly">월매출 (원)</Label>
              <p className="text-xs text-gray-500 mb-1">월대 계약: 한 달 총 매출 금액 (실제 근무일수 고려한 월 정산)</p>
              <Input
                type="text"
                id="revenueMonthly"
                value={formData.revenueMonthly}
                onChange={(e) => setFormData({ ...formData, revenueMonthly: Number(e.target.value) })}
                className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="costMonthly">월매입 (원)</Label>
              <p className="text-xs text-gray-500 mb-1">월대 계약: 한 달 총 비용 (유류비, 톨게이트, 차량유지비 등)</p>
              <Input
                type="text"
                id="costMonthly"
                value={formData.costMonthly}
                onChange={(e) => setFormData({ ...formData, costMonthly: Number(e.target.value) })}
                className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                placeholder="0"
              />
            </div>
            
            {/* 매출/매입 경고 메시지 */}
            {showRevenueWarning && formData.contractType === 'FIXED_MONTHLY' && (
              <div className="md:col-span-2 p-3 bg-yellow-50 border border-yellow-400 rounded-md">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ 주의: 월매출({formData.revenueMonthly.toLocaleString()}원)이 월매입({formData.costMonthly.toLocaleString()}원)보다 작습니다.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  손실이 발생하는 노선입니다. 계약 조건을 다시 확인해주세요.
                </p>
              </div>
            )}
          </>
        )}

        {/* 기사 정보 - 수기입력 + 자동완성 */}
        <div>
          <Label htmlFor="driverPhone">기사 연락처</Label>
          <p className="text-xs text-gray-500 mb-1">기사 선택 시 자동 입력되며, 직접 수정 가능합니다</p>
          <Input
            type="tel"
            id="driverPhone"
            value={formData.driverPhone}
            onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            placeholder="010-0000-0000"
          />
        </div>

        <div>
          <Label htmlFor="vehicleNumber">차량번호</Label>
          <p className="text-xs text-gray-500 mb-1">기사 선택 시 자동 입력되며, 직접 수정 가능합니다</p>
          <Input
            type="text"
            id="vehicleNumber"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            placeholder="00가0000"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="remarks">비고</Label>
        <textarea
          id="remarks"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          placeholder="추가 정보나 특이사항을 입력하세요"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
          rows={3}
          maxLength={500}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.remarks.length}/500자
        </p>
      </div>

      <div>
        <Label>운행요일</Label>
        <div className="grid grid-cols-4 gap-3 mt-2">
          {WEEKDAYS.map((day) => (
            <div key={day.value} className="flex items-center space-x-3">
              <Checkbox
                id={`weekday-${day.value}`}
                checked={formData.weekdayPattern.includes(day.value)}
                onCheckedChange={(checked) => handleWeekdayChange(day.value, !!checked)}
              />
              <Label htmlFor={`weekday-${day.value}`} className="text-sm font-medium cursor-pointer">
                {day.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '처리중...' : (fixedRoute ? '수정' : '등록')}
        </Button>
      </div>
    </form>
  )
}