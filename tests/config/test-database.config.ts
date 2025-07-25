import { PrismaClient } from '@prisma/client';

export const testDatabaseConfig = {
  database:
    process.env.TEST_DATABASE_URL ||
    `mysql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_TEST_NAME}`,
};

export const createTestPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: testDatabaseConfig.database,
      },
    },
  });
};
