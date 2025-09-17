#!/usr/bin/env node

/**
 * 용차 관리 시스템 마이그레이션 실행 스크립트
 * 
 * 사용법:
 * node scripts/run-charter-migration.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function runMigration() {
  try {
    console.log('🚀 용차 관리 시스템 마이그레이션 시작...')
    
    // 마이그레이션 파일 읽기
    const migrationPath = path.join(__dirname, '..', 'migrations', '20241115_add_charter_management.sql')
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error('마이그레이션 파일을 찾을 수 없습니다: ' + migrationPath)
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📝 마이그레이션 SQL 로드 완료')
    
    // 트랜잭션으로 마이그레이션 실행
    await prisma.$transaction(async (tx) => {
      // SQL을 세미콜론으로 분할하여 개별 실행
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      console.log(`⚡ ${statements.length}개의 SQL 구문 실행 중...`)
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.trim()) {
          try {
            await tx.$executeRawUnsafe(statement)
            console.log(`   ✅ 구문 ${i + 1}/${statements.length} 완료`)
          } catch (error) {
            // 이미 존재하는 테이블/인덱스 오류는 무시
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate key') ||
                error.message.includes('relation') && error.message.includes('already exists')) {
              console.log(`   ⚠️ 구문 ${i + 1}/${statements.length} 건너뜀 (이미 존재)`)
            } else {
              console.error(`   ❌ 구문 ${i + 1}/${statements.length} 실패:`, error.message)
              throw error
            }
          }
        }
      }
    })
    
    console.log('✅ 마이그레이션 완료!')
    
    // 새 테이블 확인
    console.log('\n📊 생성된 테이블 확인...')
    
    try {
      const centerFareCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "CenterFare"`
      console.log(`   CenterFare 테이블: ${centerFareCount[0].count}개 레코드`)
      
      const charterRequestCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "CharterRequest"`
      console.log(`   CharterRequest 테이블: ${charterRequestCount[0].count}개 레코드`)
      
      const charterDestinationCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "CharterDestination"`
      console.log(`   CharterDestination 테이블: ${charterDestinationCount[0].count}개 레코드`)
      
    } catch (error) {
      console.log('   ⚠️ 테이블 확인 중 오류:', error.message)
    }
    
    console.log('\n🎉 용차 관리 시스템이 성공적으로 설정되었습니다!')
    
  } catch (error) {
    console.error('❌ 마이그레이션 실행 중 오류 발생:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  runMigration()
}

module.exports = { runMigration }