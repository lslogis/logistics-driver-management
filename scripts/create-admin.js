const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@logistics.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@logistics.com',
        name: '관리자',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });
    
    console.log('Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('Role:', admin.role);
    
    // Create additional users if needed
    const dispatcher = await prisma.user.create({
      data: {
        email: 'dispatcher@logistics.com',
        name: '배차담당자',
        password: await bcrypt.hash('dispatcher123', 10),
        role: 'DISPATCHER',
        isActive: true,
      },
    });
    
    console.log('\nDispatcher user created:');
    console.log('Email:', dispatcher.email);
    console.log('Password: dispatcher123');
    
    const accountant = await prisma.user.create({
      data: {
        email: 'accountant@logistics.com',
        name: '회계담당자',
        password: await bcrypt.hash('accountant123', 10),
        role: 'ACCOUNTANT',
        isActive: true,
      },
    });
    
    console.log('\nAccountant user created:');
    console.log('Email:', accountant.email);
    console.log('Password: accountant123');
    
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();