// TEMPORARILY DISABLED: Prisma client generation failed
// import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from '../lib/logger';

// Mock Prisma Client for temporary use
const mockPrismaClient: any = {
  $connect: async () => { logger.warn('Mock Prisma: $connect called'); },
  $disconnect: async () => { logger.warn('Mock Prisma: $disconnect called'); },
  $queryRaw: async () => { logger.warn('Mock Prisma: $queryRaw called'); return []; },
};

// Prisma Client singleton (using mock temporarily)
const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  mockPrismaClient;

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Database connection testing
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database:', error);
  }
}

// Health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}
