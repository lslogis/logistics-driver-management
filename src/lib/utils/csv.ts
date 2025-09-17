import Papa from 'papaparse'

export interface FareRow {
  id: string
  center: string
  vehicleType: string
  fareType: string
  baseFare: number
  extraStopFee: number
  extraRegionFee: number
  createdAt: string
}

export interface ParsedCSVResult {
  data: FareRow[]
  errors: string[]
}

// CSV Export
export const exportToCSV = (data: FareRow[], filename: string = 'center-fares') => {
  const headers = [
    '센터명',
    '차량톤수',
    '요율종류',
    '기본운임',
    '경유운임',
    '지역운임',
    '등록일'
  ]

  const csvData = [
    headers,
    ...data.map(row => [
      row.center,
      row.vehicleType,
      row.fareType,
      row.baseFare.toString(),
      row.extraStopFee.toString(),
      row.extraRegionFee.toString(),
      row.createdAt
    ])
  ]

  const csv = Papa.unparse(csvData, {
    encoding: 'utf-8'
  })

  // UTF-8 BOM 추가로 한글 깨짐 방지
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// CSV Import
export const parseCSVFile = (file: File): Promise<ParsedCSVResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: false,
      encoding: 'utf-8',
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const data: FareRow[] = []

        if (!results.data || results.data.length < 2) {
          errors.push('CSV 파일이 비어있거나 헤더만 있습니다.')
          return resolve({ data: [], errors })
        }

        // 첫 번째 행은 헤더로 간주하고 스킵
        const rows = results.data.slice(1) as string[][]

        rows.forEach((row, index) => {
          const rowNumber = index + 2 // 헤더 포함해서 실제 행 번호

          if (row.length < 6) {
            errors.push(`${rowNumber}행: 필드가 부족합니다 (최소 6개 필요)`)
            return
          }

          const [center, vehicleType, fareType, baseFareStr, extraStopFeeStr, extraRegionFeeStr] = row

          if (!center?.trim()) {
            errors.push(`${rowNumber}행: 센터명이 비어있습니다`)
            return
          }

          if (!vehicleType?.trim()) {
            errors.push(`${rowNumber}행: 차량톤수가 비어있습니다`)
            return
          }

          if (!fareType?.trim()) {
            errors.push(`${rowNumber}행: 요율종류가 비어있습니다`)
            return
          }

          const baseFare = parseInt(baseFareStr?.replace(/[^\d]/g, '') || '0')
          const extraStopFee = parseInt(extraStopFeeStr?.replace(/[^\d]/g, '') || '0')
          const extraRegionFee = parseInt(extraRegionFeeStr?.replace(/[^\d]/g, '') || '0')

          if (baseFare < 0 || extraStopFee < 0 || extraRegionFee < 0) {
            errors.push(`${rowNumber}행: 요율 값은 음수일 수 없습니다`)
            return
          }

          data.push({
            id: `import-${Date.now()}-${index}`,
            center: center.trim(),
            vehicleType: vehicleType.trim(),
            fareType: fareType.trim(),
            baseFare,
            extraStopFee,
            extraRegionFee,
            createdAt: new Date().toISOString().slice(0, 10)
          })
        })

        resolve({ data, errors })
      },
      error: (error) => {
        resolve({ 
          data: [], 
          errors: [`CSV 파싱 오류: ${error.message}`] 
        })
      }
    })
  })
}

// CSV 템플릿 다운로드
export const downloadCSVTemplate = () => {
  const headers = [
    '센터명',
    '차량톤수', 
    '요율종류',
    '기본운임',
    '경유운임',
    '지역운임'
  ]

  const sampleData = [
    ['쿠팡', '1톤', '일반', '120000', '15000', '20000'],
    ['쿠팡', '2.5톤', '일반', '180000', '20000', '25000'],
    ['CJ대한통운', '1톤', '특급', '150000', '18000', '22000']
  ]

  const csvData = [headers, ...sampleData]
  const csv = Papa.unparse(csvData)
  
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'center-fares-template.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}