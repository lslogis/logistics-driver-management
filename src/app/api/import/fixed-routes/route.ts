import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { createFixedRouteSchema } from '@/lib/validations/fixedRoute'
import { parseImportFile, validateFileSize, validateHeaders, generateCSV } from '@/lib/services/import.service'

// Template headers for fixed routes CSV
const REQUIRED_HEADERS = ['노선명']
const TEMPLATE_HEADERS = ['노선명', '상차지ID', '배정기사ID', '계약형태', '일매출', '일비용', '운행요일']

// CSV data to FixedRoute object conversion
function csvRowToFixedRoute(row: any) {
  const { mapRowHeaders } = require('@/lib/services/import.service')
  const mappedRow = mapRowHeaders(row)
  
  const rawData: any = {}
  
  // Header mapping
  if (mappedRow['노선명']) rawData.routeName = String(mappedRow['노선명']).trim()
  if (mappedRow['상차지ID']) rawData.loadingPointId = String(mappedRow['상차지ID']).trim()
  if (mappedRow['배정기사ID']) rawData.assignedDriverId = String(mappedRow['배정기사ID']).trim() || undefined
  if (mappedRow['계약형태']) rawData.contractType = String(mappedRow['계약형태']).trim() || 'FIXED_DAILY'
  if (mappedRow['일매출']) rawData.revenueDaily = Number(mappedRow['일매출']) || undefined
  if (mappedRow['일비용']) rawData.costDaily = Number(mappedRow['일비용']) || undefined
  
  // Parse weekday pattern (comma-separated numbers)
  if (mappedRow['운행요일']) {
    const weekdayStr = String(mappedRow['운행요일']).trim()
    if (weekdayStr) {
      rawData.weekdayPattern = weekdayStr.split(',').map(day => parseInt(day.trim())).filter(day => day >= 0 && day <= 6)
    }
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
          // Convert CSV row to FixedRoute object
          const fixedRouteData = csvRowToFixedRoute(row)
          
          // Zod schema validation
          const validatedFixedRoute = createFixedRouteSchema.parse(fixedRouteData)
          
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
          
          // Check DB duplicates
          const existingRoute = await prisma.routeTemplate.findFirst({
            where: {
              name: validatedFixedRoute.routeName
            },
            select: {
              id: true,
              name: true
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
            data: csvRowToFixedRoute(row)
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
              errors: results.errors.slice(0, 10), // First 10 errors only
              preview: results.validData.slice(0, 5) // First 5 preview
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

      // Transaction bulk insert
      const createdRoutes = await prisma.$transaction(async (tx) => {
        const routes = []
        for (const route of validFixedRoutes) {
          // Map to routeTemplate structure
          const created = await tx.routeTemplate.create({
            data: {
              name: route.routeName,
              loadingPointId: route.loadingPointId || null,
              defaultDriverId: route.assignedDriverId || null,
              weekdayPattern: route.weekdayPattern || [],
              billingFare: route.revenueDaily || null,
              driverFare: route.costDaily || null,
              isActive: true
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
            errors: results.errors.slice(0, 10)
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
      // Generate CSV template
      const csvContent = generateCSV(TEMPLATE_HEADERS, [
        {
          '노선명': '서울-부산',
          '상차지ID': '',
          '배정기사ID': '',
          '계약형태': 'FIXED_DAILY',
          '일매출': '150000',
          '일비용': '120000',
          '운행요일': '1,2,3,4,5'
        },
        {
          '노선명': '인천-대구',
          '상차지ID': '',
          '배정기사ID': '',
          '계약형태': 'FIXED_MONTHLY',
          '일매출': '200000',
          '일비용': '180000',
          '운행요일': '0,1,2,3,4,5,6'
        }
      ])

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