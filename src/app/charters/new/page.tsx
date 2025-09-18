'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CharterForm } from '@/components/charters/CharterForm'
import { useCreateCharter } from '@/hooks/useCharters'
import { useAuth } from '@/hooks/useAuth'
import { CreateCharterRequestData } from '@/lib/services/charter.service'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export default function NewCharterPage() {
  const router = useRouter()
  const { user } = useAuth()
  const createMutation = useCreateCharter()

  const handleSubmit = useCallback(async (data: CreateCharterRequestData | any) => {
    try {
      const result = await createMutation.mutateAsync(data)
      toast.success('용차가 등록되었습니다')
      router.push(`/charters/${result.id}`)
    } catch (error: any) {
      console.error('Charter creation error:', error)
      toast.error(error.message || '용차 등록 중 오류가 발생했습니다')
    }
  }, [createMutation, router])

  const handleCancel = useCallback(() => {
    router.back()
  }, [router])

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">새 용차 등록</h1>
          <p className="text-gray-600 mt-1">
            새로운 용차 요청을 등록합니다
          </p>
        </div>
      </div>

      {/* Form */}
      <CharterForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createMutation.isPending}
        userRole={user?.role}
      />
    </div>
  )
}