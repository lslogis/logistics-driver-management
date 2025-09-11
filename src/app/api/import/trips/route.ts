import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { TripStatus } from '@prisma/client'

// 템플릿 헤더 정의
const REQUIRED_HEADERS = ['날짜', '기사전화번호', '차량번호', '기사요금', '청구요금']
const TEMPLATE_HEADERS = ['날짜', '기사전화번호', '차량번호', '노선명', '상차지', '하차지', '기사요금', '청구요금', '상태', '차감액', '결행사유', '대차기사전화번호', '대차요금', '비고']

// CSV 데이터를 Trip 객체로 변환
function csvRowToTrip(row: any) {
  const data: any = {}
  
  // 날짜 처리
  if (row['날짜']) {
    const date = new Date(row['날짜'].trim())
    if (!isNaN(date.getTime())) {
      data.date = date.toISOString().split('T')[0] // YYYY-MM-DD 형식
    }
  }
  
  // 기본 필드
  if (row['기사전화번호']) data.driverPhone = row['기사전화번호'].trim()
  if (row['차량번호']) data.vehiclePlate = row['차량번호'].trim()
  if (row['노선명']) data.routeName = row['노선명'].trim()
  if (row['상차지']) data.loadingPoint = row['상차지'].trim()
  if (row['하차지']) data.unloadingPoint = row['하차지'].trim()
  
  // 숫자 필드
  if (row['기사요금']) {
    const fare = parseFloat(row['기사요금'].toString().replace(/[^\d.-]/g, ''))
    if (!isNaN(fare) && fare > 0) data.driverFare = fare
  }
  if (row['청구요금']) {
    const fare = parseFloat(row['청구요금'].toString().replace(/[^\d.-]/g, ''))
    if (!isNaN(fare) && fare > 0) data.billingFare = fare
  }
  if (row['차감액']) {
    const amount = parseFloat(row['차감액'].toString().replace(/[^\d.-]/g, ''))
    if (!isNaN(amount) && amount > 0) data.deductionAmount = amount
  }
  if (row['대차요금']) {
    const fare = parseFloat(row['대차요금'].toString().replace(/[^\d.-]/g, ''))
    if (!isNaN(fare) && fare > 0) data.substituteFare = fare
  }
  
  // 상태 매핑
  if (row['상태']) {
    const statusMap: Record<string, TripStatus> = {
      '예정': 'SCHEDULED',
      '완료': 'COMPLETED',
      '결행': 'ABSENCE',
      '대차': 'SUBSTITUTE'
    }
    const statusKey = row['상태'].trim()
    data.status = statusMap[statusKey] || 'SCHEDULED'
  }
  
  // 선택적 필드
  if (row['결행사유']) data.absenceReason = row['결행사유'].trim()
  if (row['대차기사전화번호']) data.substituteDriverPhone = row['대차기사전화번호'].trim()
  if (row['비고']) data.remarks = row['비고'].trim()
  
  return data
}

