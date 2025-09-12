import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { VehicleOwnership } from '@prisma/client'
import { parseImportFile, validateFileSize, validateHeaders, generateCSV } from '@/lib/services/import.service'

// 템플릿 헤더 정의
const REQUIRED_HEADERS = ['차량번호', '차종', '소유구분']
const TEMPLATE_HEADERS = ['차량번호', '차종', '톤수', '소유구분', '배정기사전화번호', '적재량', '연식', '비고']

// 소유구분 매핑
const OWNERSHIP_TYPE_MAP: Record<string, VehicleOwnership> = {
  '고정': 'OWNED',
  '용차': 'CHARTER', 
  '지입': 'CONSIGNED'
}

// CSV 데이터를 Vehicle 객체로 변환
function csvRowToVehicle(row: any) {
  const data: any = {}
  
  // 필수 필드
  if (row['차량번호']) data.plateNumber = row['차량번호'].trim().toUpperCase()
  if (row['차종']) data.vehicleType = row['차종'].trim()
  
  // 소유구분 처리
  if (row['소유구분']) {
    const ownershipKorean = row['소유구분'].trim()
    const ownership = OWNERSHIP_TYPE_MAP[ownershipKorean]
    if (ownership) {
      data.ownership = ownership
    } else {
      throw new Error(`지원하지 않는 소유구분입니다: ${ownershipKorean}. 사용 가능: 고정, 용차, 지입`)
    }
  }
  
  // 선택적 필드
  if (row['톤수']) {
    const tonnage = parseFloat(row['톤수'].toString().replace(/[^\d.-]/g, ''))
    if (!isNaN(tonnage) && tonnage > 0) data.capacity = tonnage
  }
  
  if (row['적재량']) {
    const capacity = parseFloat(row['적재량'].toString().replace(/[^\d.-]/g, ''))
    if (!isNaN(capacity) && capacity > 0) data.capacity = capacity
  }
  
  if (row['연식']) {
    const year = parseInt(row['연식'].toString().replace(/[^\d]/g, ''))
    const currentYear = new Date().getFullYear()
    if (!isNaN(year) && year >= 1980 && year <= currentYear + 1) {
      data.year = year
    }
  }
  
  if (row['배정기사전화번호']) data.assignedDriverPhone = row['배정기사전화번호'].trim()
  if (row['비고']) data.remarks = row['비고'].trim()
  
  return data
}

/**
 * POST /api/import/vehicles - 차량 CSV 일괄 등록
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

      const validVehicles: any[] = []
      const plateNumbers = new Set<string>()

      for (let i = 0; i < rows.length; i++) {
        const rowIndex = i + 2 // CSV에서 실제 행 번호 (헤더 포함)
        const row = rows[i]
        
        try {
          // CSV 행을 Vehicle 객체로 변환
          const vehicleData = csvRowToVehicle(row)
          
          // 필수 필드 검증
          if (!vehicleData.plateNumber) {
            throw new Error('차량번호가 필요합니다')
          }
          
          if (!vehicleData.vehicleType) {
            throw new Error('차종이 필요합니다')
          }
          
          if (!vehicleData.ownership) {
            throw new Error('소유구분이 필요합니다 (고정/용차/지입)')
          }

          // 배치 내 중복 체크
          if (plateNumbers.has(vehicleData.plateNumber)) {
            results.errors.push({
              row: rowIndex,
              error: `파일 내 중복된 차량번호입니다: ${vehicleData.plateNumber}`,
              data: vehicleData
            })
            results.duplicates++
            results.invalid++
            continue
          }
          
          // DB 중복 체크
          const existingVehicle = await prisma.vehicle.findUnique({
            where: { plateNumber: vehicleData.plateNumber }
          })
          
          if (existingVehicle) {
            results.errors.push({
              row: rowIndex,
              error: `이미 등록된 차량번호입니다: ${vehicleData.plateNumber}`,
              data: vehicleData
            })
            results.duplicates++
            results.invalid++
            continue
          }

          // 배정 기사 처리
          let driverId = null
          if (vehicleData.assignedDriverPhone) {
            const driver = driverMap.get(vehicleData.assignedDriverPhone)
            if (!driver) {
              results.errors.push({
                row: rowIndex,
                error: `등록되지 않은 기사 전화번호입니다: ${vehicleData.assignedDriverPhone}`,
                data: vehicleData
              })
              results.invalid++
              continue
            }
            driverId = driver.id
          }

          plateNumbers.add(vehicleData.plateNumber)
          
          const validVehicle = {
            ...vehicleData,
            driverId,
            // 미리보기용 정보
            _preview: {
              plateNumber: vehicleData.plateNumber,
              vehicleType: vehicleData.vehicleType,
              ownership: vehicleData.ownership,
              assignedDriverName: driverId ? driverMap.get(vehicleData.assignedDriverPhone!)?.name : null
            }
          }
          
          // assignedDriverPhone 제거 (DB에 저장하지 않음)
          delete validVehicle.assignedDriverPhone

          validVehicles.push(validVehicle)
          results.validData.push({
            ...validVehicle._preview,
            capacity: vehicleData.capacity || '',
            year: vehicleData.year || '',
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
            data: csvRowToVehicle(row)
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
      if (validVehicles.length === 0) {
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
      const createdVehicles = await prisma.$transaction(async (tx) => {
        const vehicles = []
        for (const vehicle of validVehicles) {
          const { _preview, ...vehicleDataToSave } = vehicle
          const created = await tx.vehicle.create({
            data: {
              ...vehicleDataToSave,
              isActive: true
            },
            include: {
              driver: {
                select: { name: true }
              }
            }
          })
          vehicles.push(created)
        }
        return vehicles
      })
      
      results.imported = createdVehicles.length

      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'Vehicle',
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
          message: `${results.imported}개의 차량이 성공적으로 등록되었습니다`,
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
      console.error('Failed to import vehicles:', error)
      
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
          message: '차량 가져오기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'vehicles', action: 'create' }
)

/**
 * GET /api/import/vehicles - CSV 템플릿 다운로드
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      // CSV 템플릿 생성 (CSV Injection 보호 적용)
      const csvContent = generateCSV(TEMPLATE_HEADERS, [
        {
          '차량번호': '12가3456',
          '차종': '탑차',
          '톤수': '5',
          '소유구분': '고정',
          '배정기사전화번호': '010-1234-5678',
          '적재량': '5000',
          '연식': '2020',
          '비고': '샘플 데이터'
        },
        {
          '차량번호': '78나9012',
          '차종': '냉동차',
          '톤수': '3.5',
          '소유구분': '용차',
          '배정기사전화번호': '010-9876-5432',
          '적재량': '3500',
          '연식': '2019',
          '비고': '냉동 기능 포함'
        }
      ])

      // BOM 추가 (Excel에서 한글 인식을 위해)
      const BOM = '\uFEFF'
      const csvWithBOM = BOM + csvContent

      return new Response(csvWithBOM, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="vehicles_template.csv"'
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
  { resource: 'vehicles', action: 'read' }
)