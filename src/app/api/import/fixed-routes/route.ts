import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { CreateFixedRouteSchema } from '@/lib/validations/fixedRoute'
import { parseImportFile, validateFileSize, validateHeaders, generateCSV } from '@/lib/services/import.service'

// Template headers for fixed routes CSV (실제 DB 필드에 맞춘 수정)
const REQUIRED_HEADERS = ['노선명', '센터명', '운행요일', '계약형태']
const TEMPLATE_HEADERS = [
  '노선명',           // 필수: routeName
  '센터명',           // 필수: centerName으로 loadingPointId 찾기  
  '운행요일',         // 필수: "월,화,수,목,금" → [1,2,3,4,5]
  '계약형태',         // 필수: 고정(일대), 고정(월대), 고정(지입)
  '배정기사명',       // 선택: name으로 assignedDriverId 찾기
  '일매출',          // 선택: revenueDaily (일대 계약시)
  '일매입',          // 선택: costDaily (일대 계약시)
  '월매출',          // 선택: revenueMonthly (월대 계약시)
  '월매입',          // 선택: costMonthly (월대 계약시)
  '월매출(비용포함)', // 선택: revenueMonthlyWithExpense
  '월매입(비용포함)', // 선택: costMonthlyWithExpense
  '비고'             // 선택: remarks
]

// CSV data to FixedRoute object conversion (실제 DB 필드에 맞춘 수정)
async function csvRowToFixedRoute(row: any) {
  const { mapRowHeaders } = require('@/lib/services/import.service')
  const mappedRow = mapRowHeaders(row)
  
  const rawData: any = {}
  
  // 필수 필드 매핑
  if (mappedRow['노선명']) rawData.routeName = String(mappedRow['노선명']).trim()
  
  // 계약형태 매핑 (한글 → DB값)
  if (mappedRow['계약형태']) {
    const contractTypeInput = String(mappedRow['계약형태']).trim()
    const contractTypeMap: Record<string, string> = {
      '고정(일대)': 'FIXED_DAILY',
      '고정(월대)': 'FIXED_MONTHLY', 
      '고정(지입)': 'CONSIGNED_MONTHLY',
      // 기존 DB값도 허용 (호환성)
      'FIXED_DAILY': 'FIXED_DAILY',
      'FIXED_MONTHLY': 'FIXED_MONTHLY',
      'CONSIGNED_MONTHLY': 'CONSIGNED_MONTHLY'
    }
    
    if (contractTypeMap[contractTypeInput]) {
      rawData.contractType = contractTypeMap[contractTypeInput]
    } else {
      rawData._contractTypeError = `유효하지 않은 계약형태: ${contractTypeInput} (예: 고정(일대), 고정(월대), 고정(지입))`
    }
  }
  
  // 센터명으로 상차지 찾기
  if (mappedRow['센터명']) {
    const centerName = String(mappedRow['센터명']).trim()
    if (centerName) {
      const loadingPoint = await prisma.loadingPoint.findFirst({
        where: {
          centerName: centerName,
          isActive: true
        },
        select: { id: true, centerName: true }
      })
      
      if (loadingPoint) {
        rawData.loadingPointId = loadingPoint.id
      } else {
        // 상차지를 찾지 못한 경우 에러 표시용으로 centerName 저장
        rawData._centerNameError = `상차지를 찾을 수 없습니다: ${centerName}`
      }
    }
  }
  
  // 배정기사명으로 기사 찾기 (선택 필드)
  if (mappedRow['배정기사명']) {
    const driverName = String(mappedRow['배정기사명']).trim()
    if (driverName) {
      const driver = await prisma.driver.findFirst({
        where: {
          name: driverName,
          isActive: true
        },
        select: { id: true, name: true }
      })
      
      if (driver) {
        rawData.assignedDriverId = driver.id
      } else {
        // 기사를 찾지 못한 경우 에러 표시용으로 driverName 저장
        rawData._driverNameError = `기사를 찾을 수 없습니다: ${driverName}`
      }
    }
  }
  
  // 운행요일 파싱: "월,화,수,목,금" → [1,2,3,4,5]
  if (mappedRow['운행요일']) {
    const weekdayStr = String(mappedRow['운행요일']).trim()
    if (weekdayStr) {
      const weekdayMap: Record<string, number> = {
        '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6
      }
      
      const weekdays = weekdayStr.split(',').map(day => {
        const trimmed = day.trim()
        return weekdayMap[trimmed]
      }).filter(num => num !== undefined)
      
      if (weekdays.length > 0) {
        rawData.weekdayPattern = weekdays
      } else {
        rawData._weekdayError = `유효하지 않은 요일 형식: ${weekdayStr} (예: 월,화,수,목,금)`
      }
    }
  }
  
  // 선택 필드 매핑 - 매출/매입 정보
  if (mappedRow['일매출']) {
    const value = Number(mappedRow['일매출'])
    if (!isNaN(value) && value > 0) rawData.revenueDaily = value
  }
  if (mappedRow['일매입']) {
    const value = Number(mappedRow['일매입'])
    if (!isNaN(value) && value > 0) rawData.costDaily = value
  }
  if (mappedRow['월매출']) {
    const value = Number(mappedRow['월매출'])
    if (!isNaN(value) && value > 0) rawData.revenueMonthly = value
  }
  if (mappedRow['월매입']) {
    const value = Number(mappedRow['월매입'])
    if (!isNaN(value) && value > 0) rawData.costMonthly = value
  }
  if (mappedRow['월매출(비용포함)']) {
    const value = Number(mappedRow['월매출(비용포함)'])
    if (!isNaN(value) && value > 0) rawData.revenueMonthlyWithExpense = value
  }
  if (mappedRow['월매입(비용포함)']) {
    const value = Number(mappedRow['월매입(비용포함)'])
    if (!isNaN(value) && value > 0) rawData.costMonthlyWithExpense = value
  }
  
  // 비고
  if (mappedRow['비고']) {
    const remarks = String(mappedRow['비고']).trim()
    if (remarks) rawData.remarks = remarks
  }
  
  return rawData
}

