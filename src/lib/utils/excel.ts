import * as XLSX from 'xlsx'

export interface FareRow {
  id: string
  centerId: string
  centerName: string
  vehicleTypeId: string
  vehicleTypeName: string
  fareType: '기본운임' | '경유운임'
  baseFare: number
  extraStopFee: number
  extraRegionFee: number
  createdAt: string
}

export interface ParsedExcelResult {
  data: FareRow[]
  errors: string[]
}

// Excel Export
export const exportToExcel = (data: FareRow[], filename: string = 'center-fares') => {
  const headers = [
    '센터명',
    '차량톤수',
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
  const columnWidths = [
    { wch: 15 }, // 센터명
    { wch: 12 }, // 차량톤수
    { wch: 12 }, // 요율종류
    { wch: 15 }, // 기본운임
    { wch: 15 }, // 경유운임
    { wch: 15 }, // 지역운임
    { wch: 12 }  // 등록일
  ]
  worksheet['!cols'] = columnWidths

  // 헤더 스타일 설정
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "2563EB" } },
    alignment: { horizontal: "center", vertical: "center" }
  }

  // 헤더에 스타일 적용
  headers.forEach((_, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index })
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = headerStyle
    }
  })

  XLSX.utils.book_append_sheet(workbook, worksheet, '센터요율')
  
  const fileName = `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

// Excel Import
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

          if (!row || row.length < 6) {
            errors.push(`${rowNumber}행: 필드가 부족합니다 (최소 6개 필요)`)
            return
          }

          const [centerName, vehicleTypeName, fareType, baseFareStr, extraStopFeeStr, extraRegionFeeStr] = row

          if (!centerName || typeof centerName !== 'string' || !centerName.trim()) {
            errors.push(`${rowNumber}행: 센터명이 비어있습니다`)
            return
          }

          if (!vehicleTypeName || typeof vehicleTypeName !== 'string' || !vehicleTypeName.trim()) {
            errors.push(`${rowNumber}행: 차량톤수가 비어있습니다`)
            return
          }

          if (!fareType || (fareType !== '기본운임' && fareType !== '경유운임')) {
            errors.push(`${rowNumber}행: 요율종류는 '기본운임' 또는 '경유운임'이어야 합니다`)
            return
          }

          // 모든 요율에 기본료, 경유운임, 지역운임 모두 필수
          const baseFare = Number(baseFareStr) || 0
          const extraStopFee = Number(extraStopFeeStr) || 0
          const extraRegionFee = Number(extraRegionFeeStr) || 0

          // 필수 값 검증
          if (baseFare < 0) {
            errors.push(`${rowNumber}행: 기본료는 0 이상이어야 합니다`)
            return
          }

          if (extraStopFee < 0) {
            errors.push(`${rowNumber}행: 경유운임은 0 이상이어야 합니다`)
            return
          }

          if (extraRegionFee < 0) {
            errors.push(`${rowNumber}행: 지역운임은 0 이상이어야 합니다`)
            return
          }

          parsedData.push({
            id: `import-${Date.now()}-${index}`,
            centerId: `center-${centerName.trim().toLowerCase()}`,
            centerName: centerName.trim(),
            vehicleTypeId: `vehicle-${vehicleTypeName.trim().toLowerCase()}`,
            vehicleTypeName: vehicleTypeName.trim(),
            fareType: fareType as '기본운임' | '경유운임',
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
    '요율종류',
    '기본운임',
    '경유운임',
    '지역운임'
  ]

  const sampleData = [
    ['쿠팡', '1톤', '기본운임', 120000, 15000, 20000],
    ['쿠팡', '2.5톤', '경유운임', 180000, 20000, 25000],
    ['CJ대한통운', '3.5톤', '기본운임', 200000, 18000, 22000],
    ['현대글로비스', '5톤', '경유운임', 300000, 25000, 30000],
    ['한진', '11톤', '기본운임', 450000, 35000, 40000]
  ]

  const excelData = [headers, ...sampleData]
  const worksheet = XLSX.utils.aoa_to_sheet(excelData)
  const workbook = XLSX.utils.book_new()
  
  // 컬럼 너비 설정
  const columnWidths = [
    { wch: 15 }, // 센터명
    { wch: 12 }, // 차량톤수
    { wch: 12 }, // 요율종류
    { wch: 15 }, // 기본운임
    { wch: 15 }, // 경유운임
    { wch: 15 }  // 지역운임
  ]
  worksheet['!cols'] = columnWidths

  // 헤더 스타일 설정
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "059669" } },
    alignment: { horizontal: "center", vertical: "center" }
  }

  // 헤더에 스타일 적용
  headers.forEach((_, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index })
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = headerStyle
    }
  })

  XLSX.utils.book_append_sheet(workbook, worksheet, '센터요율템플릿')
  XLSX.writeFile(workbook, 'center-fares-template.xlsx')
}

// 중복 체크 함수
export const checkDuplicateFare = (
  rows: FareRow[], 
  newRow: { centerId: string; vehicleTypeId: string; fareType: '기본운임' | '경유운임' }, 
  excludeId?: string
): boolean => {
  return rows.some(row => 
    row.id !== excludeId &&
    row.centerId === newRow.centerId && 
    row.vehicleTypeId === newRow.vehicleTypeId && 
    row.fareType === newRow.fareType
  )
}