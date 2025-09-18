import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { normalizeVehicleTypeName } from '@/lib/utils/vehicle-types'

export const runtime = 'nodejs'

// Zod 스키마 정의 - 강화된 검증
const CenterFareBulkSchema = z.object({
  centerName: z.string().min(1, '센터명은 필수입니다').trim(),
  vehicleType: z.string().min(1, '차량톤수는 필수입니다').trim(),
  region: z.string().nullable(), // region은 nullable (경유운임의 경우 null 허용)
  fareType: z.enum(['BASIC', 'STOP_FEE'], {
    errorMap: () => ({ message: '요율종류는 BASIC 또는 STOP_FEE여야 합니다' })
  }),
  baseFare: z.number().nullable().optional(),
  extraStopFee: z.number().nullable().optional(),
  extraRegionFee: z.number().nullable().optional()
}).refine((data) => {
  // 기본운임이면 region이 필수
  if (data.fareType === 'BASIC' && (!data.region || data.region.trim() === '')) {
    return false
  }
  // 경유운임이면 region이 null이어야 함
  if (data.fareType === 'STOP_FEE' && data.region !== null) {
    return false
  }
  return true
}, {
  message: '기본운임은 지역이 필수이고, 경유운임은 지역이 null이어야 합니다',
  path: ['region']
})

const BulkImportRequestSchema = z.object({
  fares: z.array(CenterFareBulkSchema).min(1, '최소 1개 이상의 요율 데이터가 필요합니다')
})

type CenterFareBulkData = z.infer<typeof CenterFareBulkSchema>
type BulkImportResult = {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

/**
 * fareType을 DB enum에 맞게 변환 (현재 BASIC, STOP_FEE만 지원)
 */
function mapFareType(fareType: 'BASIC' | 'STOP_FEE'): 'BASIC' | 'STOP_FEE' {
  return fareType // 현재는 직접 매핑
}

/**
 * POST /api/center-fares/bulk - 센터 요율 대량 등록
 */
export async function POST(req: NextRequest) {
  try {
    // 사용자 인증 확인
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

    // 요청 데이터 파싱 및 검증
    let requestData
    try {
      const rawData = await req.json()
      requestData = BulkImportRequestSchema.parse(rawData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '데이터 검증 실패',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INVALID_DATA',
          message: '잘못된 요청 데이터입니다'
        }
      }, { status: 400 })
    }

    // 결과 초기화
    const result: BulkImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    }

    // Transaction으로 모든 작업 처리
    await prisma.$transaction(async (tx) => {
      for (const [index, fareData] of requestData.fares.entries()) {
        const rowNumber = index + 1
        
        try {
          // 개별 데이터 검증
          const validatedData = CenterFareBulkSchema.parse(fareData)
          const canonicalVehicleType = normalizeVehicleTypeName(validatedData.vehicleType) ?? validatedData.vehicleType
          validatedData.vehicleType = canonicalVehicleType
          
          // fareType 맵핑 (현재는 직접 매핑)
          const mappedFareType = mapFareType(validatedData.fareType)
          
          console.log(`Row ${rowNumber} 처리:`, {
            centerName: validatedData.centerName,
            vehicleType: validatedData.vehicleType,
            region: validatedData.region,
            fareType: mappedFareType
          })

          const loadingPoint = await tx.loadingPoint.findFirst({
            where: {
              centerName: validatedData.centerName
            },
            select: { id: true, centerName: true, loadingPointName: true }
          })

          if (!loadingPoint) {
            result.errors.push(`${rowNumber}행: 센터명을 찾을 수 없습니다 (${validatedData.centerName})`)
            result.skipped++
            continue
          }

          const normalizedRegion = mappedFareType === 'STOP_FEE'
            ? null
            : (validatedData.region ? validatedData.region.trim() : '')

          // 중복 체크 기준: (loadingPointId, vehicleType, region, fareType)
          const existing = await tx.centerFare.findFirst({
            where: {
              loadingPointId: loadingPoint.id,
              vehicleType: validatedData.vehicleType,
              region: normalizedRegion,
              fareType: mappedFareType
            }
          })

          const fareDataToSave = {
            loadingPointId: loadingPoint.id,
            vehicleType: validatedData.vehicleType,
            region: normalizedRegion,
            fareType: mappedFareType,
            baseFare: validatedData.baseFare ?? null,
            extraStopFee: validatedData.extraStopFee ?? null,
            extraRegionFee: validatedData.extraRegionFee ?? null
          }

          let savedFare
          if (existing) {
            // 기존 데이터 업데이트
            savedFare = await tx.centerFare.update({
              where: { id: existing.id },
              data: {
                baseFare: fareDataToSave.baseFare,
                extraStopFee: fareDataToSave.extraStopFee,
                extraRegionFee: fareDataToSave.extraRegionFee,
                updatedAt: new Date()
              }
            })
            result.updated++
            
            // 감사 로그 - 업데이트
            await createAuditLog(
              user,
              'UPDATE',
              'CENTER_FARE',
              savedFare.id,
              {
                centerName: validatedData.centerName,
                vehicleType: validatedData.vehicleType,
                region: normalizedRegion,
                fareType: mappedFareType,
                changes: {
                  baseFare: validatedData.baseFare,
                  extraStopFee: validatedData.extraStopFee,
                  extraRegionFee: validatedData.extraRegionFee
                }
              }
            )
          } else {
            // 새 데이터 생성
            savedFare = await tx.centerFare.create({
              data: fareDataToSave
            })
            result.created++
            
            // 감사 로그 - 생성
            await createAuditLog(
              user,
              'CREATE',
              'CENTER_FARE',
              savedFare.id,
              {
                centerName: validatedData.centerName,
                vehicleType: validatedData.vehicleType,
                region: normalizedRegion,
                fareType: mappedFareType
              }
            )
          }

        } catch (error) {
          result.skipped++
          
          if (error instanceof z.ZodError) {
            // Zod 검증 에러
            const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
            result.errors.push(`${rowNumber}행: ${errorMessages.join(', ')}`)
          } else if (error instanceof Error) {
            // 기타 에러
            result.errors.push(`${rowNumber}행: ${error.message}`)
          } else {
            // 알 수 없는 에러
            result.errors.push(`${rowNumber}행: 알 수 없는 오류가 발생했습니다`)
          }
          
          console.error(`Row ${rowNumber} 처리 실패:`, error)
        }
      }
    })

    // 대량 가져오기 감사 로그
    await createAuditLog(
      user,
      'IMPORT',
      'CENTER_FARE',
      'bulk-import',
      {
        summary: {
          total: requestData.fares.length,
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          errors: result.errors.length
        }
      }
    )

    console.log('Bulk import 완료:', result)

    return NextResponse.json({
      ok: true,
      data: result
    })

  } catch (error) {
    console.error('센터 요율 대량 등록 실패:', error)
    return NextResponse.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '서버 오류가 발생했습니다'
      }
    }, { status: 500 })
  }
}