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
  { value: 'CONSIGNED_MONTHLY', label: '고정지입' },
  { value: 'CHARTER_PER_RIDE', label: '용차운임' }
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
    centerContractType: fixedContract?.centerContractType || 'FIXED_DAILY',
    driverContractType: fixedContract?.driverContractType || '',
    centerAmount: fixedContract?.centerAmount || '',
    driverAmount: fixedContract?.driverAmount || '',
    operatingDays: fixedContract?.operatingDays || [],
    startDate: fixedContract?.startDate ? new Date(fixedContract.startDate).toISOString().split('T')[0] : '',
    endDate: fixedContract?.endDate ? new Date(fixedContract.endDate).toISOString().split('T')[0] : '',
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
        centerContractType: fixedContract.centerContractType || 'FIXED_DAILY',
        driverContractType: fixedContract.driverContractType || '',
        centerAmount: fixedContract.centerAmount || '',
        driverAmount: fixedContract.driverAmount || '',
        operatingDays: fixedContract.operatingDays || [],
        startDate: fixedContract.startDate ? new Date(fixedContract.startDate).toISOString().split('T')[0] : '',
        endDate: fixedContract.endDate ? new Date(fixedContract.endDate).toISOString().split('T')[0] : '',
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
  
  const loadingPoints = loadingPointsData?.pages?.flatMap((page: any) => (page.items || page.data || [])) || []
  const drivers = useMemo(
    () => driversData?.pages?.flatMap((page: any) => page.drivers || []) || [],
    [driversData]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.loadingPointId) {
      alert('상차지를 선택해주세요.')
      return
    }
    
    if (!formData.routeName) {
      alert('노선명을 입력해주세요.')
      return
    }
    
    if (formData.operatingDays.length === 0) {
      alert('최소 하나의 운행요일을 선택해주세요.')
      return
    }
    
    if (!formData.centerAmount || Number(formData.centerAmount) <= 0) {
      alert('센터 금액을 입력해주세요.')
      return
    }
    
    const submitData = {
      driverId: formData.driverId || undefined,
      loadingPointId: formData.loadingPointId,
      routeName: formData.routeName,
      centerContractType: formData.centerContractType,
      driverContractType: formData.driverContractType || undefined,
      centerAmount: Number(formData.centerAmount) || 0,
      driverAmount: formData.driverAmount ? Number(formData.driverAmount) : undefined,
      operatingDays: formData.operatingDays,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
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
    <form onSubmit={handleSubmit} className="space-y-8 p-6">
      {/* 센터 ⬅️➡️ 운수사 간 계약 */}
      <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
          <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
          센터 ⬅️➡️ 운수사 간 계약
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {point.centerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* 센터 계약형태 */}
          <div>
            <Label htmlFor="centerContractType">센터 계약형태 <span className="text-red-500">*</span></Label>
            <Select
              value={formData.centerContractType}
              onValueChange={(value) => setFormData({ ...formData, centerContractType: value as any })}
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

          {/* 센터 금액 */}
          <div>
            <Label htmlFor="centerAmount">센터 금액 <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              id="centerAmount"
              value={formData.centerAmount}
              onChange={(e) => setFormData({ ...formData, centerAmount: Number(e.target.value) })}
              className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              placeholder="0"
            />
          </div>
        </div>

        {/* 특이사항 */}
        <div className="mt-4">
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
      </div>

      {/* 운수사 ⬅️➡️ 기사 간 계약 */}
      <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
        <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
          <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
          운수사 ⬅️➡️ 기사 간 계약
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 기사 선택 */}
          <div className="relative md:col-span-2">
            <Label htmlFor="driverSearch">
              기사명 <span className="text-gray-500">(선택사항)</span>
            </Label>
            <Input
              type="text"
              id="driverSearch"
              placeholder="기사명을 입력하여 검색하세요 (연락처/차량번호 자동표시)"
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
            {/* 기사 정보 표시 */}
            {formData.driverId && (formData.driverPhone || formData.vehicleNumber) && (
              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                선택된 기사: <span className="font-medium text-gray-900">{formData.driverSearchQuery}</span>
                {(formData.vehicleNumber || formData.driverPhone) && (
                  <span className="ml-2">
                    ({[formData.vehicleNumber, formData.driverPhone].filter(Boolean).join(' / ')})
                  </span>
                )}
              </div>
            )}
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
                      <div className="text-xs opacity-90 mt-1">
                        {[driver.vehicleNumber, formatPhoneNumber(driver.phone || '')].filter(Boolean).join(' / ')}
                      </div>
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

          {/* 기사 계약형태 */}
          <div>
            <Label htmlFor="driverContractType">기사 계약형태 <span className="text-gray-500">(선택사항)</span></Label>
            <Select
              value={formData.driverContractType || "NONE"}
              onValueChange={(value) => setFormData({ ...formData, driverContractType: value === "NONE" ? "" : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="계약형태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">선택안함</SelectItem>
                {CONTRACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 기사 금액 */}
          <div>
            <Label htmlFor="driverAmount">기사 금액 <span className="text-gray-500">(선택사항)</span></Label>
            <Input
              type="number"
              id="driverAmount"
              value={formData.driverAmount}
              onChange={(e) => setFormData({ ...formData, driverAmount: Number(e.target.value) })}
              className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              placeholder="0"
            />
          </div>
        </div>

        {/* 운행요일 */}
        <div className="mt-4">
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

        {/* 비고 */}
        <div className="mt-4">
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
      </div>

      {/* 계약 기간 */}
      <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <div className="w-3 h-3 bg-gray-600 rounded-full mr-2"></div>
          계약 기간
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 시작일 */}
          <div>
            <Label htmlFor="startDate">시작일 <span className="text-gray-500">(선택사항)</span></Label>
            <Input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>

          {/* 종료일 */}
          <div>
            <Label htmlFor="endDate">종료일 <span className="text-gray-500">(선택사항)</span></Label>
            <Input
              type="date"
              id="endDate"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>
        </div>
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