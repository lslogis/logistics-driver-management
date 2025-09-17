import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import * as XLSX from 'xlsx'

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
          const center = await prisma.loadingPoint.findFirst({
            where: { 
              OR: [
                { centerName: row['센터명'] as string },
                { id: row['센터ID'] as string }
              ]
            }
          })

          if (!center) {
            errors.push(`행 ${index + 2}: 센터 ${row['센터명'] || row['센터ID']}을(를) 찾을 수 없습니다`)
            continue
          }

          const fareTypeKorean = row['요율종류'] as string
          const fareType = fareTypeKorean === '기본운임' ? 'BASIC' : 'STOP_FEE'
          const region = (row['지역'] as string) || ''
          
          // 요율 종류에 따른 검증
          if (fareType === 'BASIC') {
            if (!region) {
              errors.push(`행 ${index + 2}: 기본운임에는 지역이 필수입니다`)
              continue
            }
            if (!row['기본운임']) {
              errors.push(`행 ${index + 2}: 기본운임 금액이 필요합니다`)
              continue
            }
          } else {
            if (!row['경유운임'] || !row['지역운임']) {
              errors.push(`행 ${index + 2}: 경유운임에는 경유운임과 지역운임이 필수입니다`)
              continue
            }
          }

          const data = {
            centerName: center.centerName,
            vehicleType: row['차량톤수'] as string,
            region: fareType === 'STOP_FEE' ? '' : region,
            fareType,
            baseFare: fareType === 'BASIC' ? parseInt(row['기본운임'] as string) : null,
            extraStopFee: fareType === 'STOP_FEE' ? parseInt(row['경유운임'] as string) : null,
            extraRegionFee: fareType === 'STOP_FEE' ? parseInt(row['지역운임'] as string) : null,
          }

          // Upsert (중복 시 업데이트)
          const fare = await prisma.centerFare.upsert({
            where: {
              unique_center_vehicle_region: {
                centerName: data.centerName,
                vehicleType: data.vehicleType,
                region: data.region
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