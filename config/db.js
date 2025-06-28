const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const connectDb = async () => {
  try {
    await prisma.$connect();
    console.log('Prisma connected to database');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};

module.exports = { prisma, connectDb };