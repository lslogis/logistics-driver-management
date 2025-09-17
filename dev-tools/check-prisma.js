const { prisma } = require('./src/lib/prisma.ts');

console.log('Available models:', Object.keys(prisma).filter(key => 
  typeof prisma[key] === 'object' && 
  prisma[key] !== null && 
  typeof prisma[key].findMany === 'function'
));

console.log('Has fixedRoute:', !!prisma.fixedRoute);
console.log('All prisma keys:', Object.keys(prisma).filter(key => !key.startsWith('$')));