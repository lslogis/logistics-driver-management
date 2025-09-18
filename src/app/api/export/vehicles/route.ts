import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

// 쿼리 파라미터 스키마
const exportQuerySchema = z.object({
  format: z.enum(['excel', 'csv']).default('excel'),
  includeInactive: z.enum(['true', 'false']).default('false'),
  vehicleType: z.string().optional(),
  ownershipType: z.enum(['OWNED', 'RENTAL', 'ENTRUSTED']).optional(),
  vehicleIds: z.string().optional()
})

/**
 * GET /api/export/vehicles - 차량 정보 내보내기
 * Query params:
 * - format: 'excel' | 'csv' (기본값: excel)
 * - includeInactive: 'true' | 'false' (기본값: false)
 * - vehicleType: 차량 유형 필터 (선택사항)
 * - ownershipType: 소유구분 필터 (선택사항)
 * - vehicleIds: 쉼표로 구분된 차량 ID 목록 (선택사항)
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
        vehicleType: searchParams.get('vehicleType') || undefined,
        ownershipType: searchParams.get('ownershipType') as any || undefined,
        vehicleIds: searchParams.get('vehicleIds') || undefined
      }
      
      const { format, includeInactive, vehicleType, ownershipType, vehicleIds } = exportQuerySchema.parse(queryData)

      // 필터링 조건 생성
      const where: any = {}
      
      // 활성상태 필터
      if (includeInactive === 'false') {
        where.isActive = true
      }

      // 차량 유형 필터
      if (vehicleType) {
        where.vehicleType = vehicleType
      }

      // 소유구분 필터
      if (ownershipType) {
        where.ownershipType = ownershipType
      }

      // 특정 차량들만 내보내기
      if (vehicleIds) {
        const ids = vehicleIds.split(',').filter(id => id.trim())
        if (ids.length > 0) {
          where.id = { in: ids }
        }
      }

      // 상차지 데이터 조회 (차량 대신)
      const loadingPoints = await prisma.loadingPoint.findMany({
        where,
        include: {
          trips: {
            select: {
              id: true
            },
            where: {
              status: 'COMPLETED',
              date: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          },
          fixedContracts: {
            where: { isActive: true },
            select: {
              id: true,
              routeName: true
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { centerName: 'asc' }
        ]
      })

      if (loadingPoints.length === 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NO_DATA',
            message: '내보낼 차량 데이터가 없습니다'
          }
        }, { status: 404 })
      }

      // 데이터 포맷팅 (한글 헤더)
      const exportData = loadingPoints.map(loadingPoint => ({
        'ID': loadingPoint.id,
        '센터명': loadingPoint.centerName,
        '상차지명': loadingPoint.loadingPointName,
        '지번주소': loadingPoint.lotAddress || '',
        '도로명주소': loadingPoint.roadAddress || '',
        '담당자1': loadingPoint.manager1 || '',
        '담당자2': loadingPoint.manager2 || '',
        '연락처1': loadingPoint.phone1 || '',
        '연락처2': loadingPoint.phone2 || '',
        '비고': loadingPoint.remarks || '',
        '상태': loadingPoint.isActive ? '활성' : '비활성',
        '이번달 운행횟수': loadingPoint.trips.length,
        '고정계약수': loadingPoint.fixedContracts.length,
        '등록일': loadingPoint.createdAt.toISOString().split('T')[0],
        '수정일': loadingPoint.updatedAt.toISOString().split('T')[0]
      }))

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16)

      // 감사 로그 기록
      await createAuditLog(
        user,
        'EXPORT',
        'LoadingPoint',
        'export_' + timestamp,
        { 
          action: 'export',
          format,
          includeInactive: includeInactive === 'true',
          loadingPointCount: loadingPoints.length,
          filters: {
            selectedIds: vehicleIds ? vehicleIds.split(',').length : 'all'
          }
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
            'Content-Disposition': `attachment; filename="loading_points_export_${timestamp}.csv"`,
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
        XLSX.utils.book_append_sheet(workbook, worksheet, '상차지목록')

        // 워크북 메타데이터
        workbook.Props = {
          Title: '상차지 목록',
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
            'Content-Disposition': `attachment; filename="loading_points_export_${timestamp}.xlsx"`,
            'Cache-Control': 'no-cache'
          }
        })
      }

    } catch (error) {
      console.error('Failed to export vehicles:', error)
      
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
          message: '차량 데이터 내보내기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'vehicles', action: 'read' }
)