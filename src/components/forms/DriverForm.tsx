'use client'

import React, { useState } from 'react'
import { User, Phone, Car, Building2, CreditCard, FileText, AlertCircle } from 'lucide-react'
import { DriverResponse } from '@/lib/validations/driver'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { extractNumbers, formatPhoneNumber, formatAccountNumber, formatBusinessNumber } from '@/lib/utils/format'

export interface DriverFormProps {
  driver?: DriverResponse | null
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

export default function DriverForm({ driver, onSubmit, isLoading, onCancel }: DriverFormProps) {
  const [formData, setFormData] = useState({
    name: driver?.name || '',
    phone: formatPhoneNumber(driver?.phone || ''),  // 표시용 포맷
    vehicleNumber: driver?.vehicleNumber || '',
    businessName: driver?.businessName || '',
    representative: driver?.representative || '',
    businessNumber: formatBusinessNumber(driver?.businessNumber || ''),  // 표시용 포맷
    bankName: driver?.bankName || '',
    accountNumber: formatAccountNumber(driver?.accountNumber || ''),  // 표시용 포맷
    remarks: driver?.remarks || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 제출 시 숫자만 추출하여 저장
    const submitData = {
      ...formData,
      phone: extractNumbers(formData.phone),
      businessNumber: extractNumbers(formData.businessNumber),
      accountNumber: extractNumbers(formData.accountNumber)
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-8">
      
      {/* Basic Information */}
      <div className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-purple-600" />
              성함 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-12 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              placeholder="기사님의 성함을 입력하세요"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4 text-purple-600" />
              연락처 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="tel"
              id="phone"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="연락처를 입력하세요"
              className="h-12 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
            />
          </div>

          <div>
            <Label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Car className="h-4 w-4 text-purple-600" />
              차량번호 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="vehicleNumber"
              required
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
              placeholder="예: 12가3456"
              className="h-12 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
            />
          </div>
        </div>
      </div>
      
      {/* Business Information */}
      <div className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <Label htmlFor="businessName" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              사업상호
            </Label>
            <Input
              type="text"
              id="businessName"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="h-12 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              placeholder="사업상호를 입력하세요"
            />
          </div>

          <div>
            <Label htmlFor="representative" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              대표자
            </Label>
            <Input
              type="text"
              id="representative"
              value={formData.representative}
              onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
              className="h-12 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              placeholder="대표자명을 입력하세요"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="businessNumber" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              사업자등록번호
            </Label>
            <Input
              type="text"
              id="businessNumber"
              value={formData.businessNumber}
              onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
              placeholder="사업자등록번호를 입력하세요"
              className="h-12 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>
        </div>
      </div>
      
      {/* Account Information */}
      <div className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <Label htmlFor="bankName" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-600" />
              은행명
            </Label>
            <Input
              type="text"
              id="bankName"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="h-12 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
              placeholder="예: 국민,카카오,토스뱅크"
            />
          </div>

          <div>
            <Label htmlFor="accountNumber" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              계좌번호
            </Label>
            <Input
              type="text"
              id="accountNumber"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="계좌번호 : 숫자만"
              className="h-12 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-6">
        
        <div>
          <Label htmlFor="remarks" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-600" />
            특이사항 및 메모
          </Label>
          <textarea
            id="remarks"
            rows={4}
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 resize-none"
            placeholder="특이사항이나 추가 정보를 입력하세요"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="h-12 px-8 rounded-xl border-2 font-medium hover:bg-gray-50"
        >
          취소
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="h-12 px-8 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              처리 중...
            </>
          ) : (
            driver ? '수정 완료' : '등록 완료'
          )}
        </Button>
      </div>
    </form>
  )
}