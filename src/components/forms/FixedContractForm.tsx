'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useLoadingPoints } from '@/hooks/useLoadingPoints'
import { useDrivers } from '@/hooks/useDrivers'
import { extractNumbers, formatPhoneNumber } from '@/lib/utils/format'

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
  { value: 'FIXED_MONTHLY', label: '고정(월대)' },
  { value: 'CONSIGNED_MONTHLY', label: '고정지입' }
]

export interface FixedContractFormProps {
  fixedContract?: any | null
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

export default function FixedContractForm({ fixedContract, onSubmit, isLoading, onCancel }: FixedContractFormProps) {
  const [formData, setFormData] = useState({
    driverId: fixedContract?.driverId || '',
    loadingPointId: fixedContract?.loadingPointId || '',
    routeName: fixedContract?.routeName || '',
    contractType: fixedContract?.contractType || 'FIXED_DAILY',
    operatingDays: fixedContract?.operatingDays || [],
    monthlyRevenue: fixedContract?.monthlyRevenue || 0,
    dailyRevenue: fixedContract?.dailyRevenue || 0,
    monthlyOperatingCost: fixedContract?.monthlyOperatingCost || 0,
    dailyOperatingCost: fixedContract?.dailyOperatingCost || 0,
    specialConditions: fixedContract?.specialConditions || '',
    remarks: fixedContract?.remarks || '',
    // 기사 정보 (자동완성용)
    driverSearchQuery: fixedContract?.driver?.name || '',
    driverPhone: formatPhoneNumber(fixedContract?.driver?.phone || ''),
    vehicleNumber: fixedContract?.driver?.vehicleNumber || ''
  })

  const [showDriverDropdown, setShowDriverDropdown] = useState(false)

  // Props 변경 시 formData 업데이트
  useEffect(() => {
    if (fixedContract) {
      setFormData({
        driverId: fixedContract.driverId || '',
        loadingPointId: fixedContract.loadingPointId || '',
        routeName: fixedContract.routeName || '',
        contractType: fixedContract.contractType || 'FIXED_DAILY',
        operatingDays: fixedContract.operatingDays || [],
        monthlyRevenue: fixedContract.monthlyRevenue || 0,
        dailyRevenue: fixedContract.dailyRevenue || 0,
        monthlyOperatingCost: fixedContract.monthlyOperatingCost || 0,
        dailyOperatingCost: fixedContract.dailyOperatingCost || 0,
        specialConditions: fixedContract.specialConditions || '',
        remarks: fixedContract.remarks || '',
        driverSearchQuery: fixedContract.driver?.name || '',
        driverPhone: formatPhoneNumber(fixedContract.driver?.phone || ''),
        vehicleNumber: fixedContract.driver?.vehicleNumber || ''
      })
    }
  }, [fixedContract])

  // Fetch loading points and drivers for select options
  const { data: loadingPointsData } = useLoadingPoints('', 'active')
  // 기사 검색: 검색어가 있을 때만 API 호출
  const { data: driversData } = useDrivers(
    formData.driverSearchQuery.trim() || undefined,
    'active'
  )
  
  const loadingPoints = loadingPointsData?.pages?.flatMap((page: any) => page.items || []) || []
  const drivers = useMemo(
    () => driversData?.pages?.flatMap((page: any) => page.drivers || []) || [],
    [driversData]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.driverId) {
      alert('기사를 선택해주세요.')
      return
    }
    
    if (!formData.loadingPointId) {
      alert('상차지를 선택해주세요.')
      return
    }
    
    if (formData.operatingDays.length === 0) {
      alert('최소 하나의 운행요일을 선택해주세요.')
      return
    }
    
    const submitData = {
      driverId: formData.driverId,
      loadingPointId: formData.loadingPointId,
      routeName: formData.routeName,
      contractType: formData.contractType,
      operatingDays: formData.operatingDays,
      monthlyRevenue: formData.monthlyRevenue || undefined,
      dailyRevenue: formData.dailyRevenue || undefined,
      monthlyOperatingCost: formData.monthlyOperatingCost || undefined,
      dailyOperatingCost: formData.dailyOperatingCost || undefined,
      specialConditions: formData.specialConditions || undefined,
      remarks: formData.remarks || undefined
    }

    onSubmit(submitData)
  }

  const handleDriverSearch = (query: string) => {
    setFormData(prev => ({ ...prev, driverSearchQuery: query, driverId: '' }))
    setShowDriverDropdown(query.trim().length > 0)
  }

  const selectDriver = (driver: any) => {
    setFormData(prev => ({
      ...prev,
      driverId: driver.id,
      driverSearchQuery: driver.name,
      driverPhone: formatPhoneNumber(driver.phone || ''),
      vehicleNumber: driver.vehicleNumber || '',
      routeName: prev.routeName || `${driver.name} 고정노선` // 자동 생성
    }))
    setShowDriverDropdown(false)
  }

