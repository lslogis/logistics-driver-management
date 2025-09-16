'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { X, Plus, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

// 타입 정의
export type CenterFareData = {
  centerId: string
  vehicleType: string
  region: string
  fare: number
}

export type CenterFareCreateModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: CenterFareData) => void
  prefillData?: {
    centerId?: string
    vehicleType?: string
    regions?: string[]
  }
}

// 차량 타입 옵션
const VEHICLE_TYPES = [
  '1.0톤', '1.4톤', '2.5톤', '3.5톤', '3.5광',
  '5.0톤', '5축', '8.0톤', '11톤', '11.0톤', '14톤', '상온'
]

export default function CenterFareCreateModal({
  isOpen,
  onClose,
  onSuccess,
  prefillData
}: CenterFareCreateModalProps) {
  // 폼 상태
  const [formData, setFormData] = useState<Partial<CenterFareData>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 데이터 상태
  const [centers, setCenters] = useState<Array<{ id: string; centerName: string }>>([])
  const [isLoadingCenters, setIsLoadingCenters] = useState(false)
  
  // 다중 지역 처리
  const [regionInput, setRegionInput] = useState('')
  const [regions, setRegions] = useState<string[]>([])
  const [createdRates, setCreatedRates] = useState<CenterFareData[]>([])

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      // 기본값 설정
      const initialData: Partial<CenterFareData> = {
        centerId: prefillData?.centerId || '',
        vehicleType: prefillData?.vehicleType || '',
        region: '', // 개별 입력
        fare: 0
      }
      
      setFormData(initialData)
      setRegions(prefillData?.regions || [])
      setRegionInput('')
      setErrors({})
      setCreatedRates([])
      setIsSubmitting(false)
      
      // 센터 목록 로드
      loadCenters()
    }
  }, [isOpen, prefillData])

  // 센터 목록 로드
  const loadCenters = async () => {
    setIsLoadingCenters(true)
    try {
      const response = await fetch('/api/loading-points?limit=100&isActive=true')
      if (response.ok) {
        const data = await response.json()
        setCenters(data.data?.loadingPoints || [])
      }
    } catch (error) {
      console.error('Failed to load centers:', error)
      toast.error('센터 목록 로드 실패')
    } finally {
      setIsLoadingCenters(false)
    }
  }

  // 필드 변경 핸들러
  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // 지역 추가
  const addRegion = (region: string) => {
    if (!region.trim()) return
    
    const trimmedRegion = region.trim()
    if (regions.includes(trimmedRegion)) {
      toast.error('이미 추가된 지역입니다')
      return
    }
    
    setRegions(prev => [...prev, trimmedRegion])
    setRegionInput('')
  }

  // 지역 제거
  const removeRegion = (index: number) => {
    setRegions(prev => prev.filter((_, i) => i !== index))
  }

  // 지역 입력 핸들러
  const handleRegionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addRegion(regionInput)
    }
  }

  // 개별 요율 등록
  const createCenterFare = async (fareData: CenterFareData) => {
    const response = await fetch('/api/center-fares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fareData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || '요율 등록 실패')
    }

    return response.json()
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 기본 검증
    const newErrors: Record<string, string> = {}
    
    if (!formData.centerId) newErrors.centerId = '센터는 필수입니다'
    if (!formData.vehicleType) newErrors.vehicleType = '차량타입은 필수입니다'
    if (!formData.fare || formData.fare < 0) newErrors.fare = '요율은 0 이상이어야 합니다'
    
    // 지역 검증 (개별 입력 또는 다중 입력)
    const hasIndividualRegion = formData.region?.trim()
    const hasMultipleRegions = regions.length > 0
    
    if (!hasIndividualRegion && !hasMultipleRegions) {
      newErrors.region = '지역은 필수입니다'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('필수 항목을 확인해주세요')
      return
    }

    setIsSubmitting(true)

    try {
      const results: CenterFareData[] = []
      
      // 개별 지역이 있는 경우
      if (hasIndividualRegion) {
        const fareData: CenterFareData = {
          centerId: formData.centerId!,
          vehicleType: formData.vehicleType!,
          region: formData.region!.trim(),
          fare: formData.fare!
        }
        
        await createCenterFare(fareData)
        results.push(fareData)
      }
      
      // 다중 지역이 있는 경우
      if (hasMultipleRegions) {
        for (const region of regions) {
          const fareData: CenterFareData = {
            centerId: formData.centerId!,
            vehicleType: formData.vehicleType!,
            region: region,
            fare: formData.fare!
          }
          
          try {
            await createCenterFare(fareData)
            results.push(fareData)
          } catch (error) {
            console.error(`Failed to create fare for region ${region}:`, error)
            toast.error(`${region} 요율 등록 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
          }
        }
      }
      
      setCreatedRates(results)
      
      if (results.length > 0) {
        toast.success(`${results.length}개 요율이 등록되었습니다`)
        
        // 첫 번째 성공한 요율로 콜백 실행
        onSuccess(results[0])
      }
      
    } catch (error) {
      console.error('Failed to create center fare:', error)
      toast.error(error instanceof Error ? error.message : '요율 등록에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null

  const selectedCenter = centers.find(c => c.id === formData.centerId)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background p-6 rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">센터 요율 등록</h3>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 성공 메시지 */}
        {createdRates.length > 0 && (
          <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">
                {createdRates.length}개 요율이 등록되었습니다
              </span>
            </div>
            <div className="space-y-1">
              {createdRates.map((rate, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  {rate.region}: {rate.fare.toLocaleString()}원
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 센터 선택 */}
          <div>
            <Label htmlFor="centerId">센터 *</Label>
            <Select
              value={formData.centerId || ''}
              onValueChange={(value) => handleFieldChange('centerId', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className={errors.centerId ? 'border-destructive' : ''}>
                <SelectValue placeholder="센터 선택" />
              </SelectTrigger>
              <SelectContent>
                {centers.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.centerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.centerId && <p className="text-sm text-destructive mt-1">{errors.centerId}</p>}
          </div>

          {/* 차량타입 선택 */}
          <div>
            <Label htmlFor="vehicleType">차량타입 *</Label>
            <Select
              value={formData.vehicleType || ''}
              onValueChange={(value) => handleFieldChange('vehicleType', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className={errors.vehicleType ? 'border-destructive' : ''}>
                <SelectValue placeholder="차량타입 선택" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vehicleType && <p className="text-sm text-destructive mt-1">{errors.vehicleType}</p>}
          </div>

          {/* 지역 입력 */}
          <div>
            <Label htmlFor="region">지역 *</Label>
            
            {/* 개별 지역 입력 */}
            <div className="space-y-2">
              <Input
                id="region"
                value={formData.region || ''}
                onChange={(e) => handleFieldChange('region', e.target.value)}
                placeholder="지역명 입력"
                className={errors.region ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              
              {/* 또는 구분선 */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs text-muted-foreground px-2">또는 여러 지역 입력</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              
              {/* 다중 지역 입력 */}
              <div className="flex gap-2">
                <Input
                  value={regionInput}
                  onChange={(e) => setRegionInput(e.target.value)}
                  onKeyDown={handleRegionKeyDown}
                  placeholder="지역명 입력 후 Enter"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addRegion(regionInput)}
                  disabled={!regionInput.trim() || isSubmitting}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* 지역 목록 */}
              {regions.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
                  {regions.map((region, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {region}
                      <button
                        type="button"
                        onClick={() => removeRegion(index)}
                        disabled={isSubmitting}
                        className="ml-1 hover:bg-secondary/80 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {errors.region && <p className="text-sm text-destructive mt-1">{errors.region}</p>}
          </div>

          {/* 요율 입력 */}
          <div>
            <Label htmlFor="fare">요율 (원) *</Label>
            <Input
              id="fare"
              type="number"
              value={formData.fare || ''}
              onChange={(e) => handleFieldChange('fare', parseInt(e.target.value) || 0)}
              placeholder="요율 입력"
              className={errors.fare ? 'border-destructive' : ''}
              min="0"
              disabled={isSubmitting}
            />
            {errors.fare && <p className="text-sm text-fare mt-1">{errors.fare}</p>}
          </div>

          {/* 미리보기 */}
          {(formData.centerId && formData.vehicleType && formData.fare) && (
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">등록될 요율</div>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">센터:</span> {selectedCenter?.centerName}</div>
                <div><span className="font-medium">차량:</span> {formData.vehicleType}</div>
                {formData.region && (
                  <div><span className="font-medium">지역:</span> {formData.region}</div>
                )}
                {regions.length > 0 && (
                  <div><span className="font-medium">지역:</span> {regions.join(', ')}</div>
                )}
                <div><span className="font-medium">요율:</span> {formData.fare.toLocaleString()}원</div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {Object.keys(errors).length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <div className="text-sm text-destructive">
                입력 오류가 있습니다. 필수 항목을 확인해주세요.
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? '등록중...' : '요율 등록'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
