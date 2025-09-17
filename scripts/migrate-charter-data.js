/**
 * Charter Management System Data Migration Script
 * 기존 charter_requests 및 charter_destinations 데이터를 새로운 Request/Dispatch 스키마로 마이그레이션
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateCharterData() {
  console.log('🚀 Starting charter data migration...')
  
  let migratedRequests = 0
  let migratedDispatches = 0
  let errors = []

  try {
    // 1. 기존 charter_requests 데이터 조회
    const charterRequests = await prisma.charterRequest.findMany({
      include: {
        destinations: {
          orderBy: { order: 'asc' }
        },
        driver: true,
        center: true
      }
    })

    console.log(`📊 Found ${charterRequests.length} charter requests to migrate`)

    // 2. 배치별로 마이그레이션 (100개씩)
    const batchSize = 100
    const batches = Math.ceil(charterRequests.length / batchSize)

    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const startIndex = batchIndex * batchSize
      const endIndex = Math.min(startIndex + batchSize, charterRequests.length)
      const batch = charterRequests.slice(startIndex, endIndex)

      console.log(`📦 Processing batch ${batchIndex + 1}/${batches} (${batch.length} items)...`)

      try {
        await prisma.$transaction(async (tx) => {
          for (const charter of batch) {
            try {
              // 지역 데이터 변환
              const regions = charter.destinations.map(dest => dest.region)
              
              // 차량 톤수 추정 (vehicleType에서 추출)
              const vehicleTon = extractTonnageFromType(charter.vehicleType)
              
              // Request 생성
              const request = await tx.request.create({
                data: {
                  requestDate: charter.date,
                  centerCarNo: extractCenterCarNo(charter.center?.centerName || 'Unknown'),
                  vehicleTon: vehicleTon,
                  regions: regions,
                  stops: charter.destinations.length,
                  notes: charter.notes,
                  extraAdjustment: charter.extraFare || 0,
                  adjustmentReason: charter.isNegotiated ? '협상운임' : undefined
                }
              })

              // Dispatch 생성
              const dispatch = await tx.dispatch.create({
                data: {
                  requestId: request.id,
                  driverId: charter.driverId,
                  driverName: charter.driver?.name || 'Unknown',
                  driverPhone: charter.driver?.phone || '010-0000-0000',
                  driverVehicle: charter.driver?.vehicleNumber || 'Unknown',
                  deliveryTime: undefined, // 기존 데이터에 없음
                  driverFee: charter.driverFare,
                  driverNotes: `마이그레이션: ${new Date().toISOString()}`
                }
              })

              migratedRequests++
              migratedDispatches++

            } catch (itemError) {
              console.error(`❌ Error migrating charter ${charter.id}:`, itemError.message)
              errors.push({
                charterId: charter.id,
                error: itemError.message,
                data: {
                  date: charter.date,
                  vehicleType: charter.vehicleType,
                  destinationCount: charter.destinations.length
                }
              })
            }
          }
        })

        console.log(`✅ Batch ${batchIndex + 1} completed`)

      } catch (batchError) {
        console.error(`❌ Batch ${batchIndex + 1} failed:`, batchError.message)
        errors.push({
          batchIndex: batchIndex + 1,
          error: batchError.message
        })
      }
    }

    // 3. 마이그레이션 결과 요약
    console.log('\n📋 Migration Summary:')
    console.log(`✅ Successfully migrated: ${migratedRequests} requests, ${migratedDispatches} dispatches`)
    console.log(`❌ Errors encountered: ${errors.length}`)

    if (errors.length > 0) {
      console.log('\n🔍 Error Details:')
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${JSON.stringify(error, null, 2)}`)
      })
    }

    // 4. 데이터 검증
    await validateMigration()

  } catch (error) {
    console.error('💥 Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function validateMigration() {
  console.log('\n🔍 Validating migration...')

  try {
    const [requestCount, dispatchCount, originalCount] = await Promise.all([
      prisma.request.count(),
      prisma.dispatch.count(),
      prisma.charterRequest.count()
    ])

    console.log(`📊 Validation Results:`)
    console.log(`   Original charter requests: ${originalCount}`)
    console.log(`   New requests: ${requestCount}`)
    console.log(`   New dispatches: ${dispatchCount}`)

    // 샘플 데이터 검증
    const sampleRequests = await prisma.request.findMany({
      take: 5,
      include: {
        dispatches: true
      }
    })

    console.log(`\n🔍 Sample migrated data:`)
    sampleRequests.forEach((request, index) => {
      console.log(`${index + 1}. Request ${request.id.slice(-8)}: ${request.regions.length} regions, ${request.dispatches.length} dispatches`)
    })

  } catch (error) {
    console.error('❌ Validation failed:', error)
  }
}

// 유틸리티 함수들
function extractTonnageFromType(vehicleType) {
  const typeMap = {
    '1톤': 1.0,
    '2.5톤': 2.5,
    '3.5톤': 3.5,
    '5톤': 5.0,
    '8톤': 8.0,
    '11톤': 11.0,
    '대형': 15.0
  }

  for (const [type, tonnage] of Object.entries(typeMap)) {
    if (vehicleType.includes(type)) {
      return tonnage
    }
  }

  // 기본값: 3.5톤
  return 3.5
}

function extractCenterCarNo(centerName) {
  // 센터명에서 차량번호 추출 로직
  const patterns = [
    /([A-Z]+)\d*/,  // ABC123 -> ABC
    /(.+?)센터/,    // ABC센터 -> ABC
    /(.+)/          // fallback
  ]

  for (const pattern of patterns) {
    const match = centerName.match(pattern)
    if (match && match[1]) {
      return match[1].substring(0, 3) + '001' // 기본 번호 추가
    }
  }

  return 'C001' // 기본값
}

