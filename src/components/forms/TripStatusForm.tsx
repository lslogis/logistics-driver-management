'use client'

import React, { useState } from 'react'
import { TripResponse } from '@/lib/validations/trip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export interface TripStatusFormProps {
  trip: TripResponse
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

export default function TripStatusForm({ trip, onSubmit, isLoading, onCancel }: TripStatusFormProps) {
  const [formData, setFormData] = useState({
    status: 'COMPLETED' as 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE',
    absenceReason: '',
    substituteDriverId: '',
    substituteFare: '',
    deductionAmount: '',
    remarks: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const data: any = { status: formData.status, remarks: formData.remarks }
    
    if (formData.status === 'ABSENCE') {
      if (!formData.absenceReason) return
      data.absenceReason = formData.absenceReason
      if (formData.deductionAmount) data.deductionAmount = parseInt(formData.deductionAmount)
    }
    
    if (formData.status === 'SUBSTITUTE') {
      if (!formData.substituteDriverId || !formData.substituteFare) return
      data.substituteDriverId = formData.substituteDriverId
      data.substituteFare = parseInt(formData.substituteFare)
      if (formData.deductionAmount) data.deductionAmount = parseInt(formData.deductionAmount)
    }
    
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {trip.driver.name} - {new Date(trip.date).toLocaleDateString('ko-KR')}
        </p>
      </div>

      <div className="space-y-3">
        <Label>상태 <span className="text-red-500">*</span></Label>
        <RadioGroup
          value={formData.status}
          onValueChange={(value: 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE') => 
            setFormData({ ...formData, status: value })
          }
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="COMPLETED" id="completed" />
            <Label htmlFor="completed" className="cursor-pointer">완료</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ABSENCE" id="absence" />
            <Label htmlFor="absence" className="cursor-pointer">결행</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="SUBSTITUTE" id="substitute" />
            <Label htmlFor="substitute" className="cursor-pointer">대차</Label>
          </div>
        </RadioGroup>
      </div>

      {formData.status === 'ABSENCE' && (
        <div>
          <Label htmlFor="absenceReason">
            결행 사유 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="absenceReason"
            required
            placeholder="결행 사유를 입력하세요"
            value={formData.absenceReason}
            onChange={(e) => setFormData({ ...formData, absenceReason: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>
      )}

      {formData.status === 'SUBSTITUTE' && (
        <>
          <div>
            <Label htmlFor="substituteDriverId">
              대차 기사 ID <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="substituteDriverId"
              required
              placeholder="대차 기사 ID를 입력하세요"
              value={formData.substituteDriverId}
              onChange={(e) => setFormData({ ...formData, substituteDriverId: e.target.value })}
              className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>
          <div>
            <Label htmlFor="substituteFare">
              대차 요금 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              id="substituteFare"
              required
              placeholder="0"
              value={formData.substituteFare}
              onChange={(e) => setFormData({ ...formData, substituteFare: e.target.value })}
              className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>
        </>
      )}

      {(formData.status === 'ABSENCE' || formData.status === 'SUBSTITUTE') && (
        <div>
          <Label htmlFor="deductionAmount">
            공제액 (선택)
          </Label>
          <Input
            type="number"
            id="deductionAmount"
            placeholder="0"
            value={formData.deductionAmount}
            onChange={(e) => setFormData({ ...formData, deductionAmount: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>
      )}

      <div>
        <Label htmlFor="remarks">
          비고
        </Label>
        <Textarea
          id="remarks"
          placeholder="추가 비고사항"
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
          {isLoading ? '처리 중...' : '상태 변경'}
        </Button>
      </div>
    </form>
  )
}