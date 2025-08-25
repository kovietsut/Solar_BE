import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { testContainersManager } from './testcontainers.config';
import { JwtAuthGuard } from '../../src/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '../../src/infrastructure/guards/role.guard';

// Create a global variable to store the app instance
declare global {
  interface globalThis {
    __TEST_APP__?: INestApplication;
  }
}

beforeAll(async () => {
  // Set test environment variables
  process.env.ENCRYPTION_KEY =
    'fbf6dee429a8b0f61fe5cb1c306dc97e0e07fa959544940e24d0b83b30cd99e9';
  process.env.JWT_SECRET = 'test-jwt-secret-for-e2e-tests-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-e2e-tests-only';

  // Start the test container before creating the app
  console.log('Starting test container for E2E tests...');
  try {
    const containerConfig = await testContainersManager.startContainer();

    // Set the DATABASE_URL environment variable to point to the test container
    process.env.DATABASE_URL = containerConfig.databaseUrl;

    console.log('Test database URL set to:', containerConfig.databaseUrl);
  } catch (error) {
    console.error('Failed to start test container:', error);
    console.log(
      'Docker not available - attempting to use local database for testing...',
    );

    // Try to use local test database configuration
    const testDbConfig = {
      host: process.env.DATABASE_TEST_HOST,
      port: process.env.DATABASE_TEST_PORT,
      username: process.env.DATABASE_TEST_USERNAME,
      password: process.env.DATABASE_TEST_PASSWORD,
      database: process.env.DATABASE_TEST_NAME,
    };

    // Check if all required test database fields are provided
    if (
      testDbConfig.host &&
      testDbConfig.port &&
      testDbConfig.username &&
      testDbConfig.password &&
      testDbConfig.database
    ) {
      const testDatabaseUrl = `mysql://${testDbConfig.username}:${testDbConfig.password}@${testDbConfig.host}:${testDbConfig.port}/${testDbConfig.database}?ssl=false&authPlugin=mysql_native_password&allowPublicKeyRetrieval=true`;
      console.log('Using local test database configuration');
      console.log(
        `Test database: ${testDbConfig.host}:${testDbConfig.port}/${testDbConfig.database}`,
      );
      process.env.DATABASE_URL = testDatabaseUrl;
    } else {
      console.log(
        'No test database configuration found. Please set up test database environment variables or install Docker.',
      );
      console.log(
        'Required environment variables:\n' +
          '  - DATABASE_TEST_HOST\n' +
          '  - DATABASE_TEST_PORT\n' +
          '  - DATABASE_TEST_USERNAME\n' +
          '  - DATABASE_TEST_PASSWORD\n' +
          '  - DATABASE_TEST_NAME',
      );
      throw new Error(
        'No test database available. Please either:\n' +
          '1. Install Docker for testcontainers, or\n' +
          '2. Set the DATABASE_TEST_* environment variables for your test database',
      );
    }
  }

  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RoleGuard)
    .useValue({ canActivate: () => true });

  const moduleRef = await moduleBuilder.compile();

  const app = moduleRef.createNestApplication();

  // Apply validation pipe to match the main application
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  // Store the app instance globally so it can be accessed by test files
  globalThis.__TEST_APP__ = app;

  console.log('E2E test application started successfully');
}, 60000); // Increased timeout to 60 seconds

afterAll(async () => {
  if (globalThis.__TEST_APP__) {
    await globalThis.__TEST_APP__.close();
    globalThis.__TEST_APP__ = undefined;
  }

  // Stop the test container after all tests
  console.log('Stopping test container...');
  try {
    await testContainersManager.stopContainer();
  } catch (error) {
    console.error('Error stopping test container:', error);
  }
}, 60000); // Increased timeout to 60 seconds

// Export a function to get the app instance
export function getTestApp(): INestApplication {
  if (!globalThis.__TEST_APP__) {
    throw new Error(
      'Test application not initialized. Make sure to run tests with --runInBand or ensure proper setup.',
    );
  }
  return globalThis.__TEST_APP__;
}
