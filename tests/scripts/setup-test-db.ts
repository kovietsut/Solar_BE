import { PrismaClient } from '@prisma/client';
import { testDatabaseConfig } from '../config/test-database.config';
import * as path from 'path';

async function setupTestDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: testDatabaseConfig.database,
      },
    },
  });

  try {
    // Create test database if it doesn't exist
    const dbName = process.env.DATABASE_TEST_NAME;
    if (!dbName) {
      throw new Error('DATABASE_TEST_NAME environment variable is not set');
    }

    const baseUrl = `mysql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}`;

    const tempPrisma = new PrismaClient({
      datasources: {
        db: {
          url: baseUrl,
        },
      },
    });

    console.log('Creating test database...');
    await tempPrisma.$executeRawUnsafe(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\``,
    );
    await tempPrisma.$disconnect();

    // Run migrations on test database
    console.log('Running migrations on test database...');
    const { execSync } = require('child_process');
    const schemaPath = path.join(
      __dirname,
      '../../src/domain/migrations/schema.prisma',
    );
    execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseConfig.database,
      },
    });

    console.log('Test database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestDatabase();
