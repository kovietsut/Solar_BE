import { PrismaClient } from '@prisma/client';
import { testContainersManager } from './testcontainers.config';

export const testDatabaseConfig = {
  database: process.env.TEST_DATABASE_URL || 'testcontainer://mysql',
};

export const createTestPrismaClient = async (): Promise<PrismaClient> => {
  // Start the test container if not already running
  await testContainersManager.startContainer();

  // Return the Prisma client from the test container
  return testContainersManager.getPrismaClient();
};

export const getTestDatabaseUrl = async (): Promise<string> => {
  // Start the test container if not already running
  await testContainersManager.startContainer();

  // Return the database URL from the test container
  return testContainersManager.getDatabaseUrl();
};

export const cleanupTestDatabase = async (): Promise<void> => {
  await testContainersManager.stopContainer();
};