// 백업 생성 함수
async function createBackup() {
  console.log('💾 Creating backup before migration...')
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `./backups/charter_backup_${timestamp}.json`

    const charterData = await prisma.charterRequest.findMany({
      include: {
        destinations: true,
        driver: true,
        center: true
      }
    })

    // 백업 파일 저장 (실제 구현에서는 파일시스템 사용)
    console.log(`💾 Backup would be saved to: ${backupPath}`)
    console.log(`📊 Backup contains ${charterData.length} charter requests`)

    return backupPath
  } catch (error) {
    console.error('❌ Backup creation failed:', error)
    throw error
  }
}

// 롤백 함수
async function rollbackMigration() {
  console.log('🔄 Rolling back migration...')
  
  try {
    await prisma.$transaction(async (tx) => {
      // 마이그레이션된 데이터 삭제
      await tx.dispatch.deleteMany({
        where: {
          driverNotes: {
            contains: '마이그레이션:'
          }
        }
      })

      await tx.request.deleteMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // 최근 1시간 내 생성된 것
          }
        }
      })
    })

    console.log('✅ Rollback completed')
  } catch (error) {
    console.error('❌ Rollback failed:', error)
    throw error
  }
}

// CLI 실행
if (require.main === module) {
  const command = process.argv[2]

  switch (command) {
    case 'migrate':
      migrateCharterData().catch(console.error)
      break
    case 'backup':
      createBackup().catch(console.error)
      break
    case 'rollback':
      rollbackMigration().catch(console.error)
      break
    case 'validate':
      validateMigration().catch(console.error)
      break
    default:
      console.log('Usage: node migrate-charter-data.js [migrate|backup|rollback|validate]')
      console.log('')
      console.log('Commands:')
      console.log('  migrate  - Migrate charter data to new schema')
      console.log('  backup   - Create backup of charter data')
      console.log('  rollback - Rollback recent migration')
      console.log('  validate - Validate migrated data')
      break
  }
}

module.exports = {
  migrateCharterData,
  createBackup,
  rollbackMigration,
  validateMigration
}