'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportToExcel, type FareRow } from '@/lib/utils/excel'
import { toast } from 'react-hot-toast'

interface ExportButtonProps {
  rows: FareRow[]
}

export function ExportButton({ rows }: ExportButtonProps) {
  const handleExport = () => {
    if (rows.length === 0) {
      toast.error('내보낼 데이터가 없습니다')
      return
    }

    try {
      exportToExcel(rows, 'center-fares')
      toast.success(`${rows.length}건의 요율 데이터를 Excel로 내보냈습니다`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('내보내기 중 오류가 발생했습니다')
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleExport}
      className="h-12 px-6 rounded-xl border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-colors font-medium"
    >
      <Download className="h-5 w-5 mr-2" />
      내보내기
    </Button>
  )
}