import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

export interface TestContainerConfig {
  container: StartedTestContainer;
  databaseUrl: string;
  prismaClient: PrismaClient;
}

export class TestContainersManager {
  private static instance: TestContainersManager;
  private container: StartedTestContainer | null = null;
  private prismaClient: PrismaClient | null = null;

  private constructor() {}

  public static getInstance(): TestContainersManager {
    if (!TestContainersManager.instance) {
      TestContainersManager.instance = new TestContainersManager();
    }
    return TestContainersManager.instance;
  }

  public async startContainer(): Promise<TestContainerConfig> {
    if (this.container && this.prismaClient) {
      return {
        container: this.container,
        databaseUrl: this.getDatabaseUrl(),
        prismaClient: this.prismaClient,
      };
    }

    console.log('Starting MySQL test container...');

    this.container = await new GenericContainer('mysql:8.0')
      .withEnvironment({
        MYSQL_ROOT_PASSWORD: 'testpassword',
        MYSQL_DATABASE: 'testdb',
        MYSQL_USER: 'testuser',
        MYSQL_PASSWORD: 'testpassword',
      })
      .withExposedPorts(3306)
      .withWaitStrategy(Wait.forLogMessage('ready for connections'))
      .start();

    const databaseUrl = this.getDatabaseUrl();

    console.log('MySQL container started, waiting for it to be ready...');

    // Wait for MySQL to be fully ready and test connection
    let retries = 0;
    const maxRetries = 10;

    while (retries < maxRetries) {
      try {
        // Test connection with a simple query
        const testPrisma = new PrismaClient({
          datasources: {
            db: {
              url: databaseUrl,
            },
          },
        });

        await testPrisma.$queryRaw`SELECT 1`;
        await testPrisma.$disconnect();
        console.log('MySQL connection test successful!');
        break;
      } catch (error) {
        retries++;
        console.log(
          `Connection test failed (attempt ${retries}/${maxRetries}), waiting 3 seconds...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    if (retries >= maxRetries) {
      throw new Error(
        'Failed to establish MySQL connection after multiple attempts',
      );
    }

    // Create Prisma client with the container database
    this.prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Push schema to the test container (avoids migration conflicts)
    console.log('Pushing schema to test container...');
    const { execSync } = require('child_process');
    const schemaPath = path.join(
      __dirname,
      '../../src/domain/migrations/schema.prisma',
    );

    try {
      execSync(
        `npx prisma db push --schema "${schemaPath}" --accept-data-loss`,
        {
          env: {
            ...process.env,
            DATABASE_URL: databaseUrl,
          },
          stdio: 'inherit',
        },
      );
      console.log('Schema push completed successfully!');
    } catch (error) {
      console.error('Error pushing schema:', error);
      throw error;
    }

    return {
      container: this.container,
      databaseUrl,
      prismaClient: this.prismaClient,
    };
  }

  public async stopContainer(): Promise<void> {
    if (this.prismaClient) {
      await this.prismaClient.$disconnect();
      this.prismaClient = null;
    }

    if (this.container) {
      await this.container.stop();
      this.container = null;
    }
  }

  public getPrismaClient(): PrismaClient {
    if (!this.prismaClient) {
      throw new Error(
        'Prisma client not initialized. Call startContainer() first.',
      );
    }
    return this.prismaClient;
  }

  public getDatabaseUrl(): string {
    if (!this.container) {
      throw new Error('Container not started. Call startContainer() first.');
    }

    const host = this.container.getHost();
    const port = this.container.getMappedPort(3306);

    return `mysql://testuser:testpassword@${host}:${port}/testdb`;
  }
}

export const testContainersManager = TestContainersManager.getInstance();
