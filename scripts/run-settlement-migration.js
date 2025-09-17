#!/usr/bin/env node

/**
 * Settlement Charter Support Migration Runner
 * 
 * 이 스크립트는 Settlement 시스템이 Charter를 지원하도록 데이터베이스를 업데이트합니다.
 * Trip과 Charter 모두를 지원하는 하이브리드 시스템을 구축합니다.
 * 
 * 사용법:
 * node scripts/run-settlement-migration.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function runSettlementMigration() {
  try {
    console.log('🚀 Settlement Charter Support 마이그레이션 시작...')
    
    // 마이그레이션 파일 읽기
    const migrationPath = path.join(__dirname, '..', 'migrations', '20241215_settlement_charter_support.sql')
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error('마이그레이션 파일을 찾을 수 없습니다: ' + migrationPath)
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📝 마이그레이션 SQL 로드 완료')
    
    // 현재 상태 확인
    console.log('\n📊 현재 Settlement 시스템 상태 확인...')
    
    try {
      const settlementCount = await prisma.settlement.count()
      const settlementItemCount = await prisma.settlementItem.count()
      
      console.log(`   기존 정산: ${settlementCount}개`)
      console.log(`   기존 정산 항목: ${settlementItemCount}개`)
      
      // Trip 기반 정산 항목 수
      const tripBasedItems = await prisma.settlementItem.count({
        where: {
          tripId: {
            not: null
          }
        }
      })
      
      console.log(`   Trip 기반 항목: ${tripBasedItems}개`)
      
    } catch (error) {
      console.log('   정산 데이터 확인 중 오류 (무시 가능):', error.message)
    }
    
    // 트랜잭션으로 마이그레이션 실행
    console.log('\n⚡ 마이그레이션 실행 중...')
    
    await prisma.$transaction(async (tx) => {
      // SQL을 세미콜론으로 분할하여 개별 실행
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      console.log(`   ${statements.length}개의 SQL 구문 실행 예정`)
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.trim()) {
          try {
            // DO 블록은 별도 처리
            if (statement.includes('DO $$')) {
              // DO 블록 전체를 하나의 구문으로 실행
              const doBlockEnd = statements.slice(i).findIndex(s => s.includes('END $$'))
              if (doBlockEnd !== -1) {
                const fullDoBlock = statements.slice(i, i + doBlockEnd + 1).join(';') + ';'
                await tx.$executeRawUnsafe(fullDoBlock)
                console.log(`   ✅ DO 블록 실행 완료`)
                i += doBlockEnd // Skip processed statements
                continue
              }
            }
            
            await tx.$executeRawUnsafe(statement)
            console.log(`   ✅ 구문 ${i + 1}/${statements.length} 완료`)
          } catch (error) {
            // 이미 존재하는 컬럼/인덱스 오류는 무시
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate key') ||
                error.message.includes('column') && error.message.includes('already exists')) {
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
    
    // 마이그레이션 후 상태 확인
    console.log('\n📊 마이그레이션 후 Settlement 시스템 상태...')
    
    try {
      // charterId 컬럼 확인
      const result = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'settlement_items' 
        AND column_name = 'charterId'
      `
      
      if (result.length > 0) {
        console.log('   ✅ charterId 컬럼 추가됨')
      }
      
      // totalCharters 컬럼 확인
      const result2 = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'settlements' 
        AND column_name = 'totalCharters'
      `
      
      if (result2.length > 0) {
        console.log('   ✅ totalCharters 컬럼 추가됨')
      }
      
      // 뷰 확인
      const result3 = await prisma.$queryRaw`
        SELECT viewname 
        FROM pg_views 
        WHERE viewname = 'settlement_combined_view'
        AND schemaname = 'public'
      `
      
      if (result3.length > 0) {
        console.log('   ✅ settlement_combined_view 뷰 생성됨')
      }
      
    } catch (error) {
      console.log('   ⚠️ 상태 확인 중 오류 (무시 가능):', error.message)
    }
    
    console.log('\n🎉 Settlement Charter Support 마이그레이션이 성공적으로 완료되었습니다!')
    console.log('\n다음 단계:')
    console.log('1. Prisma 스키마 업데이트 (charterId 필드 추가)')
    console.log('2. prisma generate 실행')
    console.log('3. Charter 기반 정산 테스트')
    console.log('4. 기존 Trip 기반 정산과의 호환성 확인')
    
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
  runSettlementMigration()
}

module.exports = { runSettlementMigration }