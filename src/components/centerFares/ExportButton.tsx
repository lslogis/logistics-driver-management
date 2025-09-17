'use client'

import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { useExportCenterFares } from '@/hooks/useCenterFares'
import { toast } from 'react-hot-toast'

interface ExportButtonProps {
  // props는 필요 없음 - API에서 직접 데이터를 가져와서 export
}

export function ExportButton({}: ExportButtonProps) {
  const exportMutation = useExportCenterFares()

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync()
      toast.success('요율 데이터를 Excel로 내보냈습니다')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('내보내기 중 오류가 발생했습니다')
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleExport}
      disabled={exportMutation.isPending}
      className="h-12 px-6 rounded-xl border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-colors font-medium disabled:opacity-50"
    >
      {exportMutation.isPending ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          내보내는 중...
        </>
      ) : (
        <>
          <Download className="h-5 w-5 mr-2" />
          내보내기
        </>
      )}
    </Button>
  )
}