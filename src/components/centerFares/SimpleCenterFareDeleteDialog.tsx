'use client'

import React from 'react'
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
import { AlertTriangle } from 'lucide-react'
import { type FareRow } from '@/lib/utils/excel'

interface SimpleCenterFareDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: FareRow | null
  onDelete: (id: string) => void
}

export function SimpleCenterFareDeleteDialog({ 
  open, 
  onOpenChange, 
  row,
  onDelete 
}: SimpleCenterFareDeleteDialogProps) {
  const handleDelete = () => {
    if (row) {
      onDelete(row.id)
      onOpenChange(false)
    }
  }

  if (!row) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl shadow-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                요율 삭제 확인
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 mt-1">
                이 작업은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        {/* Row Details */}
        <div className="bg-gray-50 rounded-xl p-4 my-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium text-gray-700">센터:</span> {row.centerName}</div>
            <div><span className="font-medium text-gray-700">차량톤수:</span> {row.vehicleTypeName}</div>
            <div><span className="font-medium text-gray-700">요율종류:</span> {row.fareType}</div>
            {row.baseFare && (
              <div><span className="font-medium text-gray-700">기본운임:</span> ₩{row.baseFare.toLocaleString()}</div>
            )}
            {row.extraStopFee && (
              <div><span className="font-medium text-gray-700">경유운임:</span> ₩{row.extraStopFee.toLocaleString()}</div>
            )}
            {row.extraRegionFee && (
              <div><span className="font-medium text-gray-700">지역운임:</span> ₩{row.extraRegionFee.toLocaleString()}</div>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 rounded-xl"
          >
            삭제하기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}