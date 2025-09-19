const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createUsers() {
  const prisma = new PrismaClient();
  
  try {
    // 기존 사용자 삭제
    await prisma.user.deleteMany();
    
    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // 새 사용자들 생성 (Prisma가 자동으로 CUID 생성)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@logistics.com',
        name: '관리자',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    });
    
    const dispatcher = await prisma.user.create({
      data: {
        email: 'dispatcher@logistics.com', 
        name: '배차담당자',
        password: hashedPassword,
        role: 'DISPATCHER',
        isActive: true
      }
    });
    
    const accountant = await prisma.user.create({
      data: {
        email: 'accountant@logistics.com',
        name: '회계담당자', 
        password: hashedPassword,
        role: 'ACCOUNTANT',
        isActive: true
      }
    });
    
    console.log('실제 CUID로 생성된 사용자들:');
    console.log('Admin ID:', admin.id, '(길이:', admin.id.length, ')');
    console.log('Dispatcher ID:', dispatcher.id, '(길이:', dispatcher.id.length, ')');
    console.log('Accountant ID:', accountant.id, '(길이:', accountant.id.length, ')');
    
    console.log('\nCUID 형식 확인:');
    console.log('- 모두 "c"로 시작하는가?', [admin.id, dispatcher.id, accountant.id].every(id => id.startsWith('c')));
    console.log('- 길이가 25자인가?', [admin.id, dispatcher.id, accountant.id].every(id => id.length === 25));
    
  } finally {
    await prisma.$disconnect();
  }
}

createUsers().catch(console.error);