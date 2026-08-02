import { PrismaClient } from '@prisma/client';

export let isDbConnected = false;

export function setDbConnected(status: boolean) {
  isDbConnected = status;
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
});
