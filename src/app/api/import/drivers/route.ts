import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { createDriverSchema } from '@/lib/validations/driver'
import { z } from 'zod'

// CSV Import 검증 스키마
const importDriversSchema = z.object({
  validateOnly: z
    .string()
    .optional()
    .transform(val => val === 'true')
})

// CSV 파싱 함수
function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.trim().split('\n')
  return lines.map(line => {
    // 간단한 CSV 파싱 (따옴표 처리 포함)
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

// CSV 데이터를 Driver 객체로 변환
function csvRowToDriver(row: string[], headers: string[]) {
  const data: any = {}
  
  headers.forEach((header, index) => {
    const value = row[index]?.trim() || ''
    
    switch (header.toLowerCase()) {
      case 'name':
      case '이름':
        data.name = value
        break
      case 'phone':
      case '전화번호':
        data.phone = value
        break
      case 'email':
      case '이메일':
        data.email = value || undefined
        break
      case 'businessnumber':
      case '사업자등록번호':
        data.businessNumber = value || undefined
        break
      case 'companyname':
      case '회사명':
        data.companyName = value || undefined
        break
      case 'representativename':
      case '대표자명':
        data.representativeName = value || undefined
        break
      case 'bankname':
      case '은행명':
        data.bankName = value || undefined
        break
      case 'accountnumber':
      case '계좌번호':
        data.accountNumber = value || undefined
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
 * POST /api/import/drivers - 기사 CSV 일괄 등록
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
      
      const { validateOnly } = importDriversSchema.parse({ 
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
      const requiredHeaders = ['name', '이름']
      const phoneHeaders = ['phone', '전화번호']
      
      const hasNameColumn = requiredHeaders.some(h => headers.includes(h))
      const hasPhoneColumn = phoneHeaders.some(h => headers.includes(h))

      if (!hasNameColumn) {
        return apiResponse.error('필수 컬럼이 없습니다: name (또는 이름)')
      }

      if (!hasPhoneColumn) {
        return apiResponse.error('필수 컬럼이 없습니다: phone (또는 전화번호)')
      }

      // 데이터 검증 및 변환
      const results = {
        total: dataRows.length,
        valid: 0,
        invalid: 0,
        imported: 0,
        errors: [] as Array<{ row: number; error: string; data?: any }>
      }

      const validDrivers: any[] = []

      for (let i = 0; i < dataRows.length; i++) {
        const rowIndex = i + 2 // CSV에서 실제 행 번호 (헤더 포함)
        const row = dataRows[i]
        
        try {
          // CSV 행을 Driver 객체로 변환
          const driverData = csvRowToDriver(row, headers)
          
          // Zod 스키마로 검증
          const validatedDriver = createDriverSchema.parse(driverData)
          
          // 중복 전화번호 확인 (기존 DB + 현재 배치 내)
          const existingInDB = await prisma.driver.findFirst({
            where: { phone: validatedDriver.phone }
          })
          
          if (existingInDB) {
            results.errors.push({
              row: rowIndex,
              error: `이미 등록된 전화번호입니다: ${validatedDriver.phone}`,
              data: driverData
            })
            results.invalid++
            continue
          }

          const duplicateInBatch = validDrivers.find(d => d.phone === validatedDriver.phone)
          if (duplicateInBatch) {
            results.errors.push({
              row: rowIndex,
              error: `배치 내 중복된 전화번호입니다: ${validatedDriver.phone}`,
              data: driverData
            })
            results.invalid++
            continue
          }

          validDrivers.push(validatedDriver)
          results.valid++
          
        } catch (error) {
          let errorMessage = '데이터 검증 오류'
          
          if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ')
          } else if (error instanceof Error) {
            errorMessage = error.message
          }
          
          results.errors.push({
            row: rowIndex,
            error: errorMessage,
            data: csvRowToDriver(row, headers)
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
            preview: validDrivers.slice(0, 5) // 처음 5개 미리보기
          }
        })
      }

      // 실제 가져오기 수행
      if (validDrivers.length === 0) {
        return apiResponse.error('가져올 수 있는 유효한 데이터가 없습니다', 400)
      }

      // 트랜잭션으로 일괄 삽입
      await prisma.$transaction(async (tx) => {
        for (const driver of validDrivers) {
          await tx.driver.create({
            data: driver
          })
          results.imported++
        }
      })

      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'Driver',
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
        message: `${results.imported}개의 기사가 성공적으로 등록되었습니다`,
        results
      })

    } catch (error) {
      console.error('Failed to import drivers:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('기사 가져오기 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'drivers', action: 'create' }
)