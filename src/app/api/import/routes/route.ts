import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { parseImportFile, validateFileSize, validateHeaders, generateCSV } from '@/lib/services/import.service'
// Weekday enum is not available, we'll use numbers instead (0=Sunday, 1=Monday, etc.)

// 템플릿 헤더 정의
const REQUIRED_HEADERS = ['노선명', '상차지', '기사운임', '청구운임', '운행요일']
const TEMPLATE_HEADERS = ['노선명', '상차지', '거리(km)', '기사운임', '청구운임', '운행요일', '기본배정기사전화번호', '비고']

// 요일 매핑 (0=Sunday, 1=Monday, etc.)
const WEEKDAY_MAP: Record<string, number> = {
  '월': 1,
  '화': 2,
  '수': 3,
  '목': 4,
  '금': 5,
  '토': 6,
  '일': 0
}

// CSV 데이터를 RouteTemplate 객체로 변환
function csvRowToRoute(row: any) {
  const data: any = {}
  
  // 필수 필드
  if (row['노선명']) data.name = row['노선명'].trim()
  if (row['상차지']) data.loadingPoint = row['상차지'].trim()
  
  // 운임 처리
  if (row['기사운임']) {
    const fare = parseFloat(row['기사운임'].toString().replace(/[^\d.-]/g, ''))
    if (!isNaN(fare) && fare > 0) data.driverFare = fare.toString()
  }
  
  if (row['청구운임']) {
    const fare = parseFloat(row['청구운임'].toString().replace(/[^\d.-]/g, ''))
    if (!isNaN(fare) && fare > 0) data.billingFare = fare.toString()
  }
  
  // 거리 (선택사항)
  if (row['거리(km)']) {
    const distance = parseFloat(row['거리(km)'].toString().replace(/[^\d.-]/g, ''))
    if (!isNaN(distance) && distance > 0) data.distance = distance
  }
  
  // 운행요일 처리
  if (row['운행요일']) {
    const weekdaysStr = row['운행요일'].trim()
    const weekdayChars = weekdaysStr.split(/[,\s]+/).filter((day: string) => day.trim())
    
    const weekdayPattern: number[] = []
    for (const dayChar of weekdayChars) {
      const weekday = WEEKDAY_MAP[dayChar.trim()]
      if (weekday !== undefined) {
        weekdayPattern.push(weekday)
      } else {
        throw new Error(`지원하지 않는 요일입니다: ${dayChar}. 사용 가능: 월,화,수,목,금,토,일`)
      }
    }
    
    if (weekdayPattern.length === 0) {
      throw new Error('최소 1개 이상의 운행요일이 필요합니다')
    }
    
    data.weekdayPattern = weekdayPattern
  }
  
  // 선택적 필드
  if (row['기본배정기사전화번호']) data.assignedDriverPhone = row['기본배정기사전화번호'].trim()
  if (row['비고']) data.remarks = row['비고'].trim()
  
  return data
}

