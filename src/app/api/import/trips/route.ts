import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { z } from 'zod'
import { TripStatus } from '@prisma/client'

// CSV Import 검증 스키마
const importTripsSchema = z.object({
  validateOnly: z
    .string()
    .optional()
    .transform(val => val === 'true')
})

// CSV 파싱 함수 (drivers와 동일)
function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.trim().split('\n')
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  })
}

// CSV 데이터를 Trip 객체로 변환
function csvRowToTrip(row: string[], headers: string[]) {
  const data: any = {}
  
  headers.forEach((header, index) => {
    const value = row[index]?.trim() || ''
    
    switch (header.toLowerCase()) {
      case 'date':
      case '날짜':
      case '운행일':
        if (value) {
          // 날짜 형식 통일 (YYYY-MM-DD)
          const date = new Date(value)
          if (!isNaN(date.getTime())) {
            data.date = date.toISOString()
          }
        }
        break
      case 'driverphone':
      case '기사전화번호':
      case 'driver_phone':
        data.driverPhone = value
        break
      case 'vehicleplate':
      case 'vehicleplatenumber':
      case '차량번호':
      case 'plate_number':
        data.vehiclePlate = value
        break
      case 'routename':
      case '노선명':
      case 'route_name':
        data.routeName = value
        break
      case 'loadingpoint':
      case '상차지':
      case 'loading_point':
        data.loadingPoint = value
        break
      case 'unloadingpoint':
      case '하차지':
      case 'unloading_point':
        data.unloadingPoint = value
        break
      case 'driverfare':
      case '기사요금':
      case 'driver_fare':
        if (value && !isNaN(Number(value))) {
          data.driverFare = Number(value)
        }
        break
      case 'billingfare':
      case '청구요금':
      case 'billing_fare':
        if (value && !isNaN(Number(value))) {
          data.billingFare = Number(value)
        }
        break
      case 'status':
      case '상태':
        const statusMap: Record<string, TripStatus> = {
          '예정': 'SCHEDULED',
          '완료': 'COMPLETED',
          '결행': 'ABSENCE',
          '대차': 'SUBSTITUTE',
          'scheduled': 'SCHEDULED',
          'completed': 'COMPLETED',
          'absence': 'ABSENCE',
          'substitute': 'SUBSTITUTE'
        }
        data.status = statusMap[value.toLowerCase()] || 'SCHEDULED'
        break
      case 'deductionamount':
      case '차감액':
      case 'deduction_amount':
        if (value && !isNaN(Number(value))) {
          data.deductionAmount = Number(value)
        }
        break
      case 'absencereason':
      case '결행사유':
      case 'absence_reason':
        data.absenceReason = value || undefined
        break
      case 'substitutedriverphone':
      case '대차기사전화번호':
      case 'substitute_driver_phone':
        data.substituteDriverPhone = value || undefined
        break
      case 'substitutefare':
      case '대차요금':
      case 'substitute_fare':
        if (value && !isNaN(Number(value))) {
          data.substituteFare = Number(value)
        }
        break
      case 'remarks':
      case '비고':
        data.remarks = value || undefined
        break
    }
  })
  
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
        return apiResponse.unauthorized()
      }

      // FormData 파싱
      const formData = await req.formData()
      const file = formData.get('file') as File
      const validateOnlyParam = formData.get('validateOnly') as string
      
      const { validateOnly } = importTripsSchema.parse({ 
        validateOnly: validateOnlyParam 
      })

      if (!file) {
        return apiResponse.error('CSV 파일을 선택해주세요')
      }

      if (!file.name.toLowerCase().endsWith('.csv')) {
        return apiResponse.error('CSV 파일만 업로드 가능합니다')
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB 제한
        return apiResponse.error('파일 크기는 10MB 이하여야 합니다')
      }

      // CSV 내용 읽기
      const csvContent = await file.text()
      const rows = parseCSV(csvContent)

      if (rows.length === 0) {
        return apiResponse.error('CSV 파일이 비어있습니다')
      }

      // 헤더 행 처리
      const headers = rows[0].map(h => h.toLowerCase().trim())
      const dataRows = rows.slice(1)

      if (dataRows.length === 0) {
        return apiResponse.error('데이터가 없습니다. 헤더 행만 있습니다')
      }

      // 필수 컬럼 확인
      const requiredHeaders = {
        date: ['date', '날짜', '운행일'],
        driverPhone: ['driverphone', '기사전화번호', 'driver_phone'],
        vehiclePlate: ['vehicleplate', 'vehicleplatenumber', '차량번호', 'plate_number'],
        driverFare: ['driverfare', '기사요금', 'driver_fare'],
        billingFare: ['billingfare', '청구요금', 'billing_fare']
      }

      const missingFields: string[] = []
      Object.entries(requiredHeaders).forEach(([field, possibleHeaders]) => {
        const hasField = possibleHeaders.some(h => headers.includes(h))
        if (!hasField) {
          missingFields.push(`${field} (${possibleHeaders.join(' 또는 ')})`)
        }
      })

      if (missingFields.length > 0) {
        return apiResponse.error(`필수 컬럼이 없습니다: ${missingFields.join(', ')}`)
      }

      // 참조 데이터 미리 로드 (성능 최적화)
      const drivers = await prisma.driver.findMany({
        select: { id: true, phone: true, name: true }
      })
      const vehicles = await prisma.vehicle.findMany({
        select: { id: true, plateNumber: true, vehicleType: true }
      })
      const routes = await prisma.routeTemplate.findMany({
        select: { id: true, name: true }
      })

      // 룩업 맵 생성
      const driverMap = new Map(drivers.map(d => [d.phone, d]))
      const vehicleMap = new Map(vehicles.map(v => [v.plateNumber, v]))
      const routeMap = new Map(routes.map(r => [r.name, r]))

      // 데이터 검증 및 변환
      const results = {
        total: dataRows.length,
        valid: 0,
        invalid: 0,
        imported: 0,
        errors: [] as Array<{ row: number; error: string; data?: any }>
      }

      const validTrips: any[] = []

      for (let i = 0; i < dataRows.length; i++) {
        const rowIndex = i + 2 // CSV에서 실제 행 번호
        const row = dataRows[i]
        
        try {
          // CSV 행을 Trip 객체로 변환
          const tripData = csvRowToTrip(row, headers)
          
          // 필수 필드 검증
          if (!tripData.date) {
            throw new Error('날짜가 필요합니다')
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

          // 노선 찾기 (선택사항)
          let routeTemplateId = null
          let customRoute = null

          if (tripData.routeName) {
            const route = routeMap.get(tripData.routeName)
            if (route) {
              routeTemplateId = route.id
            } else {
              // 커스텀 노선으로 처리
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
            // 커스텀 노선
            customRoute = {
              loadingPoint: tripData.loadingPoint,
              unloadingPoint: tripData.unloadingPoint
            }
          } else {
            throw new Error('노선명 또는 상차지/하차지 정보가 필요합니다')
          }

          // 대차 기사 찾기 (SUBSTITUTE 상태인 경우)
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

          // 중복 확인 (같은 날짜, 기사, 차량)
          const tripDate = new Date(tripData.date).toISOString().split('T')[0]
          const existingTrip = await prisma.trip.findFirst({
            where: {
              date: new Date(tripDate),
              driverId: driver.id,
              vehicleId: vehicle.id
            }
          })

          if (existingTrip) {
            throw new Error(`중복된 운행입니다 (${tripDate}, ${driver.name}, ${vehicle.plateNumber})`)
          }

          // 배치 내 중복 확인
          const duplicateInBatch = validTrips.find(t => 
            t.date === tripDate && 
            t.driverId === driver.id && 
            t.vehicleId === vehicle.id
          )
          if (duplicateInBatch) {
            throw new Error(`배치 내 중복된 운행입니다 (${tripDate}, ${driver.name}, ${vehicle.plateNumber})`)
          }

          // 유효한 Trip 객체 생성
          const validTrip = {
            date: new Date(tripDate),
            driverId: driver.id,
            vehicleId: vehicle.id,
            routeTemplateId,
            customRoute,
            status: tripData.status,
            driverFare: tripData.driverFare,
            billingFare: tripData.billingFare,
            deductionAmount: tripData.deductionAmount || null,
            substituteDriverId,
            substituteFare: tripData.substituteFare || null,
            absenceReason: tripData.absenceReason || null,
            remarks: tripData.remarks || null,
            // 미리보기용 추가 정보
            _preview: {
              driverName: driver.name,
              driverPhone: driver.phone,
              vehiclePlate: vehicle.plateNumber,
              vehicleType: vehicle.vehicleType,
              routeName: tripData.routeName,
              originalData: tripData
            }
          }

          validTrips.push(validTrip)
          results.valid++
          
        } catch (error) {
          let errorMessage = '데이터 검증 오류'
          
          if (error instanceof Error) {
            errorMessage = error.message
          }
          
          results.errors.push({
            row: rowIndex,
            error: errorMessage,
            data: csvRowToTrip(row, headers)
          })
          results.invalid++
        }
      }

      // 검증만 수행하는 경우
      if (validateOnly) {
        return apiResponse.success({
          message: '검증이 완료되었습니다',
          results: {
            ...results,
            preview: validTrips.slice(0, 5).map(trip => ({
              date: trip.date.toISOString().split('T')[0],
              driver: trip._preview.driverName,
              driverPhone: trip._preview.driverPhone,
              vehicle: `${trip._preview.vehiclePlate} (${trip._preview.vehicleType})`,
              route: trip._preview.routeName || '커스텀',
              status: trip.status,
              driverFare: trip.driverFare,
              billingFare: trip.billingFare
            }))
          }
        })
      }

      // 실제 가져오기 수행
      if (validTrips.length === 0) {
        return apiResponse.error('가져올 수 있는 유효한 데이터가 없습니다', 400)
      }

      // 트랜잭션으로 일괄 삽입
      await prisma.$transaction(async (tx) => {
        for (const trip of validTrips) {
          // _preview 제거하고 실제 데이터만 저장
          const { _preview, ...tripDataToSave } = trip
          await tx.trip.create({
            data: tripDataToSave
          })
          results.imported++
        }
      })

      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'Trip',
        null,
        {
          action: 'csv_import',
          fileName: file.name,
          fileSize: file.size,
          results
        },
        { 
          source: 'csv_import',
          importStats: results
        }
      )

      return apiResponse.success({
        message: `${results.imported}개의 운행이 성공적으로 등록되었습니다`,
        results
      })

    } catch (error) {
      console.error('Failed to import trips:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('운행 가져오기 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'trips', action: 'create' }
)