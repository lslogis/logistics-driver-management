import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { createDriverSchema } from '@/lib/validations/driver'
import { parseImportFile, validateFileSize, validateHeaders, generateCSV } from '@/lib/services/import.service'
import { sanitizeDriverImportData, validateRequiredFields } from '@/lib/utils/data-processing'

// 템플릿 헤더 정의 (9-column structure)
const REQUIRED_HEADERS = ['성함', '연락처', '차량번호']
const TEMPLATE_HEADERS = ['성함', '연락처', '차량번호', '사업상호', '대표자', '사업번호', '계좌은행', '계좌번호', '특이사항']

// CSV 데이터를 Driver 객체로 변환 (9-column structure)
function csvRowToDriver(row: any) {
  // 유연한 헤더 매핑을 사용하여 표준 헤더로 변환
  const { mapRowHeaders } = require('@/lib/services/import.service')
  const mappedRow = mapRowHeaders(row)
  
  const rawData: any = {}
  
  // 헤더 매핑 (유연한 매칭 후 표준 헤더 사용)
  if (mappedRow['성함']) rawData.name = String(mappedRow['성함']).trim()
  if (mappedRow['연락처']) rawData.phone = String(mappedRow['연락처']).trim()  
  if (mappedRow['차량번호']) rawData.vehicleNumber = String(mappedRow['차량번호']).trim()
  if (mappedRow['사업상호']) rawData.businessName = String(mappedRow['사업상호']).trim() || undefined
  if (mappedRow['대표자']) rawData.representative = String(mappedRow['대표자']).trim() || undefined
  if (mappedRow['사업번호']) rawData.businessNumber = String(mappedRow['사업번호']).trim() || undefined
  if (mappedRow['계좌은행']) rawData.bankName = String(mappedRow['계좌은행']).trim() || undefined
  if (mappedRow['계좌번호']) rawData.accountNumber = String(mappedRow['계좌번호']).trim() || undefined
  if (mappedRow['특이사항']) rawData.remarks = String(mappedRow['특이사항']).trim() || undefined
  
  // 데이터 정제 (연락처, 계좌번호 특수문자 제거)
  const sanitizedData = sanitizeDriverImportData(rawData)
  
  return sanitizedData
}

/**
 * POST /api/import/drivers - 기사 CSV 일괄 등록
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

      const validDrivers: any[] = []
      const phoneNumbers = new Set<string>()

      for (let i = 0; i < rows.length; i++) {
        const rowIndex = i + 2 // CSV에서 실제 행 번호 (헤더 포함)
        const row = rows[i]
        
        try {
          // CSV 행을 Driver 객체로 변환
          const driverData = csvRowToDriver(row)
          
          // Zod 스키마로 검증
          const validatedDriver = createDriverSchema.parse(driverData)
          
          // 배치 내 중복 체크
          if (phoneNumbers.has(validatedDriver.phone)) {
            results.errors.push({
              row: rowIndex,
              error: `파일 내 중복된 전화번호입니다: ${validatedDriver.phone}`,
              data: driverData
            })
            results.duplicates++
            results.invalid++
            continue
          }
          
          // DB 중복 체크 (이름+전화번호 기준)
          const existingDriver = await prisma.driver.findFirst({
            where: {
              OR: [
                { phone: validatedDriver.phone },
                {
                  AND: [
                    { name: validatedDriver.name },
                    { phone: validatedDriver.phone }
                  ]
                }
              ]
            },
            select: {
              id: true,
              name: true,
              phone: true
            }
          })
          
          if (existingDriver) {
            results.errors.push({
              row: rowIndex,
              error: `이미 등록된 기사입니다: ${validatedDriver.name} (${validatedDriver.phone})`,
              data: driverData
            })
            results.duplicates++
            results.invalid++
            continue
          }

          phoneNumbers.add(validatedDriver.phone)
          validDrivers.push(validatedDriver)
          results.validData.push({
            ...validatedDriver,
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
            data: csvRowToDriver(row)
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
      if (validDrivers.length === 0) {
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
      const createdDrivers = await prisma.$transaction(async (tx) => {
        const drivers = []
        for (const driver of validDrivers) {
          const created = await tx.driver.create({
            data: {
              ...driver,
              isActive: true
            }
          })
          drivers.push(created)
        }
        return drivers
      })
      
      results.imported = createdDrivers.length

      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'Driver',
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
          message: `${results.imported}개의 기사가 성공적으로 등록되었습니다`,
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
      console.error('Failed to import drivers:', error)
      
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
          message: '기사 가져오기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'drivers', action: 'create' }
)

/**
 * GET /api/import/drivers/template - CSV 템플릿 다운로드
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      // CSV 템플릿 생성 (9-column structure, CSV Injection 보호 적용)
      const csvContent = generateCSV(TEMPLATE_HEADERS, [
        {
          '성함': '홍길동',
          '연락처': '010-1234-5678',
          '차량번호': '12가3456',
          '사업상호': '길동운송',
          '대표자': '홍길동',
          '사업번호': '123-45-67890',
          '계좌은행': '국민은행',
          '계좌번호': '123456-78-901234',
          '특이사항': '샘플 데이터'
        },
        {
          '성함': '김철수',
          '연락처': '010-9876-5432',
          '차량번호': '34나5678',
          '사업상호': '',
          '대표자': '',
          '사업번호': '',
          '계좌은행': '신한은행',
          '계좌번호': '987-654-321098',
          '특이사항': ''
        }
      ])

      // BOM 추가 (Excel에서 한글 인식을 위해)
      const BOM = '\uFEFF'
      const csvWithBOM = BOM + csvContent

      return new Response(csvWithBOM, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="drivers_template.csv"'
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
  { resource: 'drivers', action: 'read' }
)