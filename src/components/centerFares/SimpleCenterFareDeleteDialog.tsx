'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { type FareRow } from '@/lib/utils/center-fares'

interface SimpleCenterFareDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: FareRow | null
  onDelete: (id: string) => Promise<void>
}

export function SimpleCenterFareDeleteDialog({ 
  open, 
  onOpenChange, 
  row,
  onDelete 
}: SimpleCenterFareDeleteDialogProps) {
  const handleDelete = async () => {
    if (row) {
      try {
        await onDelete(row.id)
        onOpenChange(false)
      } catch (error) {
        // 에러는 부모 컴포넌트에서 처리
        console.error('요율 삭제 실패:', error)
      }
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!row) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl shadow-lg bg-white p-8">
        <DialogHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-4">
            요율 삭제 확인
          </DialogTitle>
          <p className="text-gray-600 text-lg leading-relaxed">
            이 작업은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?
          </p>
        </DialogHeader>
        
        {/* Row Details */}
        <div className="bg-gray-50 rounded-xl p-6 my-6">
          <div className="space-y-4 text-base">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">센터:</span> 
              <span className="text-gray-900">{row.centerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">차량톤수:</span> 
              <span className="text-gray-900">{row.vehicleTypeName}</span>
            </div>
            {row.region && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">지역:</span> 
                <span className="text-gray-900">{row.region}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">요율종류:</span> 
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                row.fareType === '기본운임' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {row.fareType}
              </span>
            </div>
            {row.baseFare && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">기본운임:</span> 
                <span className="font-mono text-gray-900">₩{row.baseFare.toLocaleString()}</span>
              </div>
            )}
            {row.extraStopFee && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">경유운임:</span> 
                <span className="font-mono text-gray-900">₩{row.extraStopFee.toLocaleString()}</span>
              </div>
            )}
            {row.extraRegionFee && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">지역운임:</span> 
                <span className="font-mono text-gray-900">₩{row.extraRegionFee.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50 text-base font-medium"
          >
            취소
          </Button>
          <Button 
            onClick={handleDelete}
            className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-base"
          >
            삭제하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}