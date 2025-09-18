import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import * as XLSX from 'xlsx'
import { Prisma } from '@prisma/client'
import { normalizeVehicleTypeName } from '@/lib/utils/vehicle-types'

const parseAmount = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const cleaned = value.replace(/[\s,]/g, '')
    if (!cleaned) return null
    const parsed = Number.parseInt(cleaned, 10)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

export const runtime = 'nodejs'

/**
 * POST /api/center-fares/import - Excel 파일 가져오기
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

      const formData = await req.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NO_FILE',
            message: '파일이 없습니다'
          }
        }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)

      const results = []
      const errors = []
      
      for (const [index, row] of rows.entries()) {
        try {
          // 센터 조회
          const loadingPointIdentifierRaw = (row['상차지ID'] as string) || (row['센터ID'] as string)
          const loadingPointIdentifier = typeof loadingPointIdentifierRaw === 'string' ? loadingPointIdentifierRaw.trim() : ''
          let loadingPoint = null

          if (loadingPointIdentifier) {
            loadingPoint = await prisma.loadingPoint.findUnique({
              where: { id: loadingPointIdentifier }
            })
          }

          const centerNameRaw = row['센터명'] as string | undefined
          const centerName = typeof centerNameRaw === 'string' ? centerNameRaw.trim() : ''
          const loadingPointNameRaw = row['상차지명'] as string | undefined
          const loadingPointName = typeof loadingPointNameRaw === 'string' ? loadingPointNameRaw.trim() : ''

          if (!loadingPoint) {
            const orConditions: Prisma.LoadingPointWhereInput[] = []
            if (centerName) orConditions.push({ centerName })
            if (loadingPointName) orConditions.push({ loadingPointName })

            if (orConditions.length > 0) {
              loadingPoint = await prisma.loadingPoint.findFirst({
                where: {
                  OR: orConditions,
                }
              })
            }
          }

          if (!loadingPoint) {
            errors.push(`행 ${index + 2}: 상차지를 찾을 수 없습니다`)
            continue
          }

          const fareTypeRaw = row['요율종류'] as string | undefined
          const fareTypeKorean = typeof fareTypeRaw === 'string' ? fareTypeRaw.trim() : ''
          const fareType = fareTypeKorean === '기본운임' ? 'BASIC' : 'STOP_FEE'
          const regionRaw = row['지역'] as string | undefined
          const region = typeof regionRaw === 'string' ? regionRaw.trim() : ''
          
          // 요율 종류에 따른 검증
          const baseFareAmount = parseAmount(row['기본운임'])
          const extraStopFeeAmount = parseAmount(row['경유운임'])
          const extraRegionFeeAmount = parseAmount(row['지역운임'])
          const vehicleTypeRaw = row['차량톤수'] as string | undefined
          const vehicleType = typeof vehicleTypeRaw === 'string' ? vehicleTypeRaw.trim() : ''

          const normalizedVehicleType = normalizeVehicleTypeName(vehicleType)
          if (!normalizedVehicleType) {
            errors.push(`행 ${index + 2}: 지원하지 않는 차량톤수입니다 (입력값: ${vehicleType})`)
            continue
          }

          if (fareType === 'BASIC') {
            if (!region) {
              errors.push(`행 ${index + 2}: 기본운임에는 지역이 필수입니다`)
              continue
            }
            if (baseFareAmount === null) {
              errors.push(`행 ${index + 2}: 기본운임 금액이 필요합니다`)
              continue
            }
          } else {
            if (extraStopFeeAmount === null || extraRegionFeeAmount === null) {
              errors.push(`행 ${index + 2}: 경유운임에는 경유운임과 지역운임이 필수입니다`)
              continue
            }
          }

          if (!vehicleType) {
            errors.push(`행 ${index + 2}: 차량톤수가 필요합니다`)
            continue
          }

          const data = {
            loadingPointId: loadingPoint.id,
            vehicleType: normalizedVehicleType,
            region: fareType === 'STOP_FEE' ? null : region,
            fareType,
            baseFare: fareType === 'BASIC' ? baseFareAmount : null,
            extraStopFee: fareType === 'STOP_FEE' ? extraStopFeeAmount : null,
            extraRegionFee: fareType === 'STOP_FEE' ? extraRegionFeeAmount : null,
          }

          // Upsert (중복 시 업데이트)
          const fare = await prisma.centerFare.upsert({
            where: {
              unique_loadingPoint_vehicle_region: {
                loadingPointId: data.loadingPointId,
                vehicleType: data.vehicleType,
                region: data.region,
              }
            },
            update: data,
            create: data
          })

          results.push(fare)
        } catch (error) {
          errors.push(`행 ${index + 2}: ${error.message}`)
        }
      }

      // 감사 로그
      await createAuditLog(
        user,
        'IMPORT',
        'CenterFare',
        null,
        { imported: results.length, errors: errors.length },
        { source: 'web_api' }
      )

      return NextResponse.json({
        ok: true,
        data: {
          imported: results.length,
          errors
        }
      })
    } catch (error) {
      console.error('Failed to import center fares:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '가져오기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'charters', action: 'create' }
)