/**
 * POST /api/import/trips - 운행 CSV 일괄 등록
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

      if (file.size > 50 * 1024 * 1024) { // 50MB 제한 (trips는 대용량 가능)
        return NextResponse.json({
          ok: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: '파일 크기는 50MB 이하여야 합니다'
          }
        }, { status: 400 })
      }

      // CSV 내용 읽기 및 파싱
      const csvContent = await file.text()
      
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

      // 참조 데이터 미리 로드 (성능 최적화)
      const [drivers, vehicles, routes] = await Promise.all([
        prisma.driver.findMany({
          where: { isActive: true },
          select: { id: true, phone: true, name: true }
        }),
        prisma.vehicle.findMany({
          where: { isActive: true },
          select: { id: true, plateNumber: true, vehicleType: true }
        }),
        prisma.routeTemplate.findMany({
          where: { isActive: true },
          select: { id: true, name: true }
        })
      ])

      // 룩업 맵 생성
      const driverMap = new Map(drivers.map(d => [d.phone, d]))
      const vehicleMap = new Map(vehicles.map(v => [v.plateNumber, v]))
      const routeMap = new Map(routes.map(r => [r.name, r]))

      // 데이터 검증 및 변환
      const results = {
        total: rows.length,
        valid: 0,
        invalid: 0,
        duplicates: 0,
        conflicts: 0,
        imported: 0,
        errors: [] as Array<{ row: number; error: string; data?: any }>,
        validData: [] as any[]
      }

      const validTrips: any[] = []
      const uniqueKeys = new Set<string>() // 배치 내 중복 체크용

      for (let i = 0; i < rows.length; i++) {
        const rowIndex = i + 2 // CSV에서 실제 행 번호
        const row = rows[i]
        
        try {
          // CSV 행을 Trip 객체로 변환
          const tripData = csvRowToTrip(row)
          
          // 필수 필드 검증
          if (!tripData.date) {
            throw new Error('날짜가 올바르지 않습니다')
          }
          
          if (!tripData.driverPhone) {
            throw new Error('기사 전화번호가 필요합니다')
          }
          
          if (!tripData.vehiclePlate) {
            throw new Error('차량번호가 필요합니다')
          }

          if (!tripData.driverFare || tripData.driverFare <= 0) {
            throw new Error('기사요금이 필요합니다 (양수)')
          }

          if (!tripData.billingFare || tripData.billingFare <= 0) {
            throw new Error('청구요금이 필요합니다 (양수)')
          }

          // 기사 찾기
          const driver = driverMap.get(tripData.driverPhone)
          if (!driver) {
            throw new Error(`등록되지 않은 기사입니다: ${tripData.driverPhone}`)
          }

          // 차량 찾기
          const vehicle = vehicleMap.get(tripData.vehiclePlate)
          if (!vehicle) {
            throw new Error(`등록되지 않은 차량입니다: ${tripData.vehiclePlate}`)
          }

          // 노선 처리 (선택사항)
          let routeTemplateId = null
          let customRoute = null

          if (tripData.routeName) {
            const route = routeMap.get(tripData.routeName)
            if (route) {
              routeTemplateId = route.id
            } else {
              // 커스텀 노선 처리
              if (tripData.loadingPoint && tripData.unloadingPoint) {
                customRoute = {
                  loadingPoint: tripData.loadingPoint,
                  unloadingPoint: tripData.unloadingPoint
                }
              } else {
                throw new Error(`노선 '${tripData.routeName}'을 찾을 수 없고, 상차지/하차지 정보도 없습니다`)
              }
            }
          } else if (tripData.loadingPoint && tripData.unloadingPoint) {
            customRoute = {
              loadingPoint: tripData.loadingPoint,
              unloadingPoint: tripData.unloadingPoint
            }
          } else {
            throw new Error('노선명 또는 상차지/하차지 정보가 필요합니다')
          }

          // 대차 기사 처리
          let substituteDriverId = null
          if (tripData.status === 'SUBSTITUTE') {
            if (!tripData.substituteDriverPhone) {
              throw new Error('대차 상태인 경우 대차 기사 전화번호가 필요합니다')
            }
            if (!tripData.substituteFare || tripData.substituteFare <= 0) {
              throw new Error('대차 상태인 경우 대차 요금이 필요합니다')
            }
            
            const substituteDriver = driverMap.get(tripData.substituteDriverPhone)
            if (!substituteDriver) {
              throw new Error(`등록되지 않은 대차 기사입니다: ${tripData.substituteDriverPhone}`)
            }
            if (substituteDriver.id === driver.id) {
              throw new Error('대차 기사는 원래 기사와 달라야 합니다')
            }
            substituteDriverId = substituteDriver.id
          }

          // 유니크 키 생성 (날짜 + 기사 + 차량)
          const uniqueKey = `${tripData.date}-${driver.id}-${vehicle.id}`
          
          // 배치 내 중복 체크
          if (uniqueKeys.has(uniqueKey)) {
            results.errors.push({
              row: rowIndex,
              error: `파일 내 중복된 운행입니다: ${tripData.date} ${driver.name} ${vehicle.plateNumber}`,
              data: tripData
            })
            results.duplicates++
            results.invalid++
            continue
          }
          
          // DB 중복 체크 (unique constraint 검증)
          const existingTrip = await prisma.trip.findFirst({
            where: {
              date: new Date(tripData.date + 'T00:00:00Z'),
              driverId: driver.id,
              vehicleId: vehicle.id
            }
          })

          if (existingTrip) {
            results.errors.push({
              row: rowIndex,
              error: `이미 등록된 운행입니다: ${tripData.date} ${driver.name} ${vehicle.plateNumber}`,
              data: tripData
            })
            results.conflicts++
            results.invalid++
            continue
          }

          uniqueKeys.add(uniqueKey)

          // 유효한 Trip 객체 생성
          const validTrip = {
            date: new Date(tripData.date + 'T00:00:00Z'),
            driverId: driver.id,
            vehicleId: vehicle.id,
            routeTemplateId,
            customRoute,
            status: tripData.status || 'SCHEDULED',
            driverFare: tripData.driverFare.toString(),
            billingFare: tripData.billingFare.toString(),
            deductionAmount: tripData.deductionAmount ? tripData.deductionAmount.toString() : null,
            substituteDriverId,
            substituteFare: tripData.substituteFare ? tripData.substituteFare.toString() : null,
            absenceReason: tripData.absenceReason || null,
            remarks: tripData.remarks || null,
            // 미리보기용 정보
            _preview: {
              driverName: driver.name,
              driverPhone: driver.phone,
              vehiclePlate: vehicle.plateNumber,
              vehicleType: vehicle.vehicleType,
              routeName: tripData.routeName || '커스텀',
              status: tripData.status || 'SCHEDULED'
            }
          }

          validTrips.push(validTrip)
          results.validData.push({
            ...validTrip._preview,
            date: tripData.date,
            driverFare: tripData.driverFare,
            billingFare: tripData.billingFare,
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
            data: csvRowToTrip(row)
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
              conflicts: results.conflicts,
              errors: results.errors.slice(0, 20), // 처음 20개 에러만
              preview: results.validData.slice(0, 10) // 처음 10개 미리보기
            }
          }
        })
      }

      // 커밋 모드 - 실제 저장
      if (validTrips.length === 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NO_VALID_DATA',
            message: '가져올 수 있는 유효한 데이터가 없습니다',
            details: results
          }
        }, { status: 400 })
      }

      // 트랜잭션으로 일괄 삽입 (부분 성공은 후순위)
      try {
        const createdTrips = await prisma.$transaction(async (tx) => {
          const trips = []
          for (const trip of validTrips) {
            const { _preview, ...tripDataToSave } = trip
            const created = await tx.trip.create({
              data: tripDataToSave,
              include: {
                driver: { select: { name: true } },
                vehicle: { select: { plateNumber: true } }
              }
            })
            trips.push(created)
          }
          return trips
        })
        
        results.imported = createdTrips.length
      } catch (error) {
        console.error('Transaction failed:', error)
        
        // 유니크 제약 조건 위반이 발생한 경우
        if (error instanceof Error && error.message.includes('unique')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'UNIQUE_CONSTRAINT_VIOLATION',
              message: '중복된 운행 데이터가 감지되어 전체 가져오기가 실패했습니다',
              details: {
                total: results.total,
                validated: results.valid,
                conflicts: results.conflicts,
                duplicates: results.duplicates
              }
            }
          }, { status: 409 })
        }
        
        throw error
      }

      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'Trip',
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
            conflicts: results.conflicts,
            imported: results.imported
          }
        }
      )

      return NextResponse.json({
        ok: true,
        data: {
          message: `${results.imported}개의 운행이 성공적으로 등록되었습니다`,
          mode: 'commit',
          results: {
            total: results.total,
            valid: results.valid,
            invalid: results.invalid,
            duplicates: results.duplicates,
            conflicts: results.conflicts,
            imported: results.imported,
            errors: results.errors.slice(0, 20)
          }
        }
      })

    } catch (error) {
      console.error('Failed to import trips:', error)
      
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
          message: '운행 가져오기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'trips', action: 'create' }
)

/**
 * GET /api/import/trips/template - CSV 템플릿 다운로드
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      // CSV 템플릿 생성
      const csvContent = Papa.unparse({
        fields: TEMPLATE_HEADERS,
        data: [
          {
            '날짜': '2025-01-15',
            '기사전화번호': '010-1234-5678',
            '차량번호': '12가1234',
            '노선명': '서울-부산 정기',
            '상차지': '서울역',
            '하차지': '부산역',
            '기사요금': 150000,
            '청구요금': 180000,
            '상태': '예정',
            '차감액': '',
            '결행사유': '',
            '대차기사전화번호': '',
            '대차요금': '',
            '비고': '샘플 데이터'
          },
          {
            '날짜': '2025-01-16',
            '기사전화번호': '010-9876-5432',
            '차량번호': '34나5678',
            '노선명': '',
            '상차지': '인천공항',
            '하차지': '김포공항',
            '기사요금': 80000,
            '청구요금': 100000,
            '상태': '완료',
            '차감액': '',
            '결행사유': '',
            '대차기사전화번호': '',
            '대차요금': '',
            '비고': '커스텀 노선 예시'
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
          'Content-Disposition': 'attachment; filename="trips_template.csv"'
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
  { resource: 'trips', action: 'read' }
)