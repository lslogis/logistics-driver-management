import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/**
 * 파일 유형별 파서 인터페이스
 */
export interface ParsedData {
  data: any[]
  errors: string[]
}

/**
 * CSV Injection 방지 함수
 */
function sanitizeForCSV(value: string | number): string {
  if (typeof value === 'number') {
    return value.toString()
  }
  
  const str = value.toString()
  // =, +, -, @ 문자로 시작하는 경우 앞에 ' 추가하여 공식 실행 방지
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`
  }
  
  return str
}

/**
 * CSV 파일 파싱
 */
export function parseCSV(csvContent: string): ParsedData {
  try {
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    })

    return {
      data: parseResult.data as any[],
      errors: parseResult.errors.map(err => err.message || '파싱 오류')
    }
  } catch (error) {
    return {
      data: [],
      errors: [error instanceof Error ? error.message : 'CSV 파싱 중 오류가 발생했습니다']
    }
  }
}

/**
 * Excel 파일 파싱
 */
export function parseExcel(buffer: ArrayBuffer): ParsedData {
  try {
    // Excel 파일 읽기
    const workbook = XLSX.read(buffer, { type: 'array' })
    
    // 첫 번째 워크시트 선택
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return {
        data: [],
        errors: ['Excel 파일에 워크시트가 없습니다']
      }
    }
    
    const worksheet = workbook.Sheets[sheetName]
    
    // JSON으로 변환 (첫 번째 행을 헤더로 사용)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: ''
    })
    
    if (jsonData.length === 0) {
      return {
        data: [],
        errors: ['Excel 파일이 비어있습니다']
      }
    }
    
    // 첫 번째 행을 헤더로 추출
    const headers = (jsonData[0] as string[]).map(h => h?.toString().trim() || '')
    
    // 데이터 행들을 객체로 변환
    const data = jsonData.slice(1).map((row: any) => {
      const obj: any = {}
      headers.forEach((header, index) => {
        if (header) {
          const value = row[index]
          obj[header] = value?.toString().trim() || ''
        }
      })
      return obj
    }).filter(row => {
      // 완전히 빈 행은 제외
      return Object.values(row).some(val => val !== '')
    })
    
    return {
      data,
      errors: []
    }
  } catch (error) {
    return {
      data: [],
      errors: [error instanceof Error ? error.message : 'Excel 파싱 중 오류가 발생했습니다']
    }
  }
}

/**
 * 파일 확장자 확인
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().split('.').pop() || ''
}

/**
 * 지원되는 파일 형식 확인
 */
export function isSupportedFileType(filename: string): boolean {
  const ext = getFileExtension(filename)
  return ['csv', 'xlsx', 'xls'].includes(ext)
}

/**
 * 통합 파일 파서 (CSV/Excel 자동 감지)
 */
export async function parseImportFile(file: File): Promise<ParsedData> {
  const ext = getFileExtension(file.name)
  
  if (!isSupportedFileType(file.name)) {
    return {
      data: [],
      errors: [`지원하지 않는 파일 형식입니다. 지원 형식: CSV, Excel (.xlsx, .xls)`]
    }
  }
  
  try {
    if (ext === 'csv') {
      const content = await file.text()
      return parseCSV(content)
    } else if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer()
      return parseExcel(buffer)
    } else {
      return {
        data: [],
        errors: [`지원하지 않는 파일 확장자: ${ext}`]
      }
    }
  } catch (error) {
    return {
      data: [],
      errors: [error instanceof Error ? error.message : '파일 읽기 중 오류가 발생했습니다']
    }
  }
}

/**
 * CSV 데이터 생성 (CSV Injection 보호 적용)
 */
export function generateCSV(headers: string[], data: any[]): string {
  // 데이터 정화
  const sanitizedData = data.map(row => {
    const sanitized: any = {}
    headers.forEach(header => {
      sanitized[header] = sanitizeForCSV(row[header] || '')
    })
    return sanitized
  })
  
  return Papa.unparse({ fields: headers, data: sanitizedData })
}

/**
 * 파일 크기 검증
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): string | null {
  const maxSize = maxSizeMB * 1024 * 1024
  if (file.size > maxSize) {
    return `파일 크기는 ${maxSizeMB}MB 이하여야 합니다`
  }
  return null
}

/**
 * 헤더 유사도 매칭 함수
 */
function findSimilarHeader(target: string, headers: string[]): string | null {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')
  const normalizedTarget = normalize(target)
  
  // 정확한 매치 우선
  const exactMatch = headers.find(h => normalize(h) === normalizedTarget)
  if (exactMatch) return exactMatch
  
  // 부분 매치 (한국어 헤더에 대한 다양한 변형 지원)
  const alternatives: { [key: string]: string[] } = {
    '성함': ['성함', '이름', '기사명', '성명', 'name'],
    '연락처': ['연락처', '전화번호', '핸드폰', '휴대폰', '연락망', 'phone'],
    '차량번호': ['차량번호', '차번호', '번호판', '차량', 'vehicle', 'plate'],
    '사업상호': ['사업상호', '회사명', '업체명', '상호명', 'company'],
    '대표자': ['대표자', '대표', '대표자명', 'representative'],
    '사업번호': ['사업번호', '사업자번호', '사업자등록번호', 'business'],
    '계좌은행': ['계좌은행', '은행명', '은행', 'bank'],
    '계좌번호': ['계좌번호', '계좌', '통장번호', 'account'],
    '특이사항': ['특이사항', '비고', '메모', '참고', 'remarks', 'note'],
    // 상차지 관련 헤더
    '센터명': ['센터명', '센터', '물류센터', '창고명', 'center'],
    '상차지명': ['상차지명', '상차지', '로딩포인트', '하차지', 'loading', 'point'],
    '지번주소': ['지번주소', '지번', '구주소', '번지', 'lot', 'address'],
    '도로명주소': ['도로명주소', '도로명', '신주소', '주소', 'road', 'address'],
    '담당자1': ['담당자1', '담당자', '관리자1', '연락담당자1', 'manager1', 'contact1'],
    '연락처1': ['연락처1', '전화번호1', '전화1', '연락망1', 'phone1', 'contact1'],
    '담당자2': ['담당자2', '부담당자', '관리자2', '연락담당자2', 'manager2', 'contact2'],
    '연락처2': ['연락처2', '전화번호2', '전화2', '연락망2', 'phone2', 'contact2'],
    '비고': ['비고', '특이사항', '메모', '참고사항', 'remarks', 'note'],
    // 고정노선 관련 헤더
    '노선명': ['노선명', '노선', '코스명', '라인명', 'route', 'line'],
    '운행요일': ['운행요일', '요일패턴', '요일', '운행일', 'weekday', 'pattern'],
    '계약형태': ['계약형태', '계약타입', '계약', '타입', 'contract', 'type'],
    '배정기사명': ['배정기사명', '배정기사', '담당기사', '기사명', '기사', 'driver', 'assigned'],
    '일매출': ['일매출', '일수익', '일당매출', '일수입', 'daily_revenue'],
    '일매입': ['일매입', '일비용', '일당매입', '일지출', 'daily_cost'],
    '월매출': ['월매출', '월수익', '월당매출', '월수입', 'monthly_revenue'],
    '월매입': ['월매입', '월비용', '월당매입', '월지출', 'monthly_cost'],
    '월매출(비용포함)': ['월매출(비용포함)', '월매출비용포함', '월전체매출', 'monthly_revenue_with_expense'],
    '월매입(비용포함)': ['월매입(비용포함)', '월매입비용포함', '월전체매입', 'monthly_cost_with_expense']
  }
  
  const targetAlts = alternatives[target] || [target]
  
  for (const alt of targetAlts) {
    const normalizedAlt = normalize(alt)
    const match = headers.find(h => normalize(h) === normalizedAlt)
    if (match) return match
  }
  
  // 포함 관계 매치
  for (const alt of targetAlts) {
    const normalizedAlt = normalize(alt)
    const match = headers.find(h => {
      const normalizedHeader = normalize(h)
      return normalizedHeader.includes(normalizedAlt) || normalizedAlt.includes(normalizedHeader)
    })
    if (match) return match
  }
  
  return null
}

/**
 * 필수 헤더 검증 (유연한 매칭)
 */
export function validateHeaders(data: any[], requiredHeaders: string[]): string[] {
  if (data.length === 0) {
    return ['파일이 비어있습니다']
  }
  
  const headers = Object.keys(data[0])
  const missingHeaders: string[] = []
  const foundMappings: { [key: string]: string } = {}
  
  for (const required of requiredHeaders) {
    const match = findSimilarHeader(required, headers)
    if (match) {
      foundMappings[required] = match
    } else {
      missingHeaders.push(required)
    }
  }
  
  if (missingHeaders.length > 0) {
    const mappingInfo = Object.entries(foundMappings).map(([std, found]) => `${std}→${found}`).join(', ')
    return [`필수 헤더가 없습니다: ${missingHeaders.join(', ')}. 발견된 매핑: ${mappingInfo || '없음'}. 현재 헤더: ${headers.join(', ')}`]
  }
  
  return []
}

/**
 * 헤더 매핑 함수 (유연한 매칭으로 데이터 변환)
 */
export function mapRowHeaders(row: any, headerMapping?: { [key: string]: string }): any {
  const mappedRow: any = {}
  const headers = Object.keys(row)
  
  // 표준 헤더에 대해 매핑 (기사 + 상차지 + 고정노선 헤더)
  const standardHeaders = [
    // 기사 관련
    '성함', '연락처', '차량번호', '사업상호', '대표자', '사업번호', '계좌은행', '계좌번호', '특이사항',
    // 상차지 관련
    '센터명', '상차지명', '지번주소', '도로명주소', '담당자1', '연락처1', '담당자2', '연락처2', '비고',
    // 고정노선 관련
    '노선명', '운행요일', '계약형태', '배정기사명', '일매출', '일매입', '월매출', '월매입', '월매출(비용포함)', '월매입(비용포함)'
  ]
  
  for (const standardHeader of standardHeaders) {
    const matchedHeader = findSimilarHeader(standardHeader, headers)
    if (matchedHeader && row[matchedHeader] !== undefined) {
      mappedRow[standardHeader] = row[matchedHeader]
    }
  }
  
  return mappedRow
}