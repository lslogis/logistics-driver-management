import * as XLSX from 'xlsx'

// 데이터 모델
export interface FareRow {
  id: string
  centerId: string
  centerName: string
  vehicleTypeId: string
  vehicleTypeName: string
  region: string  // 직접 입력 텍스트
  fareType: '기본운임' | '경유+지역'
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
  createdAt: string
}


// 차량 톤수 옵션 (크기순 정렬)
export const VEHICLE_TYPE_OPTIONS = [
  { id: 'vehicle-1ton', name: '1톤' },
  { id: 'vehicle-1-4ton', name: '1.4톤' },
  { id: 'vehicle-2-5ton', name: '2.5톤' },
  { id: 'vehicle-3-5ton', name: '3.5톤' },
  { id: 'vehicle-3-5ton-wide', name: '3.5톤광폭' },
  { id: 'vehicle-5ton', name: '5톤' },
  { id: 'vehicle-5ton-axis', name: '5톤축' },
  { id: 'vehicle-11ton', name: '11톤' },
  { id: 'vehicle-14ton', name: '14톤' },
]

// 중복 체크 함수
export const checkDuplicateFare = (
  rows: FareRow[], 
  newRow: { 
    centerId: string
    vehicleTypeId: string
    region: string
  }, 
  excludeId?: string
): boolean => {
  return rows.some(row => 
    row.id !== excludeId &&
    row.centerId === newRow.centerId && 
    row.vehicleTypeId === newRow.vehicleTypeId &&
    row.region === newRow.region
  )
}

// Excel Export
export const exportToExcel = (data: FareRow[], filename: string = 'center-fares') => {
  const headers = [
    '센터명',
    '차량톤수',
    '지역',
    '요율종류',
    '기본운임',
    '경유운임',
    '지역운임',
    '등록일'
  ]

  const excelData = [
    headers,
    ...data.map(row => [
      row.centerName,
      row.vehicleTypeName,
      // 기본운임일 때만 지역 표시, 경유+지역일 때는 빈 값
      row.fareType === '기본운임' ? row.region : '',
      row.fareType,
      row.baseFare || '',
      row.extraStopFee || '',
      row.extraRegionFee || '',
      row.createdAt
    ])
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(excelData)
  const workbook = XLSX.utils.book_new()
  
  // 컬럼 너비 설정
  worksheet['!cols'] = [
    { wch: 15 }, // 센터명
    { wch: 12 }, // 차량톤수
    { wch: 10 }, // 지역
    { wch: 12 }, // 요율종류
    { wch: 15 }, // 기본운임
    { wch: 15 }, // 경유운임
    { wch: 15 }, // 지역운임
    { wch: 12 }  // 등록일
  ]

  XLSX.utils.book_append_sheet(workbook, worksheet, '센터요율')
  
  const fileName = `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

// Excel Import
export interface ParsedExcelResult {
  data: FareRow[]
  errors: string[]
}

export const parseExcelFile = (file: File): Promise<ParsedExcelResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        if (workbook.SheetNames.length === 0) {
          resolve({ data: [], errors: ['Excel 파일에 시트가 없습니다.'] })
          return
        }

        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        const errors: string[] = []
        const parsedData: FareRow[] = []

        if (jsonData.length < 2) {
          errors.push('Excel 파일이 비어있거나 헤더만 있습니다.')
          return resolve({ data: [], errors })
        }

        // 첫 번째 행은 헤더로 간주하고 스킵
        const rows = jsonData.slice(1)

        rows.forEach((row, index) => {
          const rowNumber = index + 2 // 헤더 포함해서 실제 행 번호

          if (!row || row.length < 7) {
            errors.push(`${rowNumber}행: 필드가 부족합니다 (최소 7개 필요)`)
            return
          }

          const [centerName, vehicleTypeName, regionName, fareType, baseFareStr, extraStopFeeStr, extraRegionFeeStr] = row

          // 필수 필드 검증
          if (!centerName || !vehicleTypeName) {
            errors.push(`${rowNumber}행: 센터명, 차량톤수는 필수입니다`)
            return
          }

          if (fareType !== '기본운임' && fareType !== '경유+지역') {
            errors.push(`${rowNumber}행: 요율종류는 '기본운임' 또는 '경유+지역'이어야 합니다`)
            return
          }

          // 기본운임일 때만 지역 필수
          if (fareType === '기본운임' && (!regionName || !regionName.trim())) {
            errors.push(`${rowNumber}행: 기본운임의 경우 지역은 필수입니다`)
            return
          }

          // 요율종류에 따른 필드 검증
          let baseFare: number | undefined
          let extraStopFee: number | undefined
          let extraRegionFee: number | undefined

          if (fareType === '기본운임') {
            baseFare = Number(baseFareStr) || 0
            if (baseFare <= 0) {
              errors.push(`${rowNumber}행: 기본운임은 0보다 커야 합니다`)
              return
            }
          } else {
            extraStopFee = Number(extraStopFeeStr) || 0
            extraRegionFee = Number(extraRegionFeeStr) || 0
            if (extraStopFee < 0 || extraRegionFee < 0) {
              errors.push(`${rowNumber}행: 경유운임과 지역운임은 0 이상이어야 합니다`)
              return
            }
          }

          // 차량 ID 매칭
          const vehicle = VEHICLE_TYPE_OPTIONS.find(v => v.name === vehicleTypeName)
          if (!vehicle) {
            errors.push(`${rowNumber}행: 유효하지 않은 차량톤수입니다`)
            return
          }

          parsedData.push({
            id: `import-${Date.now()}-${index}`,
            centerId: `center-${centerName.trim().toLowerCase()}`,
            centerName: centerName.trim(),
            vehicleTypeId: vehicle.id,
            vehicleTypeName: vehicle.name,
            // 기본운임일 때만 지역 저장, 경유+지역일 때는 빈 문자열
            region: fareType === '기본운임' ? (regionName ? regionName.trim() : '') : '',
            fareType: fareType as '기본운임' | '경유+지역',
            baseFare,
            extraStopFee,
            extraRegionFee,
            createdAt: new Date().toISOString().slice(0, 10)
          })
        })

        resolve({ data: parsedData, errors })
      } catch (error) {
        resolve({ 
          data: [], 
          errors: [`Excel 파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`] 
        })
      }
    }

    reader.onerror = () => {
      resolve({ 
        data: [], 
        errors: ['파일 읽기 오류가 발생했습니다.'] 
      })
    }

    reader.readAsArrayBuffer(file)
  })
}

// Excel 템플릿 다운로드
export const downloadExcelTemplate = () => {
  const headers = [
    '센터명',
    '차량톤수', 
    '지역',
    '요율종류',
    '기본운임',
    '경유운임',
    '지역운임'
  ]

  const sampleData = [
    ['쿠팡', '1톤', '서울', '기본운임', '120000', '', ''],
    ['쿠팡', '1톤', '', '경유+지역', '', '15000', '20000']
  ]

  const excelData = [headers, ...sampleData]
  const worksheet = XLSX.utils.aoa_to_sheet(excelData)
  const workbook = XLSX.utils.book_new()
  
  // 컬럼 너비 설정
  worksheet['!cols'] = [
    { wch: 15 }, // 센터명
    { wch: 12 }, // 차량톤수
    { wch: 10 }, // 지역
    { wch: 12 }, // 요율종류
    { wch: 15 }, // 기본운임
    { wch: 15 }, // 경유운임
    { wch: 15 }  // 지역운임
  ]

  XLSX.utils.book_append_sheet(workbook, worksheet, '센터요율템플릿')
  XLSX.writeFile(workbook, 'center-fares-template.xlsx')
}