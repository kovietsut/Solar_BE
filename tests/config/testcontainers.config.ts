import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { PrismaClient } from '@prisma/client';

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
    const maxRetries = 15;

    // Add initial delay to ensure container is fully ready
    await new Promise((resolve) => setTimeout(resolve, 5000));

    while (retries < maxRetries) {
      try {
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
          `Connection test failed (attempt ${retries}/${maxRetries}), waiting 2 seconds...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
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

    // Push schema to the test container using Prisma client
    console.log('Pushing schema to test container...');

    try {
      // Execute raw SQL to create tables based on our schema
      await this.prismaClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS roles (
          id VARCHAR(191) NOT NULL,
          createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) NULL,
          createdBy VARCHAR(191) NULL,
          updatedBy VARCHAR(191) NULL,
          isDeleted BOOLEAN NOT NULL DEFAULT false,
          name VARCHAR(191) NOT NULL,
          PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      `;

      await this.prismaClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(191) NOT NULL,
          createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) NULL,
          createdBy VARCHAR(191) NULL,
          updatedBy VARCHAR(191) NULL,
          isDeleted BOOLEAN NOT NULL DEFAULT false,
          roleId VARCHAR(191) NOT NULL,
          phoneNumber VARCHAR(191) NOT NULL,
          passwordHash VARCHAR(191) NOT NULL,
          securityStamp VARCHAR(191) NOT NULL,
          email VARCHAR(191) NOT NULL,
          name VARCHAR(191) NOT NULL,
          avatarPath VARCHAR(191) NULL,
          address VARCHAR(191) NULL,
          PRIMARY KEY (id),
          UNIQUE KEY users_email_key (email),
          FOREIGN KEY (roleId) REFERENCES roles(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      `;

      await this.prismaClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS auth_methods (
          id VARCHAR(191) NOT NULL,
          createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) NULL,
          createdBy VARCHAR(191) NULL,
          updatedBy VARCHAR(191) NULL,
          isDeleted BOOLEAN NOT NULL DEFAULT false,
          userId VARCHAR(191) NOT NULL,
          authType VARCHAR(191) NOT NULL,
          authId VARCHAR(191) NOT NULL,
          accessToken TEXT NULL,
          refreshToken TEXT NULL,
          jwtId VARCHAR(191) NULL,
          isRevoked BOOLEAN NOT NULL DEFAULT false,
          accessTokenExpiration DATETIME(3) NULL,
          refreshTokenExpiration DATETIME(3) NULL,
          deviceId VARCHAR(191) NOT NULL,
          deviceType VARCHAR(191) NOT NULL,
          platform VARCHAR(191) NOT NULL,
          deviceName VARCHAR(191) NULL,
          PRIMARY KEY (id),
          FOREIGN KEY (userId) REFERENCES users(id),
          INDEX auth_methods_userId_idx (userId),
          INDEX auth_methods_deviceId_idx (deviceId)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      `;

      console.log('Schema creation completed successfully!');
    } catch (error) {
      console.error('Error creating schema:', error);
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
      try {
        await this.prismaClient.$disconnect();
      } catch (error) {
        console.error('Error disconnecting Prisma client:', error);
      }
      this.prismaClient = null;
    }

    if (this.container) {
      try {
        await this.container.stop();
      } catch (error) {
        console.error('Error stopping container:', error);
      }
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

  public isContainerRunning(): boolean {
    return this.container !== null && this.prismaClient !== null;
  }
}

export const testContainersManager = TestContainersManager.getInstance();
