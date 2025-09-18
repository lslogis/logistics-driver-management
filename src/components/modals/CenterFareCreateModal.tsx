'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { X, Plus, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { loadingPointsAPI } from '@/lib/api/loading-points'

// 타입 정의
export type CenterFareData = {
  loadingPointId: string
  vehicleType: string
  region: string | null
  fareType: 'BASIC' | 'STOP_FEE'
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
}

export type CenterFareCreateModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: CenterFareData) => void
  prefillData?: {
    loadingPointId?: string
    vehicleType?: string
    fareType?: 'BASIC' | 'STOP_FEE'
    regions?: string[]
  }
}

// 차량 타입 옵션
const VEHICLE_TYPES = [
  '1톤', '1.4톤', '2.5톤', '3.5톤', '3.5광',
  '5톤', '5축', '8톤', '11톤', '14톤'
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
  const [loadingPoints, setLoadingPoints] = useState<Array<{ id: string; name: string; centerName: string; loadingPointName: string }>>([])
  const [isLoadingPoints, setIsLoadingPoints] = useState(false)
  
  // 다중 지역 처리
  const [regionInput, setRegionInput] = useState('')
  const [regions, setRegions] = useState<string[]>([])
  const [createdRates, setCreatedRates] = useState<CenterFareData[]>([])

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      // 기본값 설정
      const initialData: Partial<CenterFareData> = {
        loadingPointId: prefillData?.loadingPointId || '',
        vehicleType: prefillData?.vehicleType || '',
        fareType: prefillData?.fareType || 'BASIC',
        region: '', // 개별 입력
        baseFare: 0,
        extraStopFee: 0,
        extraRegionFee: 0
      }
      
      setFormData(initialData)
      setRegions(prefillData?.regions || [])
      setRegionInput('')
      setErrors({})
      setCreatedRates([])
      setIsSubmitting(false)
      
      // 상차지 목록 로드
      loadLoadingPoints()
    }
  }, [isOpen, prefillData])

  // 상차지 목록 로드
  const loadLoadingPoints = async () => {
    setIsLoadingPoints(true)
    try {
      const payload = await loadingPointsAPI.list({ limit: 100, isActive: true })

      const rawItems = Array.isArray(payload.data)
        ? payload.data
        : []

      const normalizedPoints = rawItems
        .map((item: any) => ({
          id: String(item.id ?? ''),
          name: item.name ?? '',
          centerName: item.centerName ?? '',
          loadingPointName: item.loadingPointName ?? ''
        }))
        .filter(point => point.id)

      setLoadingPoints(normalizedPoints)
    } catch (error) {
      console.error('Failed to load loading points:', error)
      toast.error('상차지 목록 로드 실패')
    } finally {
      setIsLoadingPoints(false)
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
    
    if (!formData.loadingPointId || formData.loadingPointId.trim() === '') newErrors.loadingPointId = '상차지는 필수입니다'
    if (!formData.vehicleType || formData.vehicleType.trim() === '') newErrors.vehicleType = '차량타입은 필수입니다'
    if (!formData.fareType) newErrors.fareType = '요율 종류는 필수입니다'
    
    // fareType에 따른 요율 검증
    if (formData.fareType === 'BASIC') {
      if (!formData.baseFare || formData.baseFare < 0) newErrors.baseFare = '기본 요율은 0 이상이어야 합니다'
    } else if (formData.fareType === 'STOP_FEE') {
      if (!formData.extraStopFee || formData.extraStopFee < 0) newErrors.extraStopFee = '경유 요율은 0 이상이어야 합니다'
      if (!formData.extraRegionFee || formData.extraRegionFee < 0) newErrors.extraRegionFee = '지역 요율은 0 이상이어야 합니다'
    }
    
    // BASIC 타입일 때만 지역 검증
    if (formData.fareType === 'BASIC') {
      const hasIndividualRegion = formData.region?.trim()
      const hasMultipleRegions = regions.length > 0
      
      if (!hasIndividualRegion && !hasMultipleRegions) {
        newErrors.region = '기본운임에는 지역이 필수입니다'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('필수 항목을 확인해주세요')
      return
    }

    setIsSubmitting(true)

    try {
      // 최종 검증 (API 호출 전)
      if (!formData.loadingPointId || formData.loadingPointId.trim() === '') {
        throw new Error('상차지를 선택해주세요')
      }
      if (!formData.vehicleType || formData.vehicleType.trim() === '') {
        throw new Error('차량타입을 선택해주세요')
      }
      if (!formData.fareType) {
        throw new Error('요율 종류를 선택해주세요')
      }

      const results: CenterFareData[] = []
      
      // 개별 지역이 있는 경우
      const hasIndividualRegion = formData.region?.trim()
      const hasMultipleRegions = regions.length > 0
      
      if (formData.fareType === 'BASIC' && hasIndividualRegion) {
        const fareData: CenterFareData = {
          loadingPointId: formData.loadingPointId!,
          vehicleType: formData.vehicleType!,
          region: formData.region!.trim(),
          fareType: formData.fareType!,
          baseFare: formData.baseFare!
        }
        
        await createCenterFare(fareData)
        results.push(fareData)
      }
      
      // 다중 지역이 있는 경우 (BASIC 타입만)
      if (formData.fareType === 'BASIC' && hasMultipleRegions) {
        for (const region of regions) {
          const fareData: CenterFareData = {
            loadingPointId: formData.loadingPointId!,
            vehicleType: formData.vehicleType!,
            region: region,
            fareType: formData.fareType!,
            baseFare: formData.baseFare!
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
      
      // STOP_FEE 타입의 경우
      if (formData.fareType === 'STOP_FEE') {
        const fareData: CenterFareData = {
          loadingPointId: formData.loadingPointId!,
          vehicleType: formData.vehicleType!,
          region: null, // STOP_FEE는 region 없음
          fareType: formData.fareType!,
          extraStopFee: formData.extraStopFee!,
          extraRegionFee: formData.extraRegionFee!
        }
        
        await createCenterFare(fareData)
        results.push(fareData)
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

  const selectedLoadingPoint = loadingPoints.find(lp => lp.id === formData.loadingPointId)

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
                  {rate.region}: {(rate.baseFare || rate.extraStopFee || 0).toLocaleString()}원
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 상차지 선택 */}
          <div>
            <Label htmlFor="loadingPointId">상차지 *</Label>
            <Select
              value={formData.loadingPointId || ''}
              onValueChange={(value) => handleFieldChange('loadingPointId', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className={errors.loadingPointId ? 'border-destructive' : ''}>
                <SelectValue placeholder="상차지 선택" />
              </SelectTrigger>
              <SelectContent>
                {loadingPoints.map((lp) => (
                  <SelectItem key={lp.id} value={lp.id}>
                    {lp.centerName} - {lp.loadingPointName || lp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.loadingPointId && <p className="text-sm text-destructive mt-1">{errors.loadingPointId}</p>}
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

          {/* 요율 종류 선택 */}
          <div>
            <Label htmlFor="fareType">요율 종류 *</Label>
            <Select
              value={formData.fareType || ''}
              onValueChange={(value) => handleFieldChange('fareType', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className={errors.fareType ? 'border-destructive' : ''}>
                <SelectValue placeholder="요율 종류 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASIC">기본운임</SelectItem>
                <SelectItem value="STOP_FEE">경유운임</SelectItem>
              </SelectContent>
            </Select>
            {errors.fareType && <p className="text-sm text-destructive mt-1">{errors.fareType}</p>}
          </div>

          {/* 지역 입력 (기본운임일 때만) */}
          {formData.fareType === 'BASIC' && (
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
          )}

          {/* 요율 입력 */}
          {formData.fareType === 'BASIC' && (
            <div>
              <Label htmlFor="baseFare">기본운임 (원) *</Label>
              <Input
                id="baseFare"
                type="number"
                value={formData.baseFare || ''}
                onChange={(e) => handleFieldChange('baseFare', parseInt(e.target.value) || 0)}
                placeholder="기본운임 입력"
                className={errors.baseFare ? 'border-destructive' : ''}
                min="0"
                disabled={isSubmitting}
              />
              {errors.baseFare && <p className="text-sm text-destructive mt-1">{errors.baseFare}</p>}
            </div>
          )}

          {formData.fareType === 'STOP_FEE' && (
            <>
              <div>
                <Label htmlFor="extraStopFee">경유운임 (원) *</Label>
                <Input
                  id="extraStopFee"
                  type="number"
                  value={formData.extraStopFee || ''}
                  onChange={(e) => handleFieldChange('extraStopFee', parseInt(e.target.value) || 0)}
                  placeholder="경유운임 입력"
                  className={errors.extraStopFee ? 'border-destructive' : ''}
                  min="0"
                  disabled={isSubmitting}
                />
                {errors.extraStopFee && <p className="text-sm text-destructive mt-1">{errors.extraStopFee}</p>}
              </div>

              <div>
                <Label htmlFor="extraRegionFee">지역운임 (원) *</Label>
                <Input
                  id="extraRegionFee"
                  type="number"
                  value={formData.extraRegionFee || ''}
                  onChange={(e) => handleFieldChange('extraRegionFee', parseInt(e.target.value) || 0)}
                  placeholder="지역운임 입력"
                  className={errors.extraRegionFee ? 'border-destructive' : ''}
                  min="0"
                  disabled={isSubmitting}
                />
                {errors.extraRegionFee && <p className="text-sm text-destructive mt-1">{errors.extraRegionFee}</p>}
              </div>
            </>
          )}

          {/* 미리보기 */}
          {formData.loadingPointId && formData.vehicleType && formData.fareType && (
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">등록될 요율</div>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">센터:</span> {selectedLoadingPoint?.centerName} - {selectedLoadingPoint?.loadingPointName}</div>
                <div><span className="font-medium">차량:</span> {formData.vehicleType}</div>
                <div><span className="font-medium">요율종류:</span> {formData.fareType === 'BASIC' ? '기본운임' : '경유운임'}</div>
                {formData.fareType === 'BASIC' && (
                  <>
                    {formData.region && (
                      <div><span className="font-medium">지역:</span> {formData.region}</div>
                    )}
                    {regions.length > 0 && (
                      <div><span className="font-medium">지역:</span> {regions.join(', ')}</div>
                    )}
                    {formData.baseFare && (
                      <div><span className="font-medium">기본운임:</span> {formData.baseFare.toLocaleString()}원</div>
                    )}
                  </>
                )}
                {formData.fareType === 'STOP_FEE' && (
                  <>
                    {formData.extraStopFee && (
                      <div><span className="font-medium">경유운임:</span> {formData.extraStopFee.toLocaleString()}원</div>
                    )}
                    {formData.extraRegionFee && (
                      <div><span className="font-medium">지역운임:</span> {formData.extraRegionFee.toLocaleString()}원</div>
                    )}
                  </>
                )}
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
