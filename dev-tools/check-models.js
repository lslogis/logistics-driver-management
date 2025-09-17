const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const models = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$') && typeof prisma[key] === 'object');
console.log('Available models:', models);
process.exit(0);