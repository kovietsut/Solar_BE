import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { testContainersManager } from './testcontainers.config';
import { JwtAuthGuard } from '../../src/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '../../src/infrastructure/guards/role.guard';

// Create a global variable to store the app instance
declare global {
  // eslint-disable-next-line no-var
  var __TEST_APP__: INestApplication | undefined;
}

beforeAll(async () => {
  // Start the test container before creating the app
  console.log('Starting test container for E2E tests...');
  try {
    const containerConfig = await testContainersManager.startContainer();

    // Set the DATABASE_URL environment variable to point to the test container
    process.env.DATABASE_URL = containerConfig.databaseUrl;

    console.log('Test database URL set to:', containerConfig.databaseUrl);
  } catch (error) {
    console.error('Failed to start test container:', error);
    throw error;
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RoleGuard)
    .useValue({ canActivate: () => true })
    .compile();

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
  global.__TEST_APP__ = app;

  console.log('E2E test application started successfully');
}, 60000); // Increased timeout to 60 seconds

afterAll(async () => {
  if (global.__TEST_APP__) {
    await global.__TEST_APP__.close();
    global.__TEST_APP__ = undefined;
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
  if (!global.__TEST_APP__) {
    throw new Error(
      'Test application not initialized. Make sure to run tests with --runInBand or ensure proper setup.',
    );
  }
  return global.__TEST_APP__;
}