/**
 * POST /api/import/routes - 노선 템플릿 CSV 일괄 등록
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

      // 기사 데이터 미리 로드 (배정 기사 검증용)
      const drivers = await prisma.driver.findMany({
        where: { isActive: true },
        select: { id: true, phone: true, name: true }
      })
      const driverMap = new Map(drivers.map(d => [d.phone, d]))

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

      const validRoutes: any[] = []
      const routeNames = new Set<string>()

      for (let i = 0; i < rows.length; i++) {
        const rowIndex = i + 2 // CSV에서 실제 행 번호 (헤더 포함)
        const row = rows[i]
        
        try {
          // CSV 행을 RouteTemplate 객체로 변환
          const routeData = csvRowToRoute(row)
          
          // 필수 필드 검증
          if (!routeData.name) {
            throw new Error('노선명이 필요합니다')
          }
          
          if (!routeData.loadingPoint) {
            throw new Error('상차지가 필요합니다')
          }
          
          if (!routeData.unloadingPoint) {
            throw new Error('하차지가 필요합니다')
          }
          
          if (!routeData.driverFare) {
            throw new Error('기사운임이 필요합니다')
          }
          
          if (!routeData.billingFare) {
            throw new Error('청구운임이 필요합니다')
          }
          
          if (!routeData.weekdayPattern || routeData.weekdayPattern.length === 0) {
            throw new Error('운행요일이 필요합니다')
          }

          // 운임 검증
          const driverFare = parseFloat(routeData.driverFare)
          const billingFare = parseFloat(routeData.billingFare)
          
          if (driverFare <= 0) {
            throw new Error('기사운임은 0보다 커야 합니다')
          }
          
          if (billingFare <= 0) {
            throw new Error('청구운임은 0보다 커야 합니다')
          }
          
          if (driverFare > billingFare) {
            throw new Error('기사운임은 청구운임보다 클 수 없습니다')
          }

          // 배치 내 중복 체크
          if (routeNames.has(routeData.name)) {
            results.errors.push({
              row: rowIndex,
              error: `파일 내 중복된 노선명입니다: ${routeData.name}`,
              data: routeData
            })
            results.duplicates++
            results.invalid++
            continue
          }
          
          // DB 중복 체크
          const existingRoute = await prisma.routeTemplate.findFirst({
            where: { name: routeData.name }
          })
          
          if (existingRoute) {
            results.errors.push({
              row: rowIndex,
              error: `이미 등록된 노선명입니다: ${routeData.name}`,
              data: routeData
            })
            results.duplicates++
            results.invalid++
            continue
          }

          // 배정 기사 처리
          let defaultDriverId = null
          if (routeData.assignedDriverPhone) {
            const driver = driverMap.get(routeData.assignedDriverPhone)
            if (!driver) {
              results.errors.push({
                row: rowIndex,
                error: `등록되지 않은 기사 전화번호입니다: ${routeData.assignedDriverPhone}`,
                data: routeData
              })
              results.invalid++
              continue
            }
            defaultDriverId = driver.id
          }

          routeNames.add(routeData.name)
          
          // 요일 포맷팅 (미리보기용)
          const weekdayMap: Record<number, string> = {
            1: '월',
            2: '화',
            3: '수',
            4: '목',
            5: '금',
            6: '토',
            0: '일'
          }
          
          const validRoute = {
            ...routeData,
            defaultDriverId,
            // 미리보기용 정보
            _preview: {
              name: routeData.name,
              loadingPoint: routeData.loadingPoint,
              unloadingPoint: routeData.unloadingPoint,
              driverFare: parseFloat(routeData.driverFare),
              billingFare: parseFloat(routeData.billingFare),
              weekdaysDisplay: routeData.weekdayPattern.map((w: number) => weekdayMap[w]).join(','),
              assignedDriverName: defaultDriverId ? driverMap.get(routeData.assignedDriverPhone!)?.name : null
            }
          }
          
          // assignedDriverPhone 제거 (DB에 저장하지 않음)
          delete validRoute.assignedDriverPhone

          validRoutes.push(validRoute)
          results.validData.push({
            ...validRoute._preview,
            distance: routeData.distance || '',
            remarks: routeData.remarks || '',
            row: rowIndex
          })
          results.valid++
          
        } catch (error) {
          let errorMessage = '데이터 검증 오류'
          
          if (error instanceof Error) {
            errorMessage = error.message
          }
          
          results.errors.push({
            row: rowIndex,
            error: errorMessage,
            data: csvRowToRoute(row)
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
              errors: results.errors.slice(0, 10), // 처음 10개 에러만
              preview: results.validData.slice(0, 5) // 처음 5개 미리보기
            }
          }
        })
      }

      // 커밋 모드 - 실제 저장
      if (validRoutes.length === 0) {
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
      const createdRoutes = await prisma.$transaction(async (tx) => {
        const routes = []
        for (const route of validRoutes) {
          const { _preview, ...routeDataToSave } = route
          const created = await tx.routeTemplate.create({
            data: {
              ...routeDataToSave,
              isActive: true
            },
            include: {
              defaultDriver: {
                select: { name: true }
              }
            }
          })
          routes.push(created)
        }
        return routes
      })
      
      results.imported = createdRoutes.length

      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'RouteTemplate',
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
          message: `${results.imported}개의 노선 템플릿이 성공적으로 등록되었습니다`,
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
      console.error('Failed to import routes:', error)
      
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
          message: '노선 가져오기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'create' }
)

/**
 * GET /api/import/routes - CSV 템플릿 다운로드
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      // CSV 템플릿 생성 (CSV Injection 보호 적용)
      const csvContent = generateCSV(TEMPLATE_HEADERS, [
          {
            '노선명': '서울-부산 정기',
            '상차지': '서울역',
            '하차지': '부산역',
            '거리(km)': '417',
            '기사운임': '150000',
            '청구운임': '180000',
            '운행요일': '월,화,수,목,금',
            '기본배정기사전화번호': '010-1234-5678',
            '비고': '정기 노선'
          },
          {
            '노선명': '인천공항-김포공항',
            '상차지': '인천국제공항',
            '하차지': '김포국제공항',
            '거리(km)': '47',
            '기사운임': '80000',
            '청구운임': '100000',
            '운행요일': '월,수,금',
            '기본배정기사전화번호': '010-9876-5432',
            '비고': '공항 셔틀'
          }
      ])

      // BOM 추가 (Excel에서 한글 인식을 위해)
      const BOM = '\uFEFF'
      const csvWithBOM = BOM + csvContent

      return new Response(csvWithBOM, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="routes_template.csv"'
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
  { resource: 'routes', action: 'read' }
)