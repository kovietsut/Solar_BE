import { Test, TestingModule } from '@nestjs/testing';
import { RoleRepository } from '../../../src/infrastructure/repositories/role.repository';
import { PrismaService } from '../../../src/infrastructure/repositories/prisma.service';
import { Role } from '../../../src/domain/entities/role.entity';
import { CreateRoleDto } from '../../../src/infrastructure/dtos/role/create-role.dto';
import { UpdateRoleDto } from '../../../src/infrastructure/dtos/role/update-role.dto';
import { PrismaRole } from '../../../src/infrastructure/types/prisma-role.type';
import { createTestPrismaClient } from '../../config/test-database.config';

/**
 * Integration test suite for RoleRepository
 * Tests all database operations using a real Prisma test database
 */
describe('RoleRepository Integration Tests', () => {
  let repository: RoleRepository;
  let prisma: PrismaService;
  let testRoles: PrismaRole[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleRepository,
        {
          provide: PrismaService,
          useFactory: () => createTestPrismaClient(),
        },
      ],
    }).compile();

    repository = module.get<RoleRepository>(RoleRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean up the test database before each test
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    // Create test data
    testRoles = await Promise.all([
      prisma.role.create({
        data: {
          name: 'admin',
          isDeleted: false,
        },
      }) as Promise<PrismaRole>,
      prisma.role.create({
        data: {
          name: 'user',
          isDeleted: false,
        },
      }) as Promise<PrismaRole>,
    ]);
  });

  afterAll(async () => {
    // Clean up after all tests
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create a new role in the database', async () => {
      // Arrange
      const inputRole: CreateRoleDto = {
        name: 'new-role',
      };

      // Act
      const actualRole = await repository.create(inputRole);

      // Assert
      expect(actualRole).toBeDefined();
      expect(actualRole.name).toBe(inputRole.name);
      expect(actualRole.isDeleted).toBe(false);

      // Verify in database
      const dbRole = await prisma.role.findUnique({
        where: { id: actualRole.id },
      });
      expect(dbRole).toBeDefined();
      expect(dbRole?.name).toBe(inputRole.name);
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted roles', async () => {
      // Act
      const actualRoles = await repository.findAll();

      // Assert
      expect(actualRoles).toHaveLength(2);
      expect(actualRoles.map((r) => r.name)).toContain('admin');
      expect(actualRoles.map((r) => r.name)).toContain('user');
    });

    it('should not return soft-deleted roles', async () => {
      // Arrange
      await prisma.role.update({
        where: { id: testRoles[0].id },
        data: { isDeleted: true },
      });

      // Act
      const actualRoles = await repository.findAll();

      // Assert
      expect(actualRoles).toHaveLength(1);
      expect(actualRoles[0].name).toBe('user');
    });
  });

  describe('findById', () => {
    it('should return a role when it exists', async () => {
      // Arrange
      const inputId = testRoles[0].id;

      // Act
      const actualRole = await repository.findById(inputId);

      // Assert
      expect(actualRole).toBeDefined();
      expect(actualRole?.id).toBe(inputId);
      expect(actualRole?.name).toBe('admin');
    });

    it('should return null for non-existent role', async () => {
      // Arrange
      const inputId = 'non-existent-id';

      // Act
      const actualRole = await repository.findById(inputId);

      // Assert
      expect(actualRole).toBeNull();
    });

    it('should return null for soft-deleted role', async () => {
      // Arrange
      await prisma.role.update({
        where: { id: testRoles[0].id },
        data: { isDeleted: true },
      });

      // Act
      const actualRole = await repository.findById(testRoles[0].id);

      // Assert
      expect(actualRole).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return a role when name exists', async () => {
      // Arrange
      const inputName = 'admin';

      // Act
      const actualRole = await repository.findByName(inputName);

      // Assert
      expect(actualRole).toBeDefined();
      expect(actualRole?.name).toBe(inputName);
    });

    it('should return null for non-existent name', async () => {
      // Arrange
      const inputName = 'non-existent';

      // Act
      const actualRole = await repository.findByName(inputName);

      // Assert
      expect(actualRole).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a role in the database', async () => {
      // Arrange
      const inputId = testRoles[0].id;
      const inputUpdate: UpdateRoleDto = {
        name: 'updated-admin',
      };

      // Act
      const actualRole = await repository.update(inputId, inputUpdate);

      // Assert
      expect(actualRole).toBeDefined();
      expect(actualRole.id).toBe(inputId);
      expect(actualRole.name).toBe(inputUpdate.name);

      // Verify in database
      const dbRole = await prisma.role.findUnique({
        where: { id: inputId },
      });
      expect(dbRole?.name).toBe(inputUpdate.name);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a role', async () => {
      // Arrange
      const inputId = testRoles[0].id;

      // Act
      const actualRole = await repository.softDelete(inputId);

      // Assert
      expect(actualRole).toBeDefined();
      expect(actualRole.id).toBe(inputId);
      expect(actualRole.isDeleted).toBe(true);

      // Verify in database
      const dbRole = await prisma.role.findUnique({
        where: { id: inputId },
      });
      expect(dbRole?.isDeleted).toBe(true);
    });
  });
});
