'use client'

import React, { useState } from 'react'
import { LoadingPointResponse } from '@/hooks/useLoadingPoints'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AddressSearchInput, { SelectedAddress } from '@/components/ui/AddressSearchInput'
import { extractNumbers, formatPhoneNumber } from '@/lib/utils/format'

export interface LoadingPointFormProps {
  loadingPoint?: LoadingPointResponse | null
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

export default function LoadingPointForm({ loadingPoint, onSubmit, isLoading, onCancel }: LoadingPointFormProps) {
  const [formData, setFormData] = useState({
    centerName: loadingPoint?.centerName || '',
    loadingPointName: loadingPoint?.loadingPointName || '',
    lotAddress: loadingPoint?.lotAddress || '',
    roadAddress: loadingPoint?.roadAddress || '',
    manager1: loadingPoint?.manager1 || '',
    manager2: loadingPoint?.manager2 || '',
    phone1: formatPhoneNumber(loadingPoint?.phone1 || ''),  // 표시용 포맷
    phone2: formatPhoneNumber(loadingPoint?.phone2 || ''),  // 표시용 포맷
    remarks: loadingPoint?.remarks || ''
  })

  const handleAddressSelect = (address: SelectedAddress) => {
    setFormData(prev => ({
      ...prev,
      lotAddress: address.lotAddress,
      roadAddress: address.roadAddress,
      loadingPointName: address.placeName || prev.loadingPointName,
      phone1: address.phone || prev.phone1,
      manager1: address.phone ? "대표번호" : prev.manager1
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 제출 시 연락처에서 숫자만 추출하여 저장
    const submitData = {
      ...formData,
      phone1: extractNumbers(formData.phone1),
      phone2: extractNumbers(formData.phone2)
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="centerName">
              센터명 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="centerName"
              required
              value={formData.centerName}
              onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
              placeholder="예: 서울물류센터"
              className="h-11 border-2 border-orange-200 bg-white text-gray-900 font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            />
          </div>
          <div>
            <Label htmlFor="loadingPointName">
              상차지명 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="loadingPointName"
              required
              value={formData.loadingPointName}
              onChange={(e) => setFormData({ ...formData, loadingPointName: e.target.value })}
              placeholder="예: A동 1층"
              className="h-11 border-2 border-orange-200 bg-white text-gray-900 font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            />
          </div>
        </div>

        <AddressSearchInput
          label="주소 검색"
          placeholder="주소를 검색하세요"
          lotAddress={formData.lotAddress}
          roadAddress={formData.roadAddress}
          onAddressSelect={handleAddressSelect}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="manager1">담당자1</Label>
            <Input
              type="text"
              id="manager1"
              value={formData.manager1}
              onChange={(e) => setFormData({ ...formData, manager1: e.target.value })}
              placeholder="예: 김담당"
              className="h-11 border-2 border-orange-200 bg-white text-gray-900 font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            />
          </div>
          <div>
            <Label htmlFor="phone1">연락처1</Label>
            <Input
              type="tel"
              id="phone1"
              value={formData.phone1}
              onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
              placeholder="예: 02-1234-5678"
              className="h-11 border-2 border-orange-200 bg-white text-gray-900 font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="manager2">담당자2</Label>
            <Input
              type="text"
              id="manager2"
              value={formData.manager2}
              onChange={(e) => setFormData({ ...formData, manager2: e.target.value })}
              placeholder="예: 박부담당"
              className="h-11 border-2 border-orange-200 bg-white text-gray-900 font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            />
          </div>
          <div>
            <Label htmlFor="phone2">연락처2</Label>
            <Input
              type="tel"
              id="phone2"
              value={formData.phone2}
              onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
              placeholder="예: 010-1234-5678"
              className="h-11 border-2 border-orange-200 bg-white text-gray-900 font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="remarks">비고</Label>
          <textarea
            id="remarks"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="특이사항이나 추가 정보를 입력하세요"
            className="w-full px-4 py-3 border-2 border-orange-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 resize-none"
            rows={3}
            maxLength={500}
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.remarks.length}/500자
          </p>
        </div>
      </div>

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
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
        >
          {isLoading ? '처리 중...' : loadingPoint ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  )
}