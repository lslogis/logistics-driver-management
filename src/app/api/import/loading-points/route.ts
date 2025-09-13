import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { parseImportFile, validateFileSize, validateHeaders, generateCSV } from '@/lib/services/import.service'

// 템플릿 헤더 정의 (순서 변경됨: 담당자1-연락처1, 담당자2-연락처2 순서)
const REQUIRED_HEADERS = ['센터명', '상차지명']
const TEMPLATE_HEADERS = ['센터명', '상차지명', '지번주소', '도로명주소', '담당자1', '연락처1', '담당자2', '연락처2', '비고']

// LoadingPoint 생성 스키마
const createLoadingPointSchema = z.object({
  centerName: z.string().min(1, '센터명을 입력해주세요'),
  loadingPointName: z.string().min(1, '상차지명을 입력해주세요'),
  lotAddress: z.string().optional(),
  roadAddress: z.string().optional(),
  manager1: z.string().optional(),
  phone1: z.string().optional(),
  manager2: z.string().optional(),
  phone2: z.string().optional(),
  remarks: z.string().optional()
})

// CSV 데이터를 LoadingPoint 객체로 변환
function csvRowToLoadingPoint(row: any) {
  // 유연한 헤더 매핑을 사용하여 표준 헤더로 변환
  const { mapRowHeaders } = require('@/lib/services/import.service')
  const mappedRow = mapRowHeaders(row)
  
  const rawData: any = {}
  
  // 헤더 매핑 (유연한 매칭 후 표준 헤더 사용)
  if (mappedRow['센터명']) rawData.centerName = String(mappedRow['센터명']).trim()
  if (mappedRow['상차지명']) rawData.loadingPointName = String(mappedRow['상차지명']).trim()
  if (mappedRow['지번주소']) rawData.lotAddress = String(mappedRow['지번주소']).trim() || undefined
  if (mappedRow['도로명주소']) rawData.roadAddress = String(mappedRow['도로명주소']).trim() || undefined
  if (mappedRow['담당자1']) rawData.manager1 = String(mappedRow['담당자1']).trim() || undefined
  if (mappedRow['연락처1']) rawData.phone1 = String(mappedRow['연락처1']).trim() || undefined
  if (mappedRow['담당자2']) rawData.manager2 = String(mappedRow['담당자2']).trim() || undefined
  if (mappedRow['연락처2']) rawData.phone2 = String(mappedRow['연락처2']).trim() || undefined
  if (mappedRow['비고']) rawData.remarks = String(mappedRow['비고']).trim() || undefined
  
  return rawData
}

/**
 * POST /api/import/loading-points - 상차지 CSV 일괄 등록
 */
