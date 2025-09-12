import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { formatDriversForExport, formatPhoneForDisplay, formatAccountNumberForExcel } from '@/lib/utils/data-processing'

// 쿼리 파라미터 스키마
const exportQuerySchema = z.object({
  format: z.enum(['excel', 'csv']).default('excel'),
  includeInactive: z.enum(['true', 'false']).default('false'),
  driverIds: z.string().optional()
})

/**
 * GET /api/export/drivers - 기사 정보 내보내기
 * Query params:
 * - format: 'excel' | 'csv' (기본값: excel)
 * - includeInactive: 'true' | 'false' (기본값: false)
 * - driverIds: 쉼표로 구분된 기사 ID 목록 (선택사항)
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const user = await getCurrentUser(req)
      if (!user) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다'
          }
        }, { status: 401 })
      }

      // 쿼리 파라미터 파싱
      const { searchParams } = new URL(req.url)
      const queryData = {
        format: searchParams.get('format') || 'excel',
        includeInactive: searchParams.get('includeInactive') || 'false',
        driverIds: searchParams.get('driverIds') || undefined
      }
      
      const { format, includeInactive, driverIds } = exportQuerySchema.parse(queryData)

      // 필터링 조건 생성
      const where: any = {}
      
      // 활성상태 필터
      if (includeInactive === 'false') {
        where.isActive = true
      }

      // 특정 기사들만 내보내기
      if (driverIds) {
        const ids = driverIds.split(',').filter(id => id.trim())
        if (ids.length > 0) {
          where.id = { in: ids }
        }
      }

      // 기사 데이터 조회 (새로운 9-column structure)
      const drivers = await prisma.driver.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          vehicleNumber: true,
          businessName: true,
          representative: true,
          businessNumber: true,
          bankName: true,
          accountNumber: true,
          remarks: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { isActive: 'desc' },
          { name: 'asc' }
        ]
      })

      if (drivers.length === 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NO_DATA',
            message: '내보낼 기사 데이터가 없습니다'
          }
        }, { status: 404 })
      }

      // 데이터 포맷팅 (9-column Excel structure)
      const exportData = formatDriversForExport(drivers)

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16)

      // 감사 로그 기록
      await createAuditLog(
        user,
        'EXPORT',
        'Driver',
        'export_' + timestamp,
        { 
          action: 'export',
          format,
          includeInactive: includeInactive === 'true',
          driverCount: drivers.length,
          selectedIds: driverIds ? driverIds.split(',').length : 'all'
        },
        { source: 'web_api' }
      )

      if (format === 'csv') {
        // CSV 내보내기
        const csvContent = Papa.unparse(exportData, {
          header: true,
        })

        const BOM = '\uFEFF' // Excel 한글 지원
        const csvWithBOM = BOM + csvContent

        return new Response(csvWithBOM, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="drivers_export_${timestamp}.csv"`,
            'Cache-Control': 'no-cache'
          }
        })
      } else {
        // Excel 내보내기
        const worksheet = XLSX.utils.json_to_sheet(exportData)
        
        // 컬럼 너비 자동 조정
        const colWidths = Object.keys(exportData[0] || {}).map(key => ({
          wch: Math.max(
            key.length,
            ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
          )
        }))
        worksheet['!cols'] = colWidths

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, '기사목록')

        // 워크북 메타데이터
        workbook.Props = {
          Title: '기사 목록',
          Subject: '운송기사관리시스템 데이터',
          Author: user.name,
          CreatedDate: new Date()
        }

        const excelBuffer = XLSX.write(workbook, { 
          type: 'buffer', 
          bookType: 'xlsx',
          compression: true
        })

        return new Response(excelBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="drivers_export_${timestamp}.xlsx"`,
            'Cache-Control': 'no-cache'
          }
        })
      }

    } catch (error) {
      console.error('Failed to export drivers:', error)
      
      if (error instanceof ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '쿼리 파라미터가 올바르지 않습니다',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      if (error instanceof Error) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'EXPORT_ERROR',
            message: error.message
          }
        }, { status: 500 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '기사 데이터 내보내기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'drivers', action: 'read' }
)