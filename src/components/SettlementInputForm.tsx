'use client'

import React, { useState } from 'react'
import { Calendar, DollarSign, FileText, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SettlementInputFormProps {
  onSubmit: (data: SettlementInputData) => void
  isLoading?: boolean
}

interface SettlementInputData {
  driverId: string
  driverName: string
  settlementType: 'FIXED_DAY' | 'FIXED_MONTH' | 'JIIP' | 'TRIP'
  amount: number
  paymentDate: string
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHECK'
  memo?: string
}

export default function SettlementInputForm({ onSubmit, isLoading = false }: SettlementInputFormProps) {
  const [formData, setFormData] = useState<SettlementInputData>({
    driverId: '',
    driverName: '',
    settlementType: 'FIXED_MONTH',
    amount: 0,
    paymentDate: '',
    paymentMethod: 'BANK_TRANSFER',
    memo: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.driverId || !formData.amount || !formData.paymentDate) {
      return
    }

    onSubmit(formData)
  }

  const handleInputChange = (field: keyof SettlementInputData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '')
    const numValue = parseInt(value) || 0
    setFormData(prev => ({ ...prev, amount: numValue }))
  }

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">정산 입력</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 기사 선택 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="driverId" className="text-sm font-medium">기사 ID *</Label>
            <Input
              id="driverId"
              type="text"
              value={formData.driverId}
              onChange={(e) => handleInputChange('driverId', e.target.value)}
              placeholder="기사 ID 입력"
              className="h-9"
              required
            />
          </div>
          <div>
            <Label htmlFor="driverName" className="text-sm font-medium">기사명</Label>
            <Input
              id="driverName"
              type="text"
              value={formData.driverName}
              onChange={(e) => handleInputChange('driverName', e.target.value)}
              placeholder="기사명 (참고용)"
              className="h-9"
            />
          </div>
        </div>

        {/* 정산 구분 및 금액 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">정산 구분 *</Label>
            <Select
              value={formData.settlementType}
              onValueChange={(value) => handleInputChange('settlementType', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED_DAY">지입 일별</SelectItem>
                <SelectItem value="FIXED_MONTH">지입 월별</SelectItem>
                <SelectItem value="JIIP">지입 고정</SelectItem>
                <SelectItem value="TRIP">용차 운행</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount" className="text-sm font-medium">금액 *</Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                value={formData.amount ? formatCurrency(formData.amount) : ''}
                onChange={handleAmountChange}
                placeholder="0"
                className="h-9 pr-8"
                required
              />
              <span className="absolute right-2 top-2 text-sm text-gray-500">원</span>
            </div>
          </div>
        </div>

        {/* 지급일자 및 지급방법 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="paymentDate" className="text-sm font-medium">지급일자 *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => handleInputChange('paymentDate', e.target.value)}
              className="h-9"
              required
            />
          </div>
          <div>
            <Label className="text-sm font-medium">지급방법</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => handleInputChange('paymentMethod', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">계좌이체</SelectItem>
                <SelectItem value="CASH">현금</SelectItem>
                <SelectItem value="CHECK">수표</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 메모 */}
        <div>
          <Label htmlFor="memo" className="text-sm font-medium">메모</Label>
          <Textarea
            id="memo"
            value={formData.memo}
            onChange={(e) => handleInputChange('memo', e.target.value)}
            placeholder="추가 메모사항 (선택사항)"
            rows={3}
            className="resize-none"
          />
        </div>

        {/* 미리보기 요약 */}
        {formData.amount > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">입력 내용 미리보기</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>• 기사: {formData.driverName || formData.driverId}</div>
              <div>• 구분: {
                formData.settlementType === 'FIXED_MONTH' ? '지입 월별' :
                formData.settlementType === 'FIXED_DAY' ? '지입 일별' :
                formData.settlementType === 'JIIP' ? '지입 고정' : '용차 운행'
              }</div>
              <div>• 금액: <span className="font-semibold text-blue-600">{formatCurrency(formData.amount)}원</span></div>
              <div>• 지급일: {formData.paymentDate}</div>
            </div>
          </div>
        )}

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData({
              driverId: '',
              driverName: '',
              settlementType: 'FIXED_MONTH',
              amount: 0,
              paymentDate: '',
              paymentMethod: 'BANK_TRANSFER',
              memo: ''
            })}
          >
            초기화
          </Button>
          <Button
            type="submit"
            disabled={!formData.driverId || !formData.amount || !formData.paymentDate || isLoading}
          >
            {isLoading ? '처리 중...' : '정산 등록'}
          </Button>
        </div>
      </form>
    </div>
  )
}