export const POST = withAuth(
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

      // FormData 파싱
      const formData = await req.formData()
      const file = formData.get('file') as File
      const mode = formData.get('mode') as string || 'simulate'
      
      if (!file) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NO_FILE',
            message: 'CSV 파일을 선택해주세요'
          }
        }, { status: 400 })
      }

      // 파일 형식 검증 (CSV, Excel 지원)
      const allowedTypes = ['.csv', '.xlsx', '.xls']
      const fileExt = file.name.toLowerCase()
      if (!allowedTypes.some(type => fileExt.endsWith(type))) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'CSV 또는 Excel 파일만 업로드 가능합니다 (.csv, .xlsx, .xls)'
          }
        }, { status: 400 })
      }

      // 파일 크기 검증
      const fileSizeError = validateFileSize(file, 10)
      if (fileSizeError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: fileSizeError
          }
        }, { status: 400 })
      }

      // 파일 파싱 (CSV/Excel 자동 감지)
      const parseResult = await parseImportFile(file)

      if (parseResult.errors.length > 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'FILE_PARSE_ERROR',
            message: '파일을 파싱할 수 없습니다',
            details: parseResult.errors
          }
        }, { status: 400 })
      }

      const rows = parseResult.data
      
      if (rows.length === 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'EMPTY_FILE',
            message: 'CSV 파일이 비어있습니다'
          }
        }, { status: 400 })
      }

      // 헤더 검증
      const headerErrors = validateHeaders(rows, REQUIRED_HEADERS)
      if (headerErrors.length > 0) {
        const headers = rows.length > 0 ? Object.keys(rows[0]) : []
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_HEADERS',
            message: headerErrors[0],
            details: {
              required: REQUIRED_HEADERS,
              found: headers,
              template: TEMPLATE_HEADERS
            }
          }
        }, { status: 400 })
      }

      // 데이터 검증 및 변환
      const results = {
        total: rows.length,
        valid: 0,
        invalid: 0,
        duplicates: 0,
        imported: 0,
        errors: [] as Array<{ row: number; error: string; data?: any }>,
        validData: [] as any[]
      }

      const validLoadingPoints: any[] = []
      const loadingPointNames = new Set<string>()

      for (let i = 0; i < rows.length; i++) {
        const rowIndex = i + 2 // CSV에서 실제 행 번호 (헤더 포함)
        const row = rows[i]
        
        try {
          // CSV 행을 LoadingPoint 객체로 변환
          const loadingPointData = csvRowToLoadingPoint(row)
          
          // Zod 스키마로 검증
          const validatedLoadingPoint = createLoadingPointSchema.parse(loadingPointData)
          
          // 배치 내 중복 체크 (센터명 + 상차지명)
          const uniqueKey = `${validatedLoadingPoint.centerName}:${validatedLoadingPoint.loadingPointName}`
          if (loadingPointNames.has(uniqueKey)) {
            results.errors.push({
              row: rowIndex,
              error: `파일 내 중복된 상차지입니다: ${validatedLoadingPoint.centerName} - ${validatedLoadingPoint.loadingPointName}`,
              data: loadingPointData
            })
            results.duplicates++
            results.invalid++
            continue
          }
          
          // DB 중복 체크 (센터명 + 상차지명 기준)
          const existingLoadingPoint = await prisma.loadingPoint.findFirst({
            where: {
              centerName: validatedLoadingPoint.centerName,
              loadingPointName: validatedLoadingPoint.loadingPointName
            },
            select: {
              id: true,
              centerName: true,
              loadingPointName: true
            }
          })
          
          if (existingLoadingPoint) {
            results.errors.push({
              row: rowIndex,
              error: `이미 등록된 상차지입니다: ${validatedLoadingPoint.centerName} - ${validatedLoadingPoint.loadingPointName}`,
              data: loadingPointData
            })
            results.duplicates++
            results.invalid++
            continue
          }

          loadingPointNames.add(uniqueKey)
          validLoadingPoints.push(validatedLoadingPoint)
          results.validData.push({
            ...validatedLoadingPoint,
            row: rowIndex
          })
          results.valid++
          
        } catch (error) {
          let errorMessage = '데이터 검증 오류'
          
          if (error instanceof ZodError) {
            errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          } else if (error instanceof Error) {
            errorMessage = error.message
          }
          
          results.errors.push({
            row: rowIndex,
            error: errorMessage,
            data: csvRowToLoadingPoint(row)
          })
          results.invalid++
        }
      }

      // 시뮬레이션 모드 - 검증 결과만 반환
      if (mode === 'simulate') {
        return NextResponse.json({
          ok: true,
          data: {
            message: '검증이 완료되었습니다',
            mode: 'simulate',
            results: {
              total: results.total,
              valid: results.valid,
              invalid: results.invalid,
              duplicates: results.duplicates,
              errors: results.errors, // 모든 오류 표시
              preview: results.validData // 모든 유효 데이터 표시
            }
          }
        })
      }

      // 커밋 모드 - 실제 저장
      if (validLoadingPoints.length === 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NO_VALID_DATA',
            message: '가져올 수 있는 유효한 데이터가 없습니다',
            details: results
          }
        }, { status: 400 })
      }

      // 트랜잭션으로 일괄 삽입
      const createdLoadingPoints = await prisma.$transaction(async (tx) => {
        const loadingPoints = []
        for (const loadingPoint of validLoadingPoints) {
          const created = await tx.loadingPoint.create({
            data: {
              ...loadingPoint,
              isActive: true
            }
          })
          loadingPoints.push(created)
        }
        return loadingPoints
      })
      
      results.imported = createdLoadingPoints.length

      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'LoadingPoint',
        'csv_import',
        {
          action: 'csv_import',
          fileName: file.name,
          fileSize: file.size,
          mode: 'commit',
          imported: results.imported,
          total: results.total
        },
        { 
          source: 'csv_import',
          importStats: {
            total: results.total,
            valid: results.valid,
            invalid: results.invalid,
            duplicates: results.duplicates,
            imported: results.imported
          }
        }
      )

      return NextResponse.json({
        ok: true,
        data: {
          message: `${results.imported}개의 상차지가 성공적으로 등록되었습니다`,
          mode: 'commit',
          results: {
            total: results.total,
            valid: results.valid,
            invalid: results.invalid,
            duplicates: results.duplicates,
            imported: results.imported,
            errors: results.errors // 모든 오류 표시
          }
        }
      })

    } catch (error) {
      console.error('Failed to import loading points:', error)
      
      if (error instanceof ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력값이 올바르지 않습니다',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      if (error instanceof Error) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message
          }
        }, { status: 500 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '상차지 가져오기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'loading-points', action: 'create' }
)

/**
 * GET /api/import/loading-points/template - CSV 템플릿 다운로드
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      // CSV 템플릿 생성 (담당자1-연락처1, 담당자2-연락처2 순서)
      const csvContent = generateCSV(TEMPLATE_HEADERS, [
        {
          '센터명': '서울물류센터',
          '상차지명': 'A동 1층',
          '지번주소': '서울시 강남구 역삼동 123-45',
          '도로명주소': '서울시 강남구 테헤란로 123',
          '담당자1': '김담당',
          '연락처1': '02-1234-5678',
          '담당자2': '박부담당',
          '연락처2': '010-1234-5678',
          '비고': '샘플 데이터'
        },
        {
          '센터명': '부산물류센터',
          '상차지명': 'B동 지하1층',
          '지번주소': '부산시 해운대구 우동 456-78',
          '도로명주소': '부산시 해운대구 해운대로 456',
          '담당자1': '이담당',
          '연락처1': '051-9876-5432',
          '담당자2': '',
          '연락처2': '',
          '비고': ''
        }
      ])

      // BOM 추가 (Excel에서 한글 인식을 위해)
      const BOM = '\uFEFF'
      const csvWithBOM = BOM + csvContent

      return new Response(csvWithBOM, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="loading_points_template.csv"'
        }
      })
    } catch (error) {
      console.error('Failed to generate template:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '템플릿 생성 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'loading-points', action: 'read' }
)