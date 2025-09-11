import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { createDriverSchema } from '@/lib/validations/driver'

// 템플릿 헤더 정의
const REQUIRED_HEADERS = ['이름', '전화번호']
const TEMPLATE_HEADERS = ['이름', '전화번호', '이메일', '사업자등록번호', '회사명', '대표자명', '은행명', '계좌번호', '비고']

// CSV 데이터를 Driver 객체로 변환
function csvRowToDriver(row: any) {
  const data: any = {}
  
  // 헤더 매핑
  if (row['이름']) data.name = row['이름'].trim()
  if (row['전화번호']) data.phone = row['전화번호'].trim()
  if (row['이메일']) data.email = row['이메일'].trim() || undefined
  if (row['사업자등록번호']) data.businessNumber = row['사업자등록번호'].trim() || undefined
  if (row['회사명']) data.companyName = row['회사명'].trim() || undefined
  if (row['대표자명']) data.representativeName = row['대표자명'].trim() || undefined
  if (row['은행명']) data.bankName = row['은행명'].trim() || undefined
  if (row['계좌번호']) data.accountNumber = row['계좌번호'].trim() || undefined
  if (row['비고']) data.remarks = row['비고'].trim() || undefined
  
  return data
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

      if (!file.name.toLowerCase().endsWith('.csv')) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'CSV 파일만 업로드 가능합니다'
          }
        }, { status: 400 })
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB 제한
        return NextResponse.json({
          ok: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: '파일 크기는 10MB 이하여야 합니다'
          }
        }, { status: 400 })
      }

      // CSV 내용 읽기 및 파싱
      const csvContent = await file.text()
      
      // Papa.parse를 사용한 CSV 파싱
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      })

      if (parseResult.errors.length > 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'CSV_PARSE_ERROR',
            message: 'CSV 파일을 파싱할 수 없습니다',
            details: parseResult.errors
          }
        }, { status: 400 })
      }

      const rows = parseResult.data as any[]
      
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
      const headers = Object.keys(rows[0])
      const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_HEADERS',
            message: `필수 헤더가 없습니다: ${missingHeaders.join(', ')}`,
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
              errors: results.errors.slice(0, 10), // 처음 10개 에러만
              preview: results.validData.slice(0, 5) // 처음 5개 미리보기
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
            errors: results.errors.slice(0, 10)
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
      // CSV 템플릿 생성
      const csvContent = Papa.unparse({
        fields: TEMPLATE_HEADERS,
        data: [
          {
            '이름': '홍길동',
            '전화번호': '010-1234-5678',
            '이메일': 'hong@example.com',
            '사업자등록번호': '123-45-67890',
            '회사명': '길동운송',
            '대표자명': '홍길동',
            '은행명': '국민은행',
            '계좌번호': '123456-78-901234',
            '비고': '샘플 데이터'
          },
          {
            '이름': '김철수',
            '전화번호': '010-9876-5432',
            '이메일': '',
            '사업자등록번호': '',
            '회사명': '',
            '대표자명': '',
            '은행명': '신한은행',
            '계좌번호': '987-654-321098',
            '비고': ''
          }
        ]
      })

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