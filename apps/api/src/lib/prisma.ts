import { PrismaClient } from '@prisma/client';

// Singleton so hot-reload (tsx watch) doesn't spawn new clients each reload.
declare global {
  // eslint-disable-next-line no-var
  var __carelinkPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__carelinkPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__carelinkPrisma = prisma;
}