/**
 * POST /api/import/fixed-routes - Fixed routes CSV bulk import
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

      // FormData parsing
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

      // File format validation
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

      // File size validation
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

      // File parsing
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

      // Header validation
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

      // Data validation and conversion
      const results = {
        total: rows.length,
        valid: 0,
        invalid: 0,
        duplicates: 0,
        imported: 0,
        errors: [] as Array<{ row: number; error: string; data?: any }>,
        validData: [] as any[]
      }

      const validFixedRoutes: any[] = []
      const routeNames = new Set<string>()

      for (let i = 0; i < rows.length; i++) {
        const rowIndex = i + 2 // Actual CSV row number (including header)
        const row = rows[i]
        
        try {
          // Convert CSV row to FixedRoute object (async 처리)
          const fixedRouteData = await csvRowToFixedRoute(row)
          
          // 변환 과정에서 발생한 에러 체크
          const conversionErrors = []
          if (fixedRouteData._centerNameError) conversionErrors.push(fixedRouteData._centerNameError)
          if (fixedRouteData._driverNameError) conversionErrors.push(fixedRouteData._driverNameError)
          if (fixedRouteData._weekdayError) conversionErrors.push(fixedRouteData._weekdayError)
          if (fixedRouteData._contractTypeError) conversionErrors.push(fixedRouteData._contractTypeError)
          
          if (conversionErrors.length > 0) {
            results.errors.push({
              row: rowIndex,
              error: conversionErrors.join(', '),
              data: fixedRouteData
            })
            results.invalid++
            continue
          }
          
          // 임시 에러 필드 제거
          delete fixedRouteData._centerNameError
          delete fixedRouteData._driverNameError
          delete fixedRouteData._weekdayError
          delete fixedRouteData._contractTypeError
          
          // Zod schema validation
          const validatedFixedRoute = CreateFixedRouteSchema.parse(fixedRouteData)
          
          // Check duplicates within batch
          if (routeNames.has(validatedFixedRoute.routeName)) {
            results.errors.push({
              row: rowIndex,
              error: `파일 내 중복된 노선명입니다: ${validatedFixedRoute.routeName}`,
              data: fixedRouteData
            })
            results.duplicates++
            results.invalid++
            continue
          }
          
          // Check DB duplicates (FixedRoute 테이블에서 확인)
          const existingRoute = await prisma.fixedRoute.findFirst({
            where: {
              routeName: validatedFixedRoute.routeName,
              isActive: true
            },
            select: {
              id: true,
              routeName: true
            }
          })
          
          if (existingRoute) {
            results.errors.push({
              row: rowIndex,
              error: `이미 등록된 노선명입니다: ${validatedFixedRoute.routeName}`,
              data: fixedRouteData
            })
            results.duplicates++
            results.invalid++
            continue
          }

          routeNames.add(validatedFixedRoute.routeName)
          validFixedRoutes.push(validatedFixedRoute)
          results.validData.push({
            ...validatedFixedRoute,
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
            data: await csvRowToFixedRoute(row)
          })
          results.invalid++
        }
      }

      // Simulation mode - return validation results only
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

      // Commit mode - actual saving
      if (validFixedRoutes.length === 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NO_VALID_DATA',
            message: '가져올 수 있는 유효한 데이터가 없습니다',
            details: results
          }
        }, { status: 400 })
      }

      // Transaction bulk insert (FixedRoute 테이블에 저장)
      const createdRoutes = await prisma.$transaction(async (tx) => {
        const routes = []
        for (const route of validFixedRoutes) {
          // FixedRoute 구조에 맞춰 데이터 생성
          const created = await tx.fixedRoute.create({
            data: {
              id: route.id || undefined, // Prisma가 자동 생성하게 하려면 undefined
              routeName: route.routeName,
              loadingPointId: route.loadingPointId,
              assignedDriverId: route.assignedDriverId || null,
              weekdayPattern: route.weekdayPattern,
              contractType: route.contractType,
              
              // 매출/매입 필드들
              revenueDaily: route.revenueDaily || null,
              costDaily: route.costDaily || null,
              revenueMonthly: route.revenueMonthly || null,
              costMonthly: route.costMonthly || null,
              revenueMonthlyWithExpense: route.revenueMonthlyWithExpense || null,
              costMonthlyWithExpense: route.costMonthlyWithExpense || null,
              
              remarks: route.remarks || null,
              isActive: true,
              createdBy: null,
              updatedAt: new Date()
            }
          })
          routes.push(created)
        }
        return routes
      })
      
      results.imported = createdRoutes.length

      // Audit log
      await createAuditLog(
        user,
        'CREATE',
        'FixedRoute',
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
          message: `${results.imported}개의 고정노선이 성공적으로 등록되었습니다`,
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
      console.error('Failed to import fixed routes:', error)
      
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
          message: '고정노선 가져오기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'create' }
)

/**
 * GET /api/import/fixed-routes/template - CSV template download
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      // Generate CSV template (실제 DB 필드에 맞춘 수정)
      const csvContent = generateCSV(TEMPLATE_HEADERS, [])

      // Add BOM for Korean recognition in Excel
      const BOM = '\uFEFF'
      const csvWithBOM = BOM + csvContent

      return new Response(csvWithBOM, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="fixed_routes_template.csv"'
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
  { resource: 'fixed_routes', action: 'read' }
)