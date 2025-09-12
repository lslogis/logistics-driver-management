const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🔍 Prisma Client 객체 확인:');
console.log('- prisma 타입:', typeof prisma);
console.log('- prisma 생성자:', prisma.constructor.name);

console.log('\n🔍 사용 가능한 모델들:');
const models = Object.keys(prisma).filter(key => 
  typeof prisma[key] === 'object' && 
  prisma[key] !== null &&
  typeof prisma[key].findMany === 'function'
);

console.log('- 모델 목록:', models);

console.log('\n🔍 특정 모델 확인:');
console.log('- prisma.fixedRoute:', typeof prisma.fixedRoute, !!prisma.fixedRoute);
console.log('- prisma.FixedRoute:', typeof prisma.FixedRoute, !!prisma.FixedRoute);
console.log('- prisma.routeTemplate:', typeof prisma.routeTemplate, !!prisma.routeTemplate);
console.log('- prisma.loadingPoint:', typeof prisma.loadingPoint, !!prisma.loadingPoint);

if (prisma.fixedRoute) {
  console.log('\n🔍 fixedRoute 모델 메소드:');
  console.log('- findMany:', typeof prisma.fixedRoute.findMany);
  console.log('- count:', typeof prisma.fixedRoute.count);
  console.log('- create:', typeof prisma.fixedRoute.create);
}

prisma.$disconnect();