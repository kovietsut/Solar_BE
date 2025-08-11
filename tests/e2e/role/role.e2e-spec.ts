import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../../src/infrastructure/repositories/prisma.service';
import { CreateRoleDto } from '../../../src/infrastructure/dtos/role/create-role.dto';
import { UpdateRoleDto } from '../../../src/infrastructure/dtos/role/update-role.dto';
import { ROLES } from '../../../src/shared/constants/roles.constants';
import { getTestApp } from '../../config/jest-e2e.setup';

/**
 * E2E test suite for Role endpoints
 * Tests full HTTP request/response cycle through the application
 */
describe('Role E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Test data with unique names for each test run
  const timestamp = Date.now();
  const testRoleData: CreateRoleDto = {
    name: `E2ETestRole_${timestamp}`,
  };

  const testRoleData2: CreateRoleDto = {
    name: `E2ETestRole2_${timestamp}`,
  };

  // Mock JWT token for admin user (you may need to adjust this based on your auth setup)
  const mockAdminToken = 'mock-admin-jwt-token';

  beforeAll(async () => {
    // Get the shared app instance from the global setup
    app = getTestApp();
    prismaService = app.get<PrismaService>(PrismaService);

    // Clean up test data before running tests
    await prismaService.role.deleteMany({
      where: {
        name: {
          contains: `E2ETestRole_${timestamp}`,
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data after running tests
    await prismaService.role.deleteMany({
      where: {
        name: {
          contains: `E2ETestRole_${timestamp}`,
        },
      },
    });
  });

  describe('POST /roles', () => {
    it('should create a new role', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(testRoleData)
        .expect(201);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('Role created successfully');
      expect(response.body.body.data).toBeDefined();
    });

    it('should return 409 when creating role with duplicate name', async () => {
      // Arrange - Create first role
      await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(testRoleData2);

      // Act & Assert - Try to create duplicate
      await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(testRoleData2)
        .expect(409);
    });

    it('should return 200 when no authorization token provided (guards bypassed)', async () => {
      // Act & Assert - Since guards are bypassed, this should work
      const uniqueName = `NoAuthTestRole_${timestamp}_${Math.random()}`;
      await request(app.getHttpServer())
        .post('/roles')
        .send({ name: uniqueName })
        .expect(201);
    });
  });

  describe('GET /roles', () => {
    it('should return all roles', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .expect(200);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('Roles retrieved successfully');
      expect(response.body.body.data).toBeDefined();
      expect(Array.isArray(response.body.body.data)).toBe(true);
      expect(response.body.body.dataCount).toBeDefined();
    });

    it('should return 200 when no authorization token provided (guards bypassed)', async () => {
      // Act & Assert - Since guards are bypassed, this should work
      await request(app.getHttpServer()).get('/roles').expect(200);
    });
  });

  describe('GET /roles/paginated', () => {
    it('should return paginated roles with default parameters', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/roles/paginated')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .expect(200);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('List fetched successfully');
      expect(response.body.body.data).toBeDefined();
      expect(Array.isArray(response.body.body.data)).toBe(true);
      expect(response.body.body.dataCount).toBeDefined();
    });

    it('should return paginated roles with custom parameters', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/roles/paginated?pageNumber=1&pageSize=5&searchText=Test')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .expect(200);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('List fetched successfully');
      expect(response.body.body.data).toBeDefined();
      expect(Array.isArray(response.body.body.data)).toBe(true);
      expect(response.body.body.dataCount).toBeDefined();
    });

    it('should return 200 when no authorization token provided (guards bypassed)', async () => {
      // Act & Assert - Since guards are bypassed, this should work
      await request(app.getHttpServer()).get('/roles/paginated').expect(200);
    });
  });

  describe('GET /roles/:id', () => {
    it('should return a role by id', async () => {
      // Arrange - Create a role first
      const uniqueName = `GetByIdTestRole_${timestamp}_${Math.random()}`;
      const createResponse = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: uniqueName });

      const roleId = createResponse.body.body.data;

      // Act
      const response = await request(app.getHttpServer())
        .get(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .expect(200);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('Role retrieved successfully');
      expect(response.body.body.data).toBeDefined();
      expect(response.body.body.data.id).toBe(roleId);
      expect(response.body.body.data.name).toBe(uniqueName);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${mockAdminToken}`);
    });

    it('should return 404 when role does not exist', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/roles/non-existent-id')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .expect(404);
    });

    it('should return 404 when no authorization token provided (guards bypassed)', async () => {
      // Act & Assert - Since guards are bypassed, this should return 404 for non-existent role
      await request(app.getHttpServer()).get('/roles/some-id').expect(404);
    });
  });

  describe('PATCH /roles/:id', () => {
    it('should update a role', async () => {
      // Arrange - Create a role first
      const uniqueName = `UpdateTestRole_${timestamp}_${Math.random()}`;
      const createResponse = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: uniqueName });

      const roleId = createResponse.body.body.data;
      const updateData: UpdateRoleDto = {
        name: `UpdatedE2ETestRole_${timestamp}`,
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('Role updated successfully');
      expect(response.body.body.data).toBe(roleId);

      // Verify the update
      const getResponse = await request(app.getHttpServer())
        .get(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(getResponse.body.body.data.name).toBe(updateData.name);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${mockAdminToken}`);
    });

    it('should return 404 when updating non-existent role', async () => {
      // Arrange
      const updateData: UpdateRoleDto = { name: 'NonExistentRole' };

      // Act & Assert
      await request(app.getHttpServer())
        .patch('/roles/non-existent-id')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should return 409 when updating with duplicate name', async () => {
      // Arrange - Create two roles
      const uniqueName1 = `DuplicateTestRole1_${timestamp}_${Math.random()}`;
      const uniqueName2 = `DuplicateTestRole2_${timestamp}_${Math.random()}`;

      const createResponse1 = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: uniqueName1 });

      const createResponse2 = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: uniqueName2 });

      const roleId1 = createResponse1.body.body.data;
      const roleId2 = createResponse2.body.body.data;

      // Act & Assert - Try to update first role with second role's name
      await request(app.getHttpServer())
        .patch(`/roles/${roleId1}`)
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: uniqueName2 })
        .expect(409);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/roles/${roleId1}`)
        .set('Authorization', `Bearer ${mockAdminToken}`);
      await request(app.getHttpServer())
        .delete(`/roles/${roleId2}`)
        .set('Authorization', `Bearer ${mockAdminToken}`);
    });

    it('should return 404 when no authorization token provided (guards bypassed)', async () => {
      // Act & Assert - Since guards are bypassed, this should return 404 for non-existent role
      await request(app.getHttpServer())
        .patch('/roles/some-id')
        .send({ name: 'UnauthorizedUpdate' })
        .expect(404);
    });
  });

  describe('DELETE /roles/:id', () => {
    it('should soft delete a role', async () => {
      // Arrange - Create a role first
      const uniqueName = `DeleteTestRole_${timestamp}_${Math.random()}`;
      const createResponse = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: uniqueName });

      const roleId = createResponse.body.body.data;

      // Act
      const response = await request(app.getHttpServer())
        .delete(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .expect(200);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.body.isSuccess).toBe(1);
      expect(response.body.body.message).toBe('Role deleted successfully');
      expect(response.body.body.data).toBe(roleId);

      // Verify the role is soft deleted (should return 404)
      await request(app.getHttpServer())
        .get(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent role', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .delete('/roles/non-existent-id')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .expect(404);
    });

    it('should return 404 when no authorization token provided (guards bypassed)', async () => {
      // Act & Assert - Since guards are bypassed, this should return 404 for non-existent role
      await request(app.getHttpServer()).delete('/roles/some-id').expect(404);
    });
  });

  describe('Admin/Test Smoke Route', () => {
    it('should verify base connectivity to roles endpoint', async () => {
      // Act & Assert - Since guards are bypassed, this should work
      await request(app.getHttpServer()).get('/roles').expect(200);
    });
  });
});
