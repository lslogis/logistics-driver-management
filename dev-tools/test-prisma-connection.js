const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrismaConnection() {
  try {
    console.log('🔍 Prisma 연결 테스트 시작...');
    
    // FixedRoute 모델 테스트
    console.log('📋 FixedRoute 모델 확인:', typeof prisma.fixedRoute);
    
    // 카운트 테스트
    const count = await prisma.fixedRoute.count();
    console.log('📊 FixedRoute 레코드 수:', count);
    
    // 첫 번째 레코드 조회 시도
    const firstRoute = await prisma.fixedRoute.findFirst();
    console.log('🎯 첫 번째 레코드:', firstRoute);
    
    console.log('✅ Prisma 연결 테스트 완료');
  } catch (error) {
    console.error('❌ Prisma 연결 테스트 실패:', error.message);
    console.error('스택:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();