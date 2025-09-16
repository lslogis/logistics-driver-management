'use client'

import React, { useState } from 'react'
import { 
  Car, 
  Calendar, 
  FileText, 
  User, 
  Settings,
  Shield,
  Fuel,
  Gauge
} from 'lucide-react'
import ModernModal, { ModalFooter, ModalButton } from '@/components/ui/ModernModal'
import FormRow from '@/components/ui/FormRow'

interface ModernVehicleFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading?: boolean
}

interface VehicleFormData {
  // Auto fields
  vehicleId: string
  registrationDate: string
  
  // Required fields
  vehicleNumber: string
  ownerName: string
  ownerPhone: string
  
  // Vehicle specifications
  vehicleType: string
  tonnage: string
  fuelType: string
  manufacturingYear: string
  
  // Insurance & Registration
  insuranceNumber: string
  insuranceExpiry: string
  registrationExpiry: string
  
  // Optional fields
  notes: string
}

const vehicleTypeOptions = [
  { value: '화물차', label: '화물차' },
  { value: '탑차', label: '탑차' },
  { value: '윙바디', label: '윙바디' },
  { value: '카고', label: '카고' },
  { value: '덤프', label: '덤프' },
  { value: '기타', label: '기타' }
]

const tonnageOptions = [
  { value: '1톤', label: '1톤' },
  { value: '2.5톤', label: '2.5톤' },
  { value: '3.5톤', label: '3.5톤' },
  { value: '5톤', label: '5톤' },
  { value: '8톤', label: '8톤' },
  { value: '11톤', label: '11톤' },
  { value: '15톤', label: '15톤' },
  { value: '25톤', label: '25톤' }
]

const fuelTypeOptions = [
  { value: '경유', label: '경유' },
  { value: '휘발유', label: '휘발유' },
  { value: 'LPG', label: 'LPG' },
  { value: '전기', label: '전기' },
  { value: '하이브리드', label: '하이브리드' }
]

