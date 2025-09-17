const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createLoadingPoint() {
  try {
    const loadingPoint = await prisma.loadingPoint.create({
      data: {
        centerName: '서울센터',
        loadingPointName: '강남상차지',
        lotAddress: '서울특별시 강남구 역삼동 123-45',
        roadAddress: '서울특별시 강남구 테헤란로 123',
        manager1: '김관리',
        phone1: '010-1234-5678',
        remarks: '테스트용 상차지',
        isActive: true
      }
    });
    
    console.log('Created loading point:', loadingPoint);
    return loadingPoint;
  } catch (error) {
    console.error('Error creating loading point:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLoadingPoint();