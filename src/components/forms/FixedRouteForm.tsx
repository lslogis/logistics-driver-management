'use client'

import React, { useState, useEffect } from 'react'
import { FixedRouteResponse } from '@/lib/validations/fixedRoute'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useLoadingPoints } from '@/hooks/useLoadingPoints'
import { useDrivers } from '@/hooks/useDrivers'

const WEEKDAYS = [
  { value: 0, label: '일요일' },
  { value: 1, label: '월요일' },
  { value: 2, label: '화요일' },
  { value: 3, label: '수요일' },
  { value: 4, label: '목요일' },
  { value: 5, label: '금요일' },
  { value: 6, label: '토요일' }
]

const CONTRACT_TYPES = [
  { value: 'FIXED_DAILY', label: '고정(일대)' },
  { value: 'FIXED_MONTHLY', label: '고정(월대)' },
  { value: 'CONSIGNED_MONTHLY', label: '지입(월대+경비)' }
]

export interface FixedRouteFormProps {
  fixedRoute?: FixedRouteResponse
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

export default function FixedRouteForm({ fixedRoute, onSubmit, isLoading, onCancel }: FixedRouteFormProps) {
  const [formData, setFormData] = useState({
    routeName: fixedRoute?.routeName || '',
    loadingPointId: fixedRoute?.loadingPointId || '',
    assignedDriverId: fixedRoute?.assignedDriverId || '',
    contractType: fixedRoute?.contractType || 'FIXED_DAILY',
    weekdayPattern: fixedRoute?.weekdayPattern || [],
    revenueDaily: fixedRoute?.revenueDaily || 0,
    costDaily: fixedRoute?.costDaily || 0
  })

  // Fetch loading points and drivers for select options
  const { data: loadingPointsData } = useLoadingPoints('', 'active')
  const { data: driversData } = useDrivers('', 'active')
  
  const loadingPoints = loadingPointsData?.pages?.flatMap((page: any) => page.items || []) || []
  const drivers = driversData?.pages?.flatMap((page: any) => page.drivers || []) || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      revenueDaily: formData.revenueDaily || undefined,
      costDaily: formData.costDaily || undefined
    })
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
        <div className="md:col-span-2">
          <Label htmlFor="routeName">
            노선명 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="routeName"
            required
            value={formData.routeName}
            onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="loadingPointId">상차지</Label>
          <Select
            value={formData.loadingPointId}
            onValueChange={(value) => setFormData({ ...formData, loadingPointId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="상차지 선택" />
            </SelectTrigger>
            <SelectContent>
              {loadingPoints.map((point: any) => (
                <SelectItem key={point.id} value={point.id}>
                  {point.centerName} {point.loadingPointName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="assignedDriverId">배정기사</Label>
          <Select
            value={formData.assignedDriverId}
            onValueChange={(value) => setFormData({ ...formData, assignedDriverId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="기사 선택" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver: any) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name} ({driver.phone})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contractType">계약형태</Label>
          <Select
            value={formData.contractType}
            onValueChange={(value) => setFormData({ ...formData, contractType: value })}
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

        <div>
          <Label htmlFor="revenueDaily">일매출 (원)</Label>
          <Input
            type="number"
            id="revenueDaily"
            value={formData.revenueDaily}
            onChange={(e) => setFormData({ ...formData, revenueDaily: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label htmlFor="costDaily">일비용 (원)</Label>
          <Input
            type="number"
            id="costDaily"
            value={formData.costDaily}
            onChange={(e) => setFormData({ ...formData, costDaily: Number(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <Label>운행요일</Label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {WEEKDAYS.map((day) => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox
                id={`weekday-${day.value}`}
                checked={formData.weekdayPattern.includes(day.value)}
                onCheckedChange={(checked) => handleWeekdayChange(day.value, !!checked)}
              />
              <Label htmlFor={`weekday-${day.value}`} className="text-sm">
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