'use client'

import React, { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Trash2, Loader2, AlertTriangle, Shield } from 'lucide-react'
import { useDeleteBaseFare } from '@/hooks/useCenterFares'
import { BaseFareRow } from '@/lib/api/center-fares'
import { formatNumber } from '@/lib/utils/format'
import { toast } from 'react-hot-toast'

interface CenterFareDeleteDialogProps {
  fare: BaseFareRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CenterFareDeleteDialog({ fare, open, onOpenChange }: CenterFareDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const deleteMutation = useDeleteBaseFare()

  const handleDelete = async () => {
    if (!fare) return

    try {
      await deleteMutation.mutateAsync(fare.id)
      toast.success('요율이 성공적으로 삭제되었습니다', {
        icon: '✅',
        duration: 3000,
      })
      handleClose()
    } catch (error: any) {
      toast.error(error.message || '요율 삭제 중 오류가 발생했습니다', {
        icon: '❌',
        duration: 4000,
      })
    }
  }

  const handleClose = () => {
    if (!deleteMutation.isPending) {
      setConfirmText('')
      onOpenChange(false)
    }
  }

  const canDelete = confirmText === '삭제'

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[600px] rounded-2xl shadow-lg p-0 gap-0">
        {/* Header */}
        <AlertDialogHeader className="p-8 pb-6 border-b bg-gradient-to-r from-red-50 to-pink-50 rounded-t-2xl">
          <AlertDialogTitle className="text-2xl font-bold flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-red-100 rounded-xl">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            요율 삭제
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 mt-2">
            선택한 요율을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Content */}
        <div className="p-8">
          {/* Fare Details Card */}
          {fare && (
            <Card className="mb-6 bg-gray-50 border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">삭제할 요율 정보</h4>
                  <Badge variant={fare.status === 'active' ? 'default' : 'secondary'}>
                    {fare.status === 'active' ? '활성' : '비활성'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">센터:</span>
                      <span className="font-semibold">{fare.centerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">차량:</span>
                      <span className="font-semibold">{fare.vehicleTypeName}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">지역:</span>
                      <span className="font-semibold">{fare.regionName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">기본료:</span>
                      <span className="font-bold text-green-600">₩{formatNumber(fare.baseFare)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">등록일:</span>
                    <span className="font-medium">
                      {new Date(fare.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning Alert */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 mb-2">⚠️ 삭제 시 주의사항</h4>
                <ul className="text-red-800 text-sm space-y-1">
                  <li>• 삭제된 요율은 <strong>복구할 수 없습니다</strong></li>
                  <li>• 해당 요율을 사용하는 <strong>계산 기록이 영향</strong>받을 수 있습니다</li>
                  <li>• 진행 중인 <strong>정산 작업에 문제</strong>가 발생할 수 있습니다</li>
                  <li>• 대신 <strong>비활성화</strong>를 고려해보세요</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Alternative Action */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-blue-900 font-medium text-sm">
                  💡 추천: 삭제 대신 <strong>비활성화</strong>를 고려해보세요
                </p>
                <p className="text-blue-700 text-xs mt-1">
                  비활성화하면 데이터는 보존되면서 새로운 계산에는 사용되지 않습니다
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Confirmation Input */}
          <div className="space-y-4">
            <Label htmlFor="confirm-input" className="text-base font-semibold text-gray-900">
              삭제 확인
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              정말로 삭제하시려면 아래 입력란에 <strong>&quot;삭제&quot;</strong>를 입력하세요:
            </p>
            <Input
              id="confirm-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="삭제"
              className="h-12 text-base rounded-xl border-2 focus:border-red-500 transition-colors"
              disabled={deleteMutation.isPending}
              autoComplete="off"
            />
            {confirmText && confirmText !== '삭제' && (
              <p className="text-red-600 text-sm">정확히 &quot;삭제&quot;를 입력해주세요</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <AlertDialogFooter className="p-8 pt-4 bg-gray-50 rounded-b-2xl border-t">
          <AlertDialogCancel
            disabled={deleteMutation.isPending}
            className="h-12 px-6 rounded-xl font-medium"
          >
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!canDelete || deleteMutation.isPending}
            className="h-12 px-8 rounded-xl font-medium bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg text-white border-0"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                삭제 중...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                삭제하기
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
