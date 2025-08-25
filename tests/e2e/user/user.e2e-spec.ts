import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Role } from '../../../src/domain/entities/role.entity';
import { CreateUserDto } from '../../../src/infrastructure/dtos/user/create-user.dto';
import { UpdateUserDto } from '../../../src/infrastructure/dtos/user/update-user.dto';
import { PrismaService } from '../../../src/infrastructure/repositories/prisma.service';
import { testContainersManager } from '../../config/testcontainers.config';
import { getTestApp } from '../../config/jest-e2e.setup';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let testRole: Role;

  beforeAll(async () => {
    // Get the shared app instance from the global setup
    app = getTestApp();
    prismaService = app.get<PrismaService>(PrismaService);

    // Create a test role with unique name
    const timestamp = Date.now();
    const roleName = `TestRole_${timestamp}`;

    testRole = await prismaService.role.create({
      data: {
        name: roleName,
        createdBy: null,
        updatedBy: null,
      },
    });

    // No need to create admin user since authentication is bypassed
  });

  afterAll(async () => {
    // Clean up test data in correct order (users first, then roles)
    await prismaService.user.deleteMany({
      where: {
        email: {
          contains: '@example.com',
        },
      },
    });

    if (testRole) {
      // Delete the role after all users are deleted
      await prismaService.role.delete({
        where: { id: testRole.id },
      });
    }

    // Ensure container is properly stopped
    try {
      await testContainersManager.stopContainer();
    } catch (error) {
      console.error('Error stopping test container:', error);
    }
  }, 6000);

  afterEach(async () => {
    // Clean up test users after each test
    await prismaService.user.deleteMany({
      where: {
        email: {
          contains: '@example.com',
        },
      },
    });
  });

  describe('/users (POST)', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const createUserDto: CreateUserDto = {
        email: `test-${timestamp}-${randomId}@example.com`,
        name: 'Test User',
        phoneNumber: `0123456${(timestamp % 1000).toString().padStart(3, '0')}`,
        password: 'password123',
        address: 'Test Address',
        roleId: testRole.id,
      };

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('User created successfully');
      expect(response.body.body.data).toBeDefined();
      expect(response.body.body.data.email).toBe(createUserDto.email);
      expect(response.body.body.data.name).toBe(createUserDto.name);
      expect(response.body.body.data.phoneNumber).toBe(
        createUserDto.phoneNumber,
      );
    });

    it('should return 400 for invalid email format', async () => {
      // Arrange
      const invalidUserDto = {
        email: 'invalid-email',
        name: 'Test User',
        phoneNumber: '0123456789',
        password: 'password123',
        address: 'Test Address',
        roleId: testRole.id,
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/users')
        .send(invalidUserDto)
        .expect(400);
    });

    it('should return 400 for invalid phone number format', async () => {
      // Arrange
      const timestamp = Date.now();
      const invalidUserDto = {
        email: `test-${timestamp}@example.com`,
        name: 'Test User',
        phoneNumber: '123', // Invalid phone number
        password: 'password123',
        address: 'Test Address',
        roleId: testRole.id,
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/users')
        .send(invalidUserDto)
        .expect(400);
    });

    it('should return 400 for password too short', async () => {
      // Arrange
      const timestamp = Date.now();
      const invalidUserDto = {
        email: `test-${timestamp}@example.com`,
        name: 'Test User',
        phoneNumber: '0123456789',
        password: '123', // Too short
        address: 'Test Address',
        roleId: testRole.id,
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/users')
        .send(invalidUserDto)
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    beforeEach(async () => {
      // Create test users with unique emails
      const timestamp = Date.now();
      await prismaService.user.create({
        data: {
          email: `test1-${timestamp}@example.com`,
          name: 'Test User 1',
          phoneNumber: `0123456${(timestamp % 1000).toString().padStart(3, '0')}`,
          passwordHash: 'hashed-password',
          securityStamp: 'security-stamp',
          address: 'Test Address 1',
          roleId: testRole.id,
          createdBy: null,
          updatedBy: null,
        },
      });

      await prismaService.user.create({
        data: {
          email: `test2-${timestamp}@example.com`,
          name: 'Test User 2',
          phoneNumber: `0987654${(timestamp % 1000).toString().padStart(3, '0')}`,
          passwordHash: 'hashed-password',
          securityStamp: 'security-stamp',
          address: 'Test Address 2',
          roleId: testRole.id,
          createdBy: null,
          updatedBy: null,
        },
      });
    });

    it('should return all users successfully', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('Users retrieved successfully');
      expect(response.body.body.data).toBeDefined();
      expect(response.body.body.dataCount).toBeGreaterThanOrEqual(2);

      const testUsers = response.body.body.data.filter(
        (user: any) =>
          user.email.includes('test') && user.email.includes('@example.com'),
      );
      expect(testUsers.length).toBe(2);
    });
  });

  describe('/users/paginated (GET)', () => {
    beforeEach(async () => {
      // Create multiple test users with unique emails
      const timestamp = Date.now();
      for (let i = 1; i <= 5; i++) {
        await prismaService.user.create({
          data: {
            email: `test${i}-${timestamp}@example.com`,
            name: `Test User ${i}`,
            phoneNumber: `0123456${(timestamp % 1000).toString().padStart(3, '0')}${i}`,
            passwordHash: 'hashed-password',
            securityStamp: 'security-stamp',
            address: `Test Address ${i}`,
            roleId: testRole.id,
            createdBy: null,
            updatedBy: null,
          },
        });
      }
    });

    it('should return paginated users successfully', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/users/paginated?pageNumber=1&pageSize=3')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('Users retrieved successfully');
      expect(response.body.body.data).toBeDefined();
      expect(response.body.body.dataCount).toBeGreaterThanOrEqual(5);
      expect(response.body.body.data.length).toBeLessThanOrEqual(3);
    });

    it('should apply search filter correctly', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/users/paginated?searchText=Test User')
        .expect(200);

      expect(response.body.body.data).toBeDefined();
      expect(response.body.body.data.length).toBeGreaterThanOrEqual(5);

      response.body.body.data.forEach((user: any) => {
        expect(user.name).toContain('Test User');
      });
    });

    it('should handle empty search results', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/users/paginated?searchText=NonExistentUser')
        .expect(200);

      expect(response.body.body.data).toEqual([]);
      expect(response.body.body.dataCount).toBe(0);
    });

    it('should use default pagination values', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/users/paginated')
        .expect(200);

      expect(response.body.body.data).toBeDefined();
      expect(response.body.body.dataCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('/users/:id (GET)', () => {
    let testUserId: string;
    let testUserEmail: string;

    beforeEach(async () => {
      const timestamp = Date.now();
      testUserEmail = `test-${timestamp}@example.com`;
      const user = await prismaService.user.create({
        data: {
          email: testUserEmail,
          name: 'Test User',
          phoneNumber: '0123456789',
          passwordHash: 'hashed-password',
          securityStamp: 'security-stamp',
          address: 'Test Address',
          roleId: testRole.id,
          createdBy: null,
          updatedBy: null,
        },
      });
      testUserId = user.id;
    });

    it('should return user by id successfully', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('User retrieved successfully');
      expect(response.body.body.data).toBeDefined();
      expect(response.body.body.data.id).toBe(testUserId);
      expect(response.body.body.data.email).toBe(testUserEmail);
      expect(response.body.body.data.name).toBe('Test User');
    });

    it('should return 400 for invalid UUID format', async () => {
      // Act & Assert
      await request(app.getHttpServer()).get('/users/invalid-uuid').expect(400);
    });

    it('should return 404 for non-existent user id', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // Act & Assert
      await request(app.getHttpServer())
        .get(`/users/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('/users/:id (PATCH)', () => {
    let testUserId: string;

    beforeEach(async () => {
      const timestamp = Date.now();
      const user = await prismaService.user.create({
        data: {
          email: `test-${timestamp}@example.com`,
          name: 'Test User',
          phoneNumber: `0123456${(timestamp % 1000).toString().padStart(3, '0')}`,
          passwordHash: 'hashed-password',
          securityStamp: 'security-stamp',
          address: 'Test Address',
          roleId: testRole.id,
          createdBy: null,
          updatedBy: null,
        },
      });
      testUserId = user.id;
    });

    it('should update user successfully', async () => {
      // Arrange
      const timestamp = Date.now();
      const updateUserDto: UpdateUserDto = {
        email: `updated-${timestamp}@example.com`,
        name: 'Updated Test User',
        phoneNumber: `0987654${(timestamp % 1000).toString().padStart(3, '0')}`,
        password: 'newpassword123',
        address: 'Updated Test Address',
        roleId: testRole.id,
      };

      // Act & Assert
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .send(updateUserDto)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('User updated successfully');
      expect(response.body.body.data).toBeDefined();
      expect(response.body.body.data.id).toBe(testUserId);
      expect(response.body.body.data.name).toBe('Updated Test User');
      expect(response.body.body.data.address).toBe('Updated Test Address');
      expect(response.body.body.data.email).toBe(
        `updated-${timestamp}@example.com`,
      );
    });

    it('should return 400 for invalid UUID format', async () => {
      // Arrange
      const updateUserDto: UpdateUserDto = {
        email: 'test@example.com',
        name: 'Updated Test User',
        phoneNumber: '0123456789',
        password: 'newpassword123',
        address: 'Updated Test Address',
        roleId: testRole.id,
      };

      // Act & Assert
      await request(app.getHttpServer())
        .patch('/users/invalid-uuid')
        .send(updateUserDto)
        .expect(400);
    });
  });

  describe('/users/:id (DELETE)', () => {
    let testUserId: string;

    beforeEach(async () => {
      const timestamp = Date.now();
      const user = await prismaService.user.create({
        data: {
          email: `test-${timestamp}@example.com`,
          name: 'Test User',
          phoneNumber: `0123456${(timestamp % 1000).toString().padStart(3, '0')}`,
          passwordHash: 'hashed-password',
          securityStamp: 'security-stamp',
          address: 'Test Address',
          roleId: testRole.id,
          createdBy: null,
          updatedBy: null,
        },
      });
      testUserId = user.id;
    });

    it('should delete user successfully', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .delete(`/users/${testUserId}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('User deleted successfully');
      expect(response.body.body.data).toBeDefined();
      expect(response.body.body.data.id).toBe(testUserId);

      // Check if isDeleted field exists, if not, verify the user is soft deleted by querying the database
      if (response.body.body.data.isDeleted === undefined) {
        const deletedUser = await prismaService.user.findUnique({
          where: { id: testUserId },
        });
        expect(deletedUser?.isDeleted).toBe(true);
      } else {
        expect(response.body.body.data.isDeleted).toBe(true);
      }
    });

    it('should return 400 for invalid UUID format', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .delete('/users/invalid-uuid')
        .expect(400);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should bypass authentication when guards are overridden', async () => {
      // Act & Assert
      await request(app.getHttpServer()).get('/users').expect(200);
    });

    it('should work with any authorization header when guards are overridden', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'InvalidToken')
        .expect(200);
    });
  });
});
