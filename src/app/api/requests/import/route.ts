import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

interface ExcelRow {
  centerName: string
  requestDate: string
  centerCarNo: string
  vehicleTon: number
  regions: string
  stops: number
  notes?: string
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
  extraAdjustment?: number
  adjustmentReason?: string
  driverName?: string
  driverPhone?: string
  driverVehicle?: string
  deliveryTime?: string
  driverFee?: number
  driverNotes?: string
}

interface ImportProgress {
  step: 'parsing' | 'validating' | 'resolving' | 'importing' | 'completed'
  totalRows: number
  processedRows: number
  successCount: number
  errorCount: number
  warningCount: number
}

interface ImportResult {
  success: boolean
  progress: ImportProgress
  requests: any[]
  errors: Array<{
    row: number
    column?: string
    message: string
    data?: any
  }>
  warnings: Array<{
    row: number
    message: string
  }>
}

// POST /api/requests/import - Import requests from Excel file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      )
    }

    const result = await importExcelFile(file)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to process import file' },
      { status: 500 }
    )
  }
}

async function importExcelFile(file: File): Promise<ImportResult> {
  const progress: ImportProgress = {
    step: 'parsing',
    totalRows: 0,
    processedRows: 0,
    successCount: 0,
    errorCount: 0,
    warningCount: 0
  }

  const errors: ImportResult['errors'] = []
  const warnings: ImportResult['warnings'] = []
  const requests: any[] = []

  try {
    // Step 1: Parse Excel file
    progress.step = 'parsing'
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(worksheet) as any[]
    
    progress.totalRows = rows.length

    if (rows.length === 0) {
      return {
        success: false,
        progress,
        requests: [],
        dispatches: [],
        errors: [{ row: 0, message: 'No data found in Excel file' }],
        warnings: []
      }
    }

    // Step 2: Validate and process rows
    progress.step = 'validating'
    
    for (let i = 0; i < rows.length; i++) {
      const rowIndex = i + 1 // Excel rows are 1-indexed
      const row = rows[i]
      
      try {
        // Parse and validate row data
        const excelRow = parseExcelRow(row, rowIndex)
        
        if (excelRow.errors.length > 0) {
          errors.push(...excelRow.errors)
          progress.errorCount++
          continue
        }

        if (excelRow.warnings.length > 0) {
          warnings.push(...excelRow.warnings)
          progress.warningCount++
        }

        // Step 3: Resolve driver (only if driver information is provided)
        progress.step = 'resolving'
        let driverResolution = { driverId: undefined, warnings: [] as string[] }
        
        if (excelRow.data.driverName && excelRow.data.driverPhone) {
          driverResolution = await resolveDriver(
            excelRow.data.driverName,
            excelRow.data.driverPhone,
            excelRow.data.driverVehicle
          )

          if (driverResolution.warnings.length > 0) {
            warnings.push(...driverResolution.warnings.map(w => ({
              row: rowIndex,
              message: w
            })))
          }
        }

        // Step 4: Resolve loading point by center name
        const loadingPoint = await prisma.loadingPoint.findFirst({
          where: {
            OR: [
              { name: excelRow.data.centerName },
              { centerName: excelRow.data.centerName }
            ],
            isActive: true
          }
        })

        if (!loadingPoint) {
          errors.push({
            row: rowIndex,
            message: `Loading point not found for center: ${excelRow.data.centerName}`
          })
          progress.errorCount++
          continue
        }

        // Step 5: Create request with embedded driver information
        progress.step = 'importing'
        
        const requestData = mapExcelToRequest(excelRow.data, loadingPoint.id, driverResolution.driverId)

        // Create request with driver information in single operation
        const request = await prisma.request.create({
          data: requestData
        })

        requests.push(request)
        progress.successCount++

      } catch (error) {
        errors.push({
          row: rowIndex,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: row
        })
        progress.errorCount++
      }

      progress.processedRows++
    }

    progress.step = 'completed'

    return {
      success: progress.successCount > 0,
      progress,
      requests,
      errors,
      warnings
    }

  } catch (error) {
    return {
      success: false,
      progress,
      requests: [],
      errors: [{ 
        row: 0, 
        message: error instanceof Error ? error.message : 'Unknown parsing error' 
      }],
      warnings: []
    }
  }
}

