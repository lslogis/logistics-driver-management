'use client'

import React, { useState } from 'react'
import { TripResponse } from '@/lib/validations/trip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface TripFormProps {
  trip?: TripResponse | null
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

export default function TripForm({ trip, onSubmit, isLoading, onCancel }: TripFormProps) {
  const [formData, setFormData] = useState({
    date: trip?.date || new Date().toISOString().split('T')[0],
    driverId: trip?.driver.id || '',
    vehicleId: trip?.vehicle.id || '',
    routeTemplateId: trip?.routeTemplate?.id || '',
    loadingPoint: trip?.customRoute?.loadingPoint || '',
    unloadingPoint: trip?.customRoute?.unloadingPoint || '',
    driverFare: trip ? Number(trip.driverFare) : 0,
    billingFare: trip ? Number(trip.billingFare) : 0,
    remarks: trip?.remarks || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.date || !formData.driverId || !formData.vehicleId || !formData.driverFare || !formData.billingFare) {
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">
            운행일 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            id="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="status">
            상태
          </Label>
          <Input
            type="text"
            id="status"
            value="예정"
            disabled
            className="h-11 border-2 border-gray-300 bg-gray-100 text-gray-500 font-medium"
          />
        </div>

        <div>
          <Label htmlFor="driverId">
            기사 ID <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="driverId"
            required
            placeholder="기사 ID를 입력하세요"
            value={formData.driverId}
            onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="vehicleId">
            차량 ID <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="vehicleId"
            required
            placeholder="차량 ID를 입력하세요"
            value={formData.vehicleId}
            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="driverFare">
            기사요금 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            id="driverFare"
            required
            placeholder="0"
            value={formData.driverFare}
            onChange={(e) => setFormData({ ...formData, driverFare: Number(e.target.value) })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="billingFare">
            청구요금 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            id="billingFare"
            required
            placeholder="0"
            value={formData.billingFare}
            onChange={(e) => setFormData({ ...formData, billingFare: Number(e.target.value) })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="routeTemplateId">
            노선 템플릿 ID (선택)
          </Label>
          <Input
            type="text"
            id="routeTemplateId"
            placeholder="노선 템플릿 ID (선택사항)"
            value={formData.routeTemplateId}
            onChange={(e) => setFormData({ ...formData, routeTemplateId: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="loadingPoint">
            상차지 (선택)
          </Label>
          <Input
            type="text"
            id="loadingPoint"
            placeholder="상차지"
            value={formData.loadingPoint}
            onChange={(e) => setFormData({ ...formData, loadingPoint: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="unloadingPoint">
            하차지 (선택)
          </Label>
          <Input
            type="text"
            id="unloadingPoint"
            placeholder="하차지"
            value={formData.unloadingPoint}
            onChange={(e) => setFormData({ ...formData, unloadingPoint: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="remarks">
          비고
        </Label>
        <Textarea
          id="remarks"
          placeholder="비고사항을 입력하세요"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          rows={3}
          className="border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2 h-11 border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-all duration-200"
        >
          취소
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        >
          {isLoading ? '처리 중...' : trip ? '수정하기' : '등록하기'}
        </Button>
      </div>
    </form>
  )
}