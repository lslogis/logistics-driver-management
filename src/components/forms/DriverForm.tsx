'use client'

import React, { useState } from 'react'
import { DriverResponse } from '@/lib/validations/driver'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface DriverFormProps {
  driver?: DriverResponse | null
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

export default function DriverForm({ driver, onSubmit, isLoading, onCancel }: DriverFormProps) {
  const [formData, setFormData] = useState({
    name: driver?.name || '',
    phone: driver?.phone || '',
    vehicleNumber: driver?.vehicleNumber || '',
    businessName: driver?.businessName || '',
    representative: driver?.representative || '',
    businessNumber: driver?.businessNumber || '',
    bankName: driver?.bankName || '',
    accountNumber: driver?.accountNumber || '',
    remarks: driver?.remarks || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">
            성함 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="phone">
            연락처 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="tel"
            id="phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="010-1234-5678"
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="vehicleNumber">
            차량번호 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="vehicleNumber"
            required
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            placeholder="예: 12가3456"
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="businessName">사업상호</Label>
          <Input
            type="text"
            id="businessName"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="representative">대표자</Label>
          <Input
            type="text"
            id="representative"
            value={formData.representative}
            onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="businessNumber">사업번호</Label>
          <Input
            type="text"
            id="businessNumber"
            value={formData.businessNumber}
            onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
            placeholder="000-00-00000"
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="bankName">계좌은행</Label>
          <Input
            type="text"
            id="bankName"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div>
          <Label htmlFor="accountNumber">계좌번호</Label>
          <Input
            type="text"
            id="accountNumber"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            placeholder="숫자만 입력"
            className="h-11 border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="remarks">특이사항</Label>
        <textarea
          id="remarks"
          rows={3}
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
          placeholder="특이사항이나 추가 정보를 입력하세요"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '처리 중...' : driver ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  )
}