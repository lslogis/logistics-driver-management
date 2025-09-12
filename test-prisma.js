const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('Prisma client:', !!prisma);
console.log('loadingPoint model:', !!prisma.loadingPoint);
console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));

process.exit(0);