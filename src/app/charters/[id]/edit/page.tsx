'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { CharterForm } from '@/components/charters/CharterForm'
import { useCharterById, useUpdateCharter } from '@/hooks/useCharters'
import { useAuth } from '@/hooks/useAuth'
import { UpdateCharterRequestData } from '@/lib/services/charter.service'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export default function EditCharterPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const charterId = params?.id as string
  
  const { data: charter, isLoading, error } = useCharterById(charterId)
  const updateMutation = useUpdateCharter()

  const handleSubmit = async (data: UpdateCharterRequestData) => {
    try {
      await updateMutation.mutateAsync({ id: charterId, data })
      toast.success('용차가 수정되었습니다')
      router.push(`/charters/${charterId}`)
    } catch (error: any) {
      console.error('Charter update error:', error)
      toast.error(error.message || '용차 수정 중 오류가 발생했습니다')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !charter) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">용차를 찾을 수 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error?.message || '요청하신 용차가 존재하지 않거나 권한이 없습니다.'}
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push('/charters')}>
              목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">용차 수정</h1>
          <p className="text-gray-600 mt-1">
            용차 요청 정보를 수정합니다
          </p>
        </div>
      </div>

      {/* Form */}
      <CharterForm
        mode="edit"
        initialData={{
          centerId: charter.centerId,
          vehicleType: charter.vehicleType as any,
          date: charter.date,
          destinations: charter.destinations.map((d: any) => ({
            region: d.region,
            order: d.order
          })),
          isNegotiated: charter.isNegotiated,
          negotiatedFare: charter.negotiatedFare ?? undefined,
          baseFare: charter.baseFare,
          regionFare: charter.regionFare,
          stopFare: charter.stopFare,
          extraFare: charter.extraFare,
          totalFare: charter.totalFare,
          driverId: charter.driverId ?? undefined,
          driverFare: charter.driverFare,
          notes: charter.notes ?? undefined
        } as any}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateMutation.isPending}
        userRole={user?.role}
      />
    </div>
  )
}