  const handleWeekdayChange = (day: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      operatingDays: checked 
        ? [...prev.operatingDays, day].sort()
        : prev.operatingDays.filter((d: number) => d !== day)
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 기사 선택 */}
        <div className="relative">
          <Label htmlFor="driverSearch">
            기사명 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="driverSearch"
            placeholder="기사명을 입력하여 검색하세요"
            value={formData.driverSearchQuery}
            onChange={(e) => handleDriverSearch(e.target.value)}
            onFocus={() => {
              if (formData.driverSearchQuery.trim().length > 0) {
                setShowDriverDropdown(true)
              }
            }}
            onBlur={() => setTimeout(() => setShowDriverDropdown(false), 200)}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
          {showDriverDropdown && formData.driverSearchQuery.trim().length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-500 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {drivers.length > 0 ? (
                drivers.map((driver: any) => (
                  <div
                    key={driver.id}
                    className="px-4 py-3 hover:bg-blue-600 hover:text-white cursor-pointer text-sm border-b border-gray-200 last:border-b-0 transition-all duration-200"
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

        {/* 상차지 선택 */}
        <div>
          <Label htmlFor="loadingPointId">
            상차지 <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.loadingPointId}
            onValueChange={(value) => setFormData({ ...formData, loadingPointId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="상차지 선택" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {loadingPoints.map((point: any) => (
                <SelectItem key={point.id} value={point.id}>
                  {point.centerName} - {point.loadingPointName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 기사 정보 (자동채움) */}
        <div>
          <Label htmlFor="driverPhone">기사 연락처 <span className="text-gray-500 text-xs">(자동)</span></Label>
          <Input
            type="tel"
            id="driverPhone"
            value={formData.driverPhone}
            disabled
            className="h-11 border-2 border-gray-300 bg-gray-50 text-gray-600 font-medium"
            placeholder="기사 선택 시 자동 입력"
          />
        </div>

        <div>
          <Label htmlFor="vehicleNumber">차량번호 <span className="text-gray-500 text-xs">(자동)</span></Label>
          <Input
            type="text"
            id="vehicleNumber"
            value={formData.vehicleNumber}
            disabled
            className="h-11 border-2 border-gray-300 bg-gray-50 text-gray-600 font-medium"
            placeholder="기사 선택 시 자동 입력"
          />
        </div>

        {/* 노선명 */}
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

        {/* 계약형태 */}
        <div>
          <Label htmlFor="contractType">계약형태 <span className="text-red-500">*</span></Label>
          <Select
            value={formData.contractType}
            onValueChange={(value) => setFormData({ ...formData, contractType: value as any })}
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
              <Label htmlFor="dailyRevenue">일매출 (원)</Label>
              <Input
                type="number"
                id="dailyRevenue"
                value={formData.dailyRevenue}
                onChange={(e) => setFormData({ ...formData, dailyRevenue: Number(e.target.value) })}
                className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="dailyOperatingCost">일운영비 (원)</Label>
              <Input
                type="number"
                id="dailyOperatingCost"
                value={formData.dailyOperatingCost}
                onChange={(e) => setFormData({ ...formData, dailyOperatingCost: Number(e.target.value) })}
                className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                placeholder="0"
              />
            </div>
          </>
        )}

        {(formData.contractType === 'FIXED_MONTHLY' || formData.contractType === 'CONSIGNED_MONTHLY') && (
          <>
            <div>
              <Label htmlFor="monthlyRevenue">월매출 (원)</Label>
              <Input
                type="number"
                id="monthlyRevenue"
                value={formData.monthlyRevenue}
                onChange={(e) => setFormData({ ...formData, monthlyRevenue: Number(e.target.value) })}
                className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="monthlyOperatingCost">월운영비 (원)</Label>
              <Input
                type="number"
                id="monthlyOperatingCost"
                value={formData.monthlyOperatingCost}
                onChange={(e) => setFormData({ ...formData, monthlyOperatingCost: Number(e.target.value) })}
                className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                placeholder="0"
              />
            </div>
          </>
        )}
      </div>

      {/* 운행요일 */}
      <div>
        <Label>운행요일 <span className="text-red-500">*</span></Label>
        <div className="grid grid-cols-4 gap-3 mt-2">
          {WEEKDAYS.map((day) => (
            <div key={day.value} className="flex items-center space-x-3">
              <Checkbox
                id={`weekday-${day.value}`}
                checked={formData.operatingDays.includes(day.value)}
                onCheckedChange={(checked) => handleWeekdayChange(day.value, !!checked)}
              />
              <Label htmlFor={`weekday-${day.value}`} className="text-sm font-medium cursor-pointer">
                {day.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* 특이사항 */}
      <div>
        <Label htmlFor="specialConditions">특이사항</Label>
        <textarea
          id="specialConditions"
          value={formData.specialConditions}
          onChange={(e) => setFormData({ ...formData, specialConditions: e.target.value })}
          placeholder="특이사항을 입력하세요"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
          rows={3}
          maxLength={500}
        />
      </div>

      {/* 비고 */}
      <div>
        <Label htmlFor="remarks">비고</Label>
        <textarea
          id="remarks"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          placeholder="추가 정보나 비고를 입력하세요"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '처리중...' : (fixedContract ? '수정' : '등록')}
        </Button>
      </div>
    </form>
  )
}