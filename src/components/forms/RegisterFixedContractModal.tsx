'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  MapPin, 
  FileText, 
  Clock,
  CheckCircle2,
  Calculator
} from 'lucide-react'
import ModernModal, { ModalFooter, ModalButton } from '@/components/ui/ModernModal'
import FormRow from '@/components/ui/FormRow'
import DriverSelector from '@/components/ui/DriverSelector'
import { 
  FixedContractFormSchema,
  FixedContractFormData,
  formDataToRequest,
  CONTRACT_TYPE_LABELS,
  WEEKDAY_LABELS
} from '@/lib/validations/fixedContract'
import { ContractType } from '@prisma/client'
import { designTokens, cn } from '@/styles/design-tokens'

interface LoadingPoint {
  id: string
  centerName: string
  loadingPointName: string
  isActive: boolean
}

interface RegisterFixedContractModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
  loadingPoints: LoadingPoint[]
  editData?: any
}

// Weekday checkbox group component
interface WeekdayCheckboxGroupProps {
  value: number[]
  onChange: (days: number[]) => void
  error?: string
}

function WeekdayCheckboxGroup({ value, onChange, error }: WeekdayCheckboxGroupProps) {
  const handleDayToggle = (dayIndex: number) => {
    const newDays = value.includes(dayIndex)
      ? value.filter(d => d !== dayIndex)
      : [...value, dayIndex].sort()
    onChange(newDays)
  }

  const selectAll = () => {
    onChange([1, 2, 3, 4, 5, 6]) // Monday to Saturday
  }

  const selectWeekdays = () => {
    onChange([1, 2, 3, 4, 5]) // Monday to Friday
  }

  const clear = () => {
    onChange([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={designTokens.typography.label}>
          운행 요일 <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectWeekdays}
            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
          >
            평일만
          </button>
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
          >
            전체선택
          </button>
          <button
            type="button"
            onClick={clear}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
          >
            초기화
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAY_LABELS.map((day, index) => {
          const isSelected = value.includes(index)
          const isSunday = index === 0
          
          return (
            <label
              key={index}
              className={cn(
                'flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all duration-200',
                isSelected 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                isSunday && 'text-red-500',
                error && 'border-red-300'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleDayToggle(index)}
                className="sr-only"
              />
              <span className="text-xs font-medium">
                {day.slice(0, 1)}
              </span>
              {isSelected && (
                <CheckCircle2 className="h-4 w-4 mt-1 text-blue-600" />
              )}
            </label>
          )
        })}
      </div>
      
      {error && (
        <p className={designTokens.typography.error}>{error}</p>
      )}
    </div>
  )
}

// Section divider component
function SectionDivider({ title, icon: Icon }: { title: string, icon: React.ComponentType<any> }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-4 first:mt-0">
      <Icon className="h-4 w-4 text-blue-600" />
      <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

export default function RegisterFixedContractModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  loadingPoints,
  editData
}: RegisterFixedContractModalProps) {
  // local UI state
  const [selectedDriver, setSelectedDriver] = useState<any>(null)
  const [showOptionalFields, setShowOptionalFields] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<FixedContractFormData>({
    resolver: zodResolver(FixedContractFormSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      operatingDays: [],
      centerContractType: ContractType.FIXED_DAILY,
      driverContractType: ContractType.FIXED_DAILY
    }
  })

  const watchedDriverId = watch('driverId')
  const watchedValues = watch() // Watch all form values

  // Check if required fields are filled
  const isFormValid = 
    watchedValues.loadingPointId && 
    watchedValues.routeName && 
    watchedValues.centerContractType && 
    watchedValues.centerAmount && 
    watchedValues.operatingDays?.length > 0

  // Route name은 직접 입력(필수)로 변경 — 자동생성 제거

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset()
      setSelectedDriver(null)
      setShowOptionalFields(false)
    }
  }, [isOpen, reset])

  // Initialize form with edit data
  useEffect(() => {
    if (editData && isOpen) {
      const formData = {
        driverId: editData.driver?.id || undefined,
        loadingPointId: editData.loadingPoint?.id || '',
        routeName: editData.routeName || '',
        centerContractType: editData.centerContractType || ContractType.FIXED_DAILY,
        driverContractType: editData.driverContractType || ContractType.FIXED_DAILY,
        operatingDays: editData.operatingDays || [],
        centerAmount: editData.centerAmount ? editData.centerAmount.toString() : '',
        driverAmount: editData.driverAmount ? editData.driverAmount.toString() : '',
        startDate: editData.startDate ? new Date(editData.startDate).toISOString().split('T')[0] : '',
        endDate: editData.endDate ? new Date(editData.endDate).toISOString().split('T')[0] : '',
        specialConditions: editData.specialConditions || '',
        remarks: editData.remarks || ''
      }
      
      
      reset(formData)
      setSelectedDriver(editData.driver)
      setShowOptionalFields(true)
    }
  }, [editData, isOpen, reset])

  const onFormSubmit = async (data: FixedContractFormData) => {
    try {
      const requestData = formDataToRequest(data)
      await onSubmit(requestData)
      onClose()
    } catch (error) {
      console.error('Failed to submit fixed contract:', error)
    }
  }

  const activeLoadingPoints = loadingPoints.filter(lp => lp.isActive)

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "고정계약 수정" : "고정계약 등록"}
      subtitle={editData ? "고정계약 정보를 수정합니다" : "새로운 고정계약을 등록합니다"}
      icon={Building2}
      size="lg"
      footer={
        <ModalFooter>
          <ModalButton variant="ghost" onClick={onClose} disabled={isLoading}>
            취소
          </ModalButton>
          <ModalButton
            type="submit"
            form="fixed-contract-form"
            loading={isLoading}
            disabled={!isFormValid || isLoading}
          >
            등록
          </ModalButton>
        </ModalFooter>
      }
    >
      <form 
        id="fixed-contract-form" 
        onSubmit={handleSubmit(onFormSubmit)}
        className="space-y-6"
      >
        {/* Top-most required fields per spec */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Center (Loading Point) Selection */}
          <FormRow
            label="센터명"
            name="loadingPointId"
            type="select"
            state="required"
            icon={MapPin}
            placeholder="센터를 선택하세요"
            value={watch('loadingPointId')}
            options={activeLoadingPoints.map(lp => ({
              value: lp.id,
              label: `${lp.centerName} - ${lp.loadingPointName}`
            }))}
            onChange={(value) => setValue('loadingPointId', value)}
            error={errors.loadingPointId?.message}
          />

          {/* Route/Hocha */}
          <FormRow
            label="호차/노선"
            name="routeName"
            state="required"
            icon={MapPin}
            placeholder="호차/노선명을 입력하세요"
            value={watch('routeName')}
            onChange={(value) => setValue('routeName', value, { shouldValidate: true, shouldDirty: true })}
            error={errors.routeName?.message}
          />

          {/* 센터계약 + 센터금액 */}
          <FormRow
            label="센터계약"
            name="centerContractType"
            type="select"
            state="required"
            icon={Building2}
            value={watch('centerContractType')}
            options={[
              { value: 'FIXED_DAILY', label: CONTRACT_TYPE_LABELS.FIXED_DAILY },
              { value: 'FIXED_MONTHLY', label: CONTRACT_TYPE_LABELS.FIXED_MONTHLY },
              { value: 'CONSIGNED_MONTHLY', label: CONTRACT_TYPE_LABELS.CONSIGNED_MONTHLY },
            ]}
            onChange={(value) => setValue('centerContractType', value as ContractType, { shouldValidate: true, shouldDirty: true })}
            error={errors.centerContractType?.message}
          />

          <FormRow
            label="센터금액"
            name="centerAmount"
            type="number"
            state="required"
            icon={DollarSign}
            placeholder="금액(원)"
            value={watch('centerAmount')}
            onChange={(value) => setValue('centerAmount', value, { shouldValidate: true, shouldDirty: true })}
            error={errors.centerAmount?.message}
          />
        </div>
        <FormRow
          label="특이사항"
          name="specialConditions"
          type="textarea"
          icon={FileText}
          placeholder="계약 관련 특별한 조건이나 요구사항이 있다면 입력하세요"
          rows={3}
          value={watch('specialConditions')}
          onChange={(value) => setValue('specialConditions', value)}
          error={errors.specialConditions?.message}
        />
        <Controller
          name="operatingDays"
          control={control}
          render={({ field }) => (
            <WeekdayCheckboxGroup
              value={field.value}
              onChange={field.onChange}
              error={errors.operatingDays?.message}
            />
          )}
        />

        {/* Driver Selection moved below */}
        <SectionDivider title="담당 기사" icon={User} />
        <div className="md:col-span-2">
          <Controller
            name="driverId"
            control={control}
            render={({ field }) => (
              <DriverSelector
                value={field.value}
                onChange={(driverId) => {
                  field.onChange(driverId)
                  // Find and set the selected driver for local state
                  if (driverId) {
                    // Driver will be found automatically by the DriverSelector
                    setSelectedDriver(null) // Let DriverSelector handle it
                  } else {
                    setSelectedDriver(null)
                  }
                }}
                label="담당 기사"
                error={errors.driverId?.message}
                placeholder="기사를 검색하여 선택하세요"
              />
            )}
          />
        </div>

        {/* 기사계약 + 기사금액 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormRow
            label="기사계약"
            name="driverContractType"
            type="select"
            state="required"
            icon={Building2}
            value={watch('driverContractType')}
            options={[
              { value: 'FIXED_DAILY', label: CONTRACT_TYPE_LABELS.FIXED_DAILY },
              { value: 'FIXED_MONTHLY', label: CONTRACT_TYPE_LABELS.FIXED_MONTHLY },
              { value: 'CONSIGNED_MONTHLY', label: CONTRACT_TYPE_LABELS.CONSIGNED_MONTHLY },
            ]}
            onChange={(value) => setValue('driverContractType', value as ContractType, { shouldValidate: true, shouldDirty: true })}
            error={errors.driverContractType?.message}
          />

          <FormRow
            label="기사금액"
            name="driverAmount"
            type="number"
            state="required"
            icon={DollarSign}
            placeholder="금액(원)"
            value={watch('driverAmount')}
            onChange={(value) => setValue('driverAmount', value, { shouldValidate: true, shouldDirty: true })}
          />
        </div>

        {/* 계약 기간 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormRow
            label="시작일자"
            name="startDate"
            type="date"
            icon={Calendar}
            value={watch('startDate')}
            onChange={(value) => setValue('startDate', value, { shouldValidate: true, shouldDirty: true })}
            error={errors.startDate?.message}
          />
          <FormRow
            label="종료일자"
            name="endDate"
            type="date"
            icon={Calendar}
            value={watch('endDate')}
            onChange={(value) => setValue('endDate', value, { shouldValidate: true, shouldDirty: true })}
            error={errors.endDate?.message}
          />
        </div>

        <div className="space-y-4">
          <FormRow
            label="비고"
            name="remarks"
            type="textarea"
            icon={FileText}
            placeholder="기타 참고사항이나 메모가 있다면 입력하세요"
            rows={3}
            value={watch('remarks')}
            onChange={(value) => setValue('remarks', value)}
            error={errors.remarks?.message}
          />
        </div>
      </form>
    </ModernModal>
  )
}