export default function ModernVehicleForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: ModernVehicleFormProps) {
  const [formData, setFormData] = useState<VehicleFormData>({
    vehicleId: `VEH-${Date.now()}`,
    registrationDate: new Date().toLocaleDateString('ko-KR'),
    vehicleNumber: '',
    ownerName: '',
    ownerPhone: '',
    vehicleType: '',
    tonnage: '',
    fuelType: '',
    manufacturingYear: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    registrationExpiry: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: keyof VehicleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.vehicleNumber.trim()) {
      newErrors.vehicleNumber = '차량번호를 입력해주세요'
    }
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = '소유자명을 입력해주세요'
    }
    if (!formData.ownerPhone.trim()) {
      newErrors.ownerPhone = '소유자 연락처를 입력해주세요'
    }
    if (!formData.vehicleType) {
      newErrors.vehicleType = '차량 종류를 선택해주세요'
    }
    if (!formData.tonnage) {
      newErrors.tonnage = '톤수를 선택해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleCancel = () => {
    setFormData({
      vehicleId: `VEH-${Date.now()}`,
      registrationDate: new Date().toLocaleDateString('ko-KR'),
      vehicleNumber: '',
      ownerName: '',
      ownerPhone: '',
      vehicleType: '',
      tonnage: '',
      fuelType: '',
      manufacturingYear: '',
      insuranceNumber: '',
      insuranceExpiry: '',
      registrationExpiry: '',
      notes: ''
    })
    setErrors({})
    onClose()
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 30 }, (_, i) => {
    const year = currentYear - i
    return { value: year.toString(), label: `${year}년` }
  })

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="차량 등록"
      subtitle="새로운 차량 정보를 등록합니다"
      icon={Car}
      size="lg"
      footer={
        <ModalFooter>
          <ModalButton variant="ghost" onClick={handleCancel}>
            취소
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={() => {
              if (validateForm()) {
                onSubmit(formData)
              }
            }}
            loading={isLoading}
          >
            등록하기
          </ModalButton>
        </ModalFooter>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Auto Generated Fields */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            시스템 정보
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormRow
              label="차량 ID"
              name="vehicleId"
              value={formData.vehicleId}
              state="auto"
              icon={FileText}
            />
            <FormRow
              label="등록일"
              name="registrationDate"
              value={formData.registrationDate}
              state="auto"
              icon={Calendar}
            />
          </div>
        </div>

        {/* Required Basic Information */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="h-4 w-4 text-blue-600" />
            기본 정보
          </h4>
          <div className="space-y-4">
            <FormRow
              label="차량번호"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={(value) => updateField('vehicleNumber', value)}
              state="required"
              icon={Car}
              placeholder="12가3456"
              error={errors.vehicleNumber}
              helper="차량번호를 정확히 입력해주세요"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormRow
                label="소유자명"
                name="ownerName"
                value={formData.ownerName}
                onChange={(value) => updateField('ownerName', value)}
                state="required"
                icon={User}
                placeholder="홍길동"
                error={errors.ownerName}
              />
              <FormRow
                label="소유자 연락처"
                name="ownerPhone"
                type="tel"
                value={formData.ownerPhone}
                onChange={(value) => updateField('ownerPhone', value)}
                state="required"
                icon={User}
                placeholder="010-1234-5678"
                error={errors.ownerPhone}
              />
            </div>
          </div>
        </div>

        {/* Vehicle Specifications */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-600" />
            차량 사양
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormRow
                label="차량 종류"
                name="vehicleType"
                type="select"
                value={formData.vehicleType}
                onChange={(value) => updateField('vehicleType', value)}
                state="required"
                icon={Car}
                placeholder="차량 종류를 선택하세요"
                options={vehicleTypeOptions}
                error={errors.vehicleType}
              />
              <FormRow
                label="톤수"
                name="tonnage"
                type="select"
                value={formData.tonnage}
                onChange={(value) => updateField('tonnage', value)}
                state="required"
                icon={Gauge}
                placeholder="톤수를 선택하세요"
                options={tonnageOptions}
                error={errors.tonnage}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormRow
                label="연료 종류"
                name="fuelType"
                type="select"
                value={formData.fuelType}
                onChange={(value) => updateField('fuelType', value)}
                icon={Fuel}
                placeholder="연료 종류를 선택하세요"
                options={fuelTypeOptions}
                helper="연료 종류를 선택해주세요"
              />
              <FormRow
                label="제조년도"
                name="manufacturingYear"
                type="select"
                value={formData.manufacturingYear}
                onChange={(value) => updateField('manufacturingYear', value)}
                icon={Calendar}
                placeholder="제조년도를 선택하세요"
                options={yearOptions}
                helper="차량 제조년도를 선택해주세요"
              />
            </div>
          </div>
        </div>

        {/* Insurance & Registration */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            보험 및 등록 정보
          </h4>
          <div className="space-y-4">
            <FormRow
              label="보험증권번호"
              name="insuranceNumber"
              value={formData.insuranceNumber}
              onChange={(value) => updateField('insuranceNumber', value)}
              icon={Shield}
              placeholder="보험증권번호를 입력하세요"
              helper="보험증권번호를 입력해주세요"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormRow
                label="보험만료일"
                name="insuranceExpiry"
                type="date"
                value={formData.insuranceExpiry}
                onChange={(value) => updateField('insuranceExpiry', value)}
                icon={Calendar}
                helper="보험 만료일을 선택해주세요"
              />
              <FormRow
                label="등록증 만료일"
                name="registrationExpiry"
                type="date"
                value={formData.registrationExpiry}
                onChange={(value) => updateField('registrationExpiry', value)}
                icon={Calendar}
                helper="등록증 만료일을 선택해주세요"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <FormRow
            label="비고사항"
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={(value) => updateField('notes', value)}
            icon={FileText}
            placeholder="차량 관련 특이사항이나 추가 정보를 입력하세요..."
            rows={4}
            helper="최대 500자까지 입력 가능합니다"
          />
        </div>
      </form>
    </ModernModal>
  )
}