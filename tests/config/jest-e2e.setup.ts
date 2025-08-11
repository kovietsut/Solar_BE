import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { testContainersManager } from './testcontainers.config';
import { JwtAuthGuard } from '../../src/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '../../src/infrastructure/guards/role.guard';

export let app: INestApplication;

beforeAll(async () => {
  // Start the test container before creating the app
  console.log('Starting test container for E2E tests...');
  try {
    await testContainersManager.startContainer();
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

  app = moduleRef.createNestApplication();
  await app.init();

  console.log('E2E test application started successfully');
}, 6000);

afterAll(async () => {
  if (app) {
    await app.close();
  }

  // Stop the test container after all tests
  console.log('Stopping test container...');
  try {
    await testContainersManager.stopContainer();
  } catch (error) {
    console.error('Error stopping test container:', error);
  }
}, 6000);
