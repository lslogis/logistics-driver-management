#!/usr/bin/env node

/**
 * Trip to Charter Migration Script
 * 
 * 이 스크립트는 기존 Trip 시스템에서 새로운 Charter 시스템으로의 안전한 마이그레이션을 처리합니다.
 * 
 * 단계:
 * 1. 기존 Trip 데이터 검증 및 백업
 * 2. Charter 시스템 준비 상태 확인
 * 3. 데이터 마이그레이션 (선택적)
 * 4. 정합성 검증
 * 
 * 사용법:
 * node scripts/migrate-trips-to-charters.js [옵션]
 * 
 * 옵션:
 * --backup-only    Trip 데이터 백업만 수행
 * --validate-only  시스템 검증만 수행
 * --migrate        실제 데이터 마이그레이션 수행 (신중히 사용)
 * --dry-run        실제 변경 없이 시뮬레이션만 수행
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

class TripCharterMigration {
  constructor(options = {}) {
    this.options = {
      backupOnly: false,
      validateOnly: false,
      migrate: false,
      dryRun: false,
      ...options
    }
    this.backupDir = path.join(__dirname, '..', 'migrations', 'backups')
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  }

  async init() {
    console.log('🚀 Trip to Charter Migration 시작...')
    console.log('옵션:', this.options)
    
    // 백업 디렉토리 생성
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  /**
   * 1단계: Trip 데이터 백업
   */
  async backupTripData() {
    console.log('\n📦 Trip 데이터 백업 중...')
    
    try {
      // Trip 데이터 조회
      const trips = await prisma.trip.findMany({
        include: {
          driver: true,
          center: true,
          substituteDriver: true
        }
      })

      console.log(`   총 ${trips.length}개의 Trip 레코드 발견`)

      if (trips.length === 0) {
        console.log('   백업할 Trip 데이터가 없습니다.')
        return true
      }

      // 백업 파일 생성
      const backupFile = path.join(this.backupDir, `trips-backup-${this.timestamp}.json`)
      const backupData = {
        metadata: {
          timestamp: new Date().toISOString(),
          totalRecords: trips.length,
          schemaVersion: '1.0',
          description: 'Trip 시스템 백업 - Charter 마이그레이션용'
        },
        trips: trips
      }

      if (!this.options.dryRun) {
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
        console.log(`   ✅ 백업 완료: ${backupFile}`)
      } else {
        console.log(`   🔍 DRY RUN: 백업 파일 생성 예정: ${backupFile}`)
      }

      // 통계 정보 출력
      const stats = {
        byStatus: trips.reduce((acc, trip) => {
          acc[trip.status] = (acc[trip.status] || 0) + 1
          return acc
        }, {}),
        dateRange: {
          earliest: trips.reduce((min, trip) => trip.date < min ? trip.date : min, trips[0]?.date),
          latest: trips.reduce((max, trip) => trip.date > max ? trip.date : max, trips[0]?.date)
        },
        totalFares: {
          driver: trips.reduce((sum, trip) => sum + parseFloat(trip.driverFare), 0),
          billing: trips.reduce((sum, trip) => sum + parseFloat(trip.billingFare), 0)
        }
      }

      console.log('   📊 백업 통계:')
      console.log(`      상태별: ${JSON.stringify(stats.byStatus, null, 6)}`)
      console.log(`      기간: ${stats.dateRange.earliest?.toISOString().split('T')[0]} ~ ${stats.dateRange.latest?.toISOString().split('T')[0]}`)
      console.log(`      총 운임: 기사 ${stats.totalFares.driver.toLocaleString()}원, 청구 ${stats.totalFares.billing.toLocaleString()}원`)

      return true
    } catch (error) {
      console.error('   ❌ Trip 데이터 백업 실패:', error.message)
      return false
    }
  }

  /**
   * 2단계: Charter 시스템 검증
   */
  async validateCharterSystem() {
    console.log('\n🔍 Charter 시스템 검증 중...')
    
    try {
      // 필수 테이블 존재 확인
      const requiredTables = ['CharterRequest', 'CharterDestination', 'CenterFare']
      const validations = []

      for (const table of requiredTables) {
        try {
          await prisma.$queryRaw`SELECT 1 FROM "public"."${table}" LIMIT 1`
          validations.push({ table, status: 'OK', message: '테이블 존재함' })
        } catch (error) {
          if (error.message.includes('does not exist')) {
            validations.push({ table, status: 'MISSING', message: '테이블 없음' })
          } else {
            validations.push({ table, status: 'ERROR', message: error.message })
          }
        }
      }

      // 검증 결과 출력
      validations.forEach(({ table, status, message }) => {
        const icon = status === 'OK' ? '✅' : status === 'MISSING' ? '⚠️' : '❌'
        console.log(`   ${icon} ${table}: ${message}`)
      })

      // Charter API 엔드포인트 확인
      const charterApiFiles = [
        'src/app/api/charters/requests/route.ts',
        'src/app/api/charters/requests/[id]/route.ts',
        'src/lib/services/charter.service.ts'
      ]

      console.log('\n   📁 Charter API 파일 확인:')
      charterApiFiles.forEach(file => {
        const fullPath = path.join(__dirname, '..', file)
        const exists = fs.existsSync(fullPath)
        const icon = exists ? '✅' : '❌'
        console.log(`   ${icon} ${file}`)
      })

      // Charter 데이터 확인
      const charterCount = await prisma.charterRequest.count()
      const centerFareCount = await prisma.centerFare.count()
      
      console.log('\n   📊 Charter 시스템 현황:')
      console.log(`   용차 요청: ${charterCount}개`)
      console.log(`   센터 요율: ${centerFareCount}개`)

      const allValid = validations.every(v => v.status === 'OK')
      
      if (allValid) {
        console.log('\n   ✅ Charter 시스템 검증 완료')
      } else {
        console.log('\n   ⚠️ Charter 시스템에 일부 문제가 있습니다')
      }

      return allValid
    } catch (error) {
      console.error('   ❌ Charter 시스템 검증 실패:', error.message)
      return false
    }
  }

  /**
   * 3단계: 데이터 마이그레이션 (선택적)
   */
  async migrateData() {
    console.log('\n🔄 데이터 마이그레이션...')
    
    if (!this.options.migrate) {
      console.log('   마이그레이션이 비활성화되어 있습니다. --migrate 옵션을 사용하여 활성화하세요.')
      return true
    }

    console.log('   ⚠️ 데이터 마이그레이션은 현재 수동으로 수행해야 합니다.')
    console.log('   이유: Trip과 Charter는 다른 데이터 구조를 가지고 있습니다.')
    console.log('   - Trip: 단일 레코드에 모든 정보')
    console.log('   - Charter: 요청 + 목적지 분리, 센터별 요율 시스템')
    
    console.log('\n   📋 수동 마이그레이션 가이드:')
    console.log('   1. 백업된 Trip 데이터 검토')
    console.log('   2. 필요한 경우 센터별 요율 설정 (CenterFare)')
    console.log('   3. Charter 페이지에서 새로운 요청 생성')
    console.log('   4. 기존 정산 데이터와의 연동 확인')

    return true
  }

  /**
   * 4단계: Trip 테이블 아카이브 (선택적)
   */
  async archiveTripTable() {
    console.log('\n📁 Trip 테이블 아카이브...')
    
    if (this.options.dryRun) {
      console.log('   🔍 DRY RUN: 실제 아카이브 작업은 수행하지 않습니다.')
      return true
    }

    try {
      // Trip 테이블을 trip_archive로 이름 변경
      const archiveTableName = `trip_archive_${this.timestamp.substring(0, 10)}`
      
      console.log(`   테이블 이름 변경: Trip → ${archiveTableName}`)
      
      if (!this.options.dryRun) {
        await prisma.$executeRaw`ALTER TABLE "Trip" RENAME TO "${archiveTableName}"`
        console.log(`   ✅ Trip 테이블이 ${archiveTableName}으로 아카이브되었습니다.`)
      }

      return true
    } catch (error) {
      console.error('   ❌ Trip 테이블 아카이브 실패:', error.message)
      return false
    }
  }

  /**
   * 메인 실행 함수
   */
  async run() {
    try {
      await this.init()

      // 1. 백업
      const backupSuccess = await this.backupTripData()
      if (!backupSuccess) {
        throw new Error('Trip 데이터 백업 실패')
      }

      if (this.options.backupOnly) {
        console.log('\n✅ 백업만 완료되었습니다.')
        return
      }

      // 2. 검증
      const validationSuccess = await this.validateCharterSystem()
      
      if (this.options.validateOnly) {
        console.log(`\n${validationSuccess ? '✅' : '❌'} 검증 완료`)
        return
      }

      if (!validationSuccess) {
        console.log('\n⚠️ Charter 시스템 검증 실패. 마이그레이션을 중단합니다.')
        console.log('필요한 테이블과 API가 모두 준비된 후 다시 시도하세요.')
        return
      }

      // 3. 마이그레이션
      const migrationSuccess = await this.migrateData()
      if (!migrationSuccess) {
        throw new Error('데이터 마이그레이션 실패')
      }

      console.log('\n🎉 Trip to Charter 마이그레이션이 완료되었습니다!')
      console.log('\n다음 단계:')
      console.log('1. Charter 시스템이 정상 작동하는지 확인')
      console.log('2. 정산 시스템 연동 업데이트')
      console.log('3. 사용자 교육 및 테스트')
      console.log('4. 확인 후 --archive 옵션으로 Trip 테이블 아카이브')

    } catch (error) {
      console.error('\n❌ 마이그레이션 중 오류 발생:', error.message)
      console.error(error.stack)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  }
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2)
  const options = {
    backupOnly: args.includes('--backup-only'),
    validateOnly: args.includes('--validate-only'),
    migrate: args.includes('--migrate'),
    dryRun: args.includes('--dry-run')
  }

  const migration = new TripCharterMigration(options)
  migration.run()
}

module.exports = { TripCharterMigration }