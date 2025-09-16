'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCreateCenterFare } from '@/hooks/useCharters'
import { useLoadingPoints } from '@/hooks/useLoadingPoints'
import { AlertTriangle, DollarSign } from 'lucide-react'
import { toast } from 'react-hot-toast'

const centerFareSchema = z.object({
  fares: z.array(z.object({
    region: z.string(),
    fare: z.number().int().min(0, '요율은 0 이상이어야 합니다')
  }))
})

type CenterFareFormData = z.infer<typeof centerFareSchema>

interface CenterFareCreateModalProps {
  isOpen: boolean
  onClose: () => void
  centerId: string
  vehicleType: string
  missingRegions: string[]
  onSuccess?: () => void
}

export function CenterFareCreateModal({
  isOpen,
  onClose,
  centerId,
  vehicleType,
  missingRegions,
  onSuccess
}: CenterFareCreateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const createCenterFare = useCreateCenterFare()
  const { data: loadingPointsData } = useLoadingPoints()
  
  // Extract loading points from the paginated response
  const loadingPoints = loadingPointsData?.pages?.flatMap(page => page.data || []) || []
  const centerName = loadingPoints.find(lp => lp.id === centerId)?.centerName || '선택된 센터'

  const form = useForm<CenterFareFormData>({
    resolver: zodResolver(centerFareSchema),
    defaultValues: {
      fares: missingRegions.map(region => ({
        region,
        fare: 0
      }))
    }
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const handleSubmit = async (data: CenterFareFormData) => {
    setIsSubmitting(true)
    
    try {
      // Submit each fare
      for (const fareData of data.fares) {
        if (fareData.fare > 0) {
          await createCenterFare.mutateAsync({
            centerId,
            vehicleType,
            region: fareData.region,
            fare: fareData.fare
          })
        }
      }
      
      toast.success('요율이 등록되었습니다.')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Center fare creation error:', error)
      toast.error(error.message || '요율 등록 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            요율 등록
          </DialogTitle>
          <DialogDescription>
            다음 조합의 요율이 없어서 요금을 계산할 수 없습니다. 
            요율을 등록한 후 요금을 다시 계산합니다.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div><strong>센터:</strong> {centerName}</div>
              <div><strong>차량 타입:</strong> {vehicleType}</div>
              <div><strong>누락된 지역:</strong> {missingRegions.join(', ')}</div>
            </div>
          </AlertDescription>
        </Alert>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-4">
            <Label className="text-base font-medium">지역별 기본 요율</Label>
            
            {missingRegions.map((region, index) => (
              <div key={region} className="grid grid-cols-3 gap-4 items-center p-4 border rounded-lg">
                <div className="font-medium">{region}</div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    disabled={isSubmitting}
                    {...form.register(`fares.${index}.fare`, { valueAsNumber: true })}
                    className="text-right"
                  />
                  <span className="text-sm text-gray-500">원</span>
                </div>
                <div className="text-sm text-gray-600">
                  {form.watch(`fares.${index}.fare`) > 0 
                    ? formatCurrency(form.watch(`fares.${index}.fare`))
                    : '요율을 입력하세요'
                  }
                </div>
              </div>
            ))}
          </div>

          {form.formState.errors.fares && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {form.formState.errors.fares.message || '입력값을 확인해주세요'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-24"
            >
              {isSubmitting ? '등록 중...' : '등록'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}