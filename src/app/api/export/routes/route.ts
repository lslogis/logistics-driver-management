import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'

// 쿼리 파라미터 스키마
const exportQuerySchema = z.object({
  format: z.enum(['excel', 'csv']).default('excel'),
  includeInactive: z.enum(['true', 'false']).default('false'),
  routeIds: z.string().optional()
})

/**
 * GET /api/export/routes - 노선 정보 내보내기
 * Query params:
 * - format: 'excel' | 'csv' (기본값: excel)
 * - includeInactive: 'true' | 'false' (기본값: false)
 * - routeIds: 쉼표로 구분된 노선 ID 목록 (선택사항)
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
        routeIds: searchParams.get('routeIds') || undefined
      }
      
      const { format, includeInactive, routeIds } = exportQuerySchema.parse(queryData)

      // 필터링 조건 생성
      const where: any = {}
      
      // 활성상태 필터
      if (includeInactive === 'false') {
        where.isActive = true
      }

      // 특정 노선들만 내보내기
      if (routeIds) {
        const ids = routeIds.split(',').filter(id => id.trim())
        if (ids.length > 0) {
          where.id = { in: ids }
        }
      }

      // 노선 데이터 조회
      const routes = await prisma.routeTemplate.findMany({
        where,
        include: {
          defaultDriver: {
            select: {
              name: true,
              phone: true
            }
          },
          loadingPointRef: {
            select: {
              centerName: true,
              loadingPointName: true
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { name: 'asc' }
        ]
      })

      if (routes.length === 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NO_DATA',
            message: '내보낼 노선 데이터가 없습니다'
          }
        }, { status: 404 })
      }

      // 요일 배열을 문자열로 변환하는 헬퍼 함수
      const formatWeekdays = (weekdayPattern: number[]) => {
        const dayMap: Record<number, string> = {
          1: '월',
          2: '화', 
          3: '수',
          4: '목',
          5: '금',
          6: '토',
          0: '일'
        }
        return weekdayPattern.map(day => dayMap[day] || day.toString()).join(',')
      }

      // 데이터 포맷팅 (한글 헤더)
      const exportData = routes.map(route => ({
        'ID': route.id,
        '노선명': route.name,
        '상차지': route.loadingPoint,
        '센터명': route.loadingPointRef?.centerName || '',
        '거리(km)': route.distance || '',
        '기사운임': route.driverFare ? Number(route.driverFare) : '',
        '청구운임': route.billingFare ? Number(route.billingFare) : '',
        '운행요일': formatWeekdays(route.weekdayPattern),
        '기본배정기사': route.defaultDriver?.name || '',
        '기사연락처': route.defaultDriver?.phone || '',
        '상태': route.isActive ? '활성' : '비활성',
        '등록일': route.createdAt.toISOString().split('T')[0],
        '수정일': route.updatedAt.toISOString().split('T')[0]
      }))

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16)

      // 감사 로그 기록
      await createAuditLog(
        user,
        'EXPORT',
        'RouteTemplate',
        'export_' + timestamp,
        { 
          action: 'export',
          format,
          includeInactive: includeInactive === 'true',
          routeCount: routes.length,
          selectedIds: routeIds ? routeIds.split(',').length : 'all'
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
            'Content-Disposition': `attachment; filename="routes_export_${timestamp}.csv"`,
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
        XLSX.utils.book_append_sheet(workbook, worksheet, '노선목록')

        // 워크북 메타데이터
        workbook.Props = {
          Title: '노선 목록',
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
            'Content-Disposition': `attachment; filename="routes_export_${timestamp}.xlsx"`,
            'Cache-Control': 'no-cache'
          }
        })
      }

    } catch (error) {
      console.error('Failed to export routes:', error)
      
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
          message: '노선 데이터 내보내기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'read' }
)