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
  await testContainersManager.startContainer();

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
}, 60000); // Increase timeout to 60 seconds for container startup

afterAll(async () => {
  if (app) {
    await app.close();
  }

  // Stop the test container after all tests
  console.log('Stopping test container...');
  await testContainersManager.stopContainer();
}, 30000); // Increase timeout to 30 seconds for container cleanup