function parseExcelRow(row: any, rowIndex: number) {
  const errors: ImportResult['errors'] = []
  const warnings: ImportResult['warnings'] = []

  // Required field validation
  const requiredFields = {
    '센터명': 'centerName',
    '요청일': 'requestDate',
    '호차번호': 'centerCarNo', 
    '톤수': 'vehicleTon',
    '배송지역': 'regions',
    '착지수': 'stops'
  }

  // Optional fields that might be provided
  const optionalFields = {
    '기본운임': 'baseFare',
    '착지수당': 'extraStopFee',
    '지역운임': 'extraRegionFee',
    '기사명': 'driverName',
    '기사연락처': 'driverPhone',
    '기사차량': 'driverVehicle',
    '배송시간': 'deliveryTime',
    '기사운임': 'driverFee',
    '기사메모': 'driverNotes'
  }

  const data: any = {}

  for (const [koreanField, englishField] of Object.entries(requiredFields)) {
    const value = row[koreanField]
    
    if (value === undefined || value === null || value === '') {
      errors.push({
        row: rowIndex,
        column: koreanField,
        message: `Required field missing: ${koreanField}`
      })
      continue
    }

    // Type conversion and validation
    switch (englishField) {
      case 'requestDate':
        try {
          data[englishField] = new Date(value).toISOString().split('T')[0]
        } catch {
          errors.push({
            row: rowIndex,
            column: koreanField,
            message: 'Invalid date format'
          })
        }
        break

      case 'vehicleTon':
        const tonnage = parseFloat(value)
        if (isNaN(tonnage) || tonnage < 0.1 || tonnage > 999.9) {
          errors.push({
            row: rowIndex,
            column: koreanField,
            message: 'Vehicle tonnage must be between 0.1 and 999.9'
          })
        } else {
          data[englishField] = tonnage
        }
        break

      case 'regions':
        const regions = value.split(',').map((r: string) => r.trim()).filter((r: string) => r.length > 0)
        if (regions.length === 0) {
          errors.push({
            row: rowIndex,
            column: koreanField,
            message: 'At least one region is required'
          })
        } else if (regions.length > 10) {
          warnings.push({
            row: rowIndex,
            message: 'More than 10 regions detected, only first 10 will be used'
          })
          data[englishField] = regions.slice(0, 10)
        } else {
          data[englishField] = regions
        }
        break

      case 'stops':
        const stops = parseInt(value)
        if (isNaN(stops) || stops < 1 || stops > 50) {
          errors.push({
            row: rowIndex,
            column: koreanField,
            message: 'Stops must be between 1 and 50'
          })
        } else {
          data[englishField] = stops
        }
        break


      default:
        data[englishField] = value.toString().trim()
    }
  }

  // Process optional fields
  for (const [koreanField, englishField] of Object.entries(optionalFields)) {
    const value = row[koreanField]
    
    if (value !== undefined && value !== null && value !== '') {
      switch (englishField) {
        case 'baseFare':
        case 'extraStopFee':
        case 'extraRegionFee':
        case 'driverFee':
          const amount = parseInt(value)
          if (isNaN(amount) || amount < 0) {
            warnings.push({
              row: rowIndex,
              message: `Invalid ${koreanField} value, setting to 0`
            })
            data[englishField] = 0
          } else {
            data[englishField] = amount
          }
          break

        case 'driverPhone':
          const phone = value.toString().replace(/[^0-9-]/g, '')
          if (!/^010-\d{4}-\d{4}$/.test(phone)) {
            // Try to format it
            const digits = phone.replace(/[^0-9]/g, '')
            if (digits.length === 11 && digits.startsWith('010')) {
              data[englishField] = `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`
              warnings.push({
                row: rowIndex,
                message: 'Phone number auto-formatted'
              })
            } else {
              warnings.push({
                row: rowIndex,
                message: 'Invalid phone format, driver info might not match'
              })
              data[englishField] = value.toString().trim()
            }
          } else {
            data[englishField] = phone
          }
          break

        default:
          data[englishField] = value.toString().trim()
      }
    }
  }

  // Additional optional fields
  if (row['추가조정']) {
    const adjustment = parseInt(row['추가조정'])
    data.extraAdjustment = isNaN(adjustment) ? 0 : adjustment
  } else {
    data.extraAdjustment = 0
  }

  if (row['조정사유']) {
    data.adjustmentReason = row['조정사유'].toString().trim()
  }

  if (row['메모']) {
    data.notes = row['메모'].toString().trim()
  }

  // Business rule validation
  if (data.extraAdjustment !== 0 && !data.adjustmentReason) {
    errors.push({
      row: rowIndex,
      column: '조정사유',
      message: 'Adjustment reason required when extra adjustment is not zero'
    })
  }

  return { data, errors, warnings }
}

async function resolveDriver(name: string, phone: string, vehicle: string) {
  const warnings: string[] = []
  let driverId: string | undefined

  try {
    // 1. Exact match by phone
    const phoneMatch = await prisma.driver.findFirst({
      where: { phone, isActive: true }
    })

    if (phoneMatch) {
      driverId = phoneMatch.id
      if (phoneMatch.name !== name) {
        warnings.push(`Driver name mismatch: DB="${phoneMatch.name}", Excel="${name}"`)
      }
      return { driverId, warnings }
    }

    // 2. Exact match by name + vehicle
    const nameVehicleMatch = await prisma.driver.findFirst({
      where: { 
        name, 
        vehicleNumber: vehicle,
        isActive: true 
      }
    })

    if (nameVehicleMatch) {
      driverId = nameVehicleMatch.id
      warnings.push(`Driver matched by name+vehicle, phone different`)
      return { driverId, warnings }
    }

    // 3. No match found
    warnings.push(`No matching driver found: ${name} (${phone})`)
    return { driverId: undefined, warnings }

  } catch (error) {
    warnings.push(`Error resolving driver: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { driverId: undefined, warnings }
  }
}

function mapExcelToRequest(row: ExcelRow, loadingPointId: string, driverId?: string) {
  const requestData: any = {
    loadingPointId,
    requestDate: new Date(row.requestDate),
    centerCarNo: row.centerCarNo,
    vehicleTon: row.vehicleTon,
    regions: row.regions,
    stops: row.stops,
    notes: row.notes || undefined,
    
    // Fare breakdown
    baseFare: row.baseFare || 0,
    extraStopFee: row.extraStopFee || 0,
    extraRegionFee: row.extraRegionFee || 0,
    extraAdjustment: row.extraAdjustment || 0,
    adjustmentReason: row.adjustmentReason || undefined,
    
    // Driver information (consolidated model)
    driverId: driverId || undefined,
    driverName: row.driverName || undefined,
    driverPhone: row.driverPhone || undefined,
    driverVehicle: row.driverVehicle || undefined,
    deliveryTime: row.deliveryTime || undefined,
    driverFee: row.driverFee || 0,
    driverNotes: row.driverNotes || undefined
  }

  // Set dispatchedAt if driver information is provided
  if (row.driverName || row.driverPhone) {
    requestData.dispatchedAt = new Date()
  }

  return requestData
}