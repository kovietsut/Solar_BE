import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../../../src/infrastructure/repositories/user.repository';
import { PrismaService } from '../../../src/infrastructure/repositories/prisma.service';
import { CreateUserDto } from '../../../src/infrastructure/dtos/user/create-user.dto';
import { UpdateUserDto } from '../../../src/infrastructure/dtos/user/update-user.dto';
import { GetListQueryDto } from '../../../src/infrastructure/dtos/common/get-list-query.dto';
import { User } from '../../../src/domain/entities/user.entity';
import { Role } from '../../../src/domain/entities/role.entity';
import { createTestPrismaClient } from '../../config/test-database.config';

describe('UserRepository Integration', () => {
  let repository: UserRepository;
  let prismaService: PrismaService;
  let testRole: Role;
  let testUser: User;

  beforeAll(async () => {
    // Test database setup would go here in a real scenario
  });

  beforeAll(async () => {
    // Clean up any existing test data from previous runs
    const testPrisma = createTestPrismaClient();
    await testPrisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test@example.com',
            'test2@example.com',
            'test1@example.com',
            'another@example.com',
          ],
        },
      },
    });
    await testPrisma.role.deleteMany({
      where: {
        name: {
          startsWith: 'TestRole_',
        },
      },
    });
    await testPrisma.$disconnect();
  });

  afterAll(async () => {
    // Test database cleanup would go here in a real scenario
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: createTestPrismaClient(),
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    prismaService = module.get<PrismaService>(PrismaService);

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
  });

  afterEach(async () => {
    // Clean up test data in correct order (users first, then roles)
    await prismaService.user.deleteMany({
      where: {
        email: {
          in: [
            'test@example.com',
            'test2@example.com',
            'test1@example.com',
            'another@example.com',
          ],
        },
      },
    });

    // Clean up the specific test role we created
    if (testRole) {
      await prismaService.role.delete({
        where: { id: testRole.id },
      });
    }
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        phoneNumber: '0123456789',
        password: 'password123',
        address: 'Test Address',
        roleId: testRole.id,
      };

      // Act
      const actualUser = await repository.create(createUserDto);

      // Assert
      expect(actualUser).toBeDefined();
      expect(actualUser.id).toBeDefined();
      expect(actualUser.email).toBe(createUserDto.email);
      expect(actualUser.name).toBe(createUserDto.name);
      expect(actualUser.phoneNumber).toBe(createUserDto.phoneNumber);
      expect(actualUser.address).toBe(createUserDto.address);
      expect(actualUser.roleId).toBe(createUserDto.roleId);
      expect(actualUser.passwordHash).toBeDefined();
      expect(actualUser.securityStamp).toBeDefined();
      expect(actualUser.role).toBeDefined();
      expect(actualUser.role?.id).toBe(testRole.id);
      expect(actualUser.createdAt).toBeDefined();
      expect(actualUser.updatedAt).toBeDefined();
      expect(actualUser.isDeleted).toBe(false);
    });

    it('should hash password and generate security stamp', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test2@example.com',
        name: 'Test User 2',
        phoneNumber: '0987654321',
        password: 'password123',
        address: 'Test Address 2',
        roleId: testRole.id,
      };

      // Act
      const actualUser = await repository.create(createUserDto);

      // Assert
      expect(actualUser.passwordHash).not.toBe(createUserDto.password);
      expect(actualUser.passwordHash).toHaveLength(60); // bcrypt hash length
      expect(actualUser.securityStamp).toBeDefined();
      expect(actualUser.securityStamp.length).toBeGreaterThanOrEqual(8); // Security stamp should be at least 8 chars
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create test users
      await repository.create({
        email: 'test1@example.com',
        name: 'Test User 1',
        phoneNumber: '0123456789',
        password: 'password123',
        address: 'Test Address 1',
        roleId: testRole.id,
      });

      await repository.create({
        email: 'test2@example.com',
        name: 'Test User 2',
        phoneNumber: '0987654321',
        password: 'password123',
        address: 'Test Address 2',
        roleId: testRole.id,
      });
    });

    it('should return all non-deleted users with role information', async () => {
      // Act
      const actualUsers = await repository.findAll();

      // Assert
      expect(actualUsers).toBeDefined();
      expect(actualUsers.length).toBeGreaterThanOrEqual(2);

      const testUsers = actualUsers.filter((user) =>
        ['test1@example.com', 'test2@example.com'].includes(user.email),
      );
      expect(testUsers.length).toBe(2);

      testUsers.forEach((user) => {
        expect(user.isDeleted).toBe(false);
        expect(user.role).toBeDefined();
        expect(user.role?.id).toBe(testRole.id);
      });
    });
  });

  describe('findById', () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await repository.create({
        email: 'test@example.com',
        name: 'Test User',
        phoneNumber: '0123456789',
        password: 'password123',
        address: 'Test Address',
        roleId: testRole.id,
      });
      testUserId = user.id;
    });

    it('should return user by id with role information', async () => {
      // Act
      const actualUser = await repository.findById(testUserId);

      // Assert
      expect(actualUser).toBeDefined();
      expect(actualUser?.id).toBe(testUserId);
      expect(actualUser?.email).toBe('test@example.com');
      expect(actualUser?.role).toBeDefined();
      expect(actualUser?.role?.id).toBe(testRole.id);
    });

    it('should return null for non-existent user id', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // Act
      const actualUser = await repository.findById(nonExistentId);

      // Assert
      expect(actualUser).toBeNull();
    });
  });

  describe('findOne', () => {
    beforeEach(async () => {
      await repository.create({
        email: 'test@example.com',
        name: 'Test User',
        phoneNumber: '0123456789',
        password: 'password123',
        address: 'Test Address',
        roleId: testRole.id,
      });
    });

    it('should return user by email with role information', async () => {
      // Act
      const actualUser = await repository.findOne({
        email: 'test@example.com',
      });

      // Assert
      expect(actualUser).toBeDefined();
      expect(actualUser?.email).toBe('test@example.com');
      expect(actualUser?.role).toBeDefined();
      expect(actualUser?.role?.id).toBe(testRole.id);
    });

    it('should return null for non-existent email', async () => {
      // Act
      const actualUser = await repository.findOne({
        email: 'nonexistent@example.com',
      });

      // Assert
      expect(actualUser).toBeNull();
    });
  });

  describe('update', () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await repository.create({
        email: 'test@example.com',
        name: 'Test User',
        phoneNumber: '0123456789',
        password: 'password123',
        address: 'Test Address',
        roleId: testRole.id,
      });
      testUserId = user.id;
    });

    it('should update user information successfully', async () => {
      // Arrange
      const updateUserDto: UpdateUserDto = {
        email: 'test@example.com',
        name: 'Updated Test User',
        phoneNumber: '0123456789',
        password: 'newpassword123',
        address: 'Updated Test Address',
        roleId: testRole.id,
      };

      // Act
      const actualUser = await repository.update(testUserId, updateUserDto);

      // Assert
      expect(actualUser).toBeDefined();
      expect(actualUser.id).toBe(testUserId);
      expect(actualUser.name).toBe('Updated Test User');
      expect(actualUser.address).toBe('Updated Test Address');
      expect(actualUser.passwordHash).not.toBe(updateUserDto.password);
      expect(actualUser.updatedAt).toBeDefined();
    });

    it('should update user without password change', async () => {
      // Arrange
      const updateUserDto: UpdateUserDto = {
        email: 'test@example.com',
        name: 'Updated Test User',
        phoneNumber: '0123456789',
        password: '', // Empty password
        address: 'Updated Test Address',
        roleId: testRole.id,
      };

      // Act
      const actualUser = await repository.update(testUserId, updateUserDto);

      // Assert
      expect(actualUser).toBeDefined();
      expect(actualUser.name).toBe('Updated Test User');
      expect(actualUser.address).toBe('Updated Test Address');
    });
  });

  describe('softDelete', () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await repository.create({
        email: 'test@example.com',
        name: 'Test User',
        phoneNumber: '0123456789',
        password: 'password123',
        address: 'Test Address',
        roleId: testRole.id,
      });
      testUserId = user.id;
    });

    it('should soft delete user successfully', async () => {
      // Act
      const actualUser = await repository.softDelete(testUserId);

      // Assert
      expect(actualUser).toBeDefined();
      expect(actualUser.id).toBe(testUserId);
      expect(actualUser.isDeleted).toBe(true);

      // Verify user is not returned in findAll
      const allUsers = await repository.findAll();
      const deletedUser = allUsers.find((user) => user.id === testUserId);
      expect(deletedUser).toBeUndefined();
    });
  });

  describe('findPaginated', () => {
    beforeEach(async () => {
      // Create multiple test users
      await repository.create({
        email: 'test1@example.com',
        name: 'Test User 1',
        phoneNumber: '0123456789',
        password: 'password123',
        address: 'Test Address 1',
        roleId: testRole.id,
      });

      await repository.create({
        email: 'test2@example.com',
        name: 'Test User 2',
        phoneNumber: '0987654321',
        password: 'password123',
        address: 'Test Address 2',
        roleId: testRole.id,
      });

      await repository.create({
        email: 'another@example.com',
        name: 'Another User',
        phoneNumber: '0555555555',
        password: 'password123',
        address: 'Another Address',
        roleId: testRole.id,
      });
    });

    it('should return paginated results with correct count', async () => {
      // Arrange
      const query = new GetListQueryDto();
      query.pageNumber = 1;
      query.pageSize = 2;

      // Act
      const actualResult = await repository.findPaginated(query);

      // Assert
      expect(actualResult).toBeDefined();
      expect(actualResult.items).toBeDefined();
      expect(actualResult.dataCount).toBeGreaterThanOrEqual(3);
      expect(actualResult.items.length).toBeLessThanOrEqual(2);
    });

    it('should apply search filter correctly', async () => {
      // Arrange
      const query = new GetListQueryDto();
      query.pageNumber = 1;
      query.pageSize = 10;
      query.searchText = 'Test User';

      // Act
      const actualResult = await repository.findPaginated(query);

      // Assert
      expect(actualResult).toBeDefined();
      expect(actualResult.items.length).toBeGreaterThanOrEqual(2);
      actualResult.items.forEach((user) => {
        expect(user.name).toContain('Test User');
      });
    });

    it('should handle empty search results', async () => {
      // Arrange
      const query = new GetListQueryDto();
      query.pageNumber = 1;
      query.pageSize = 10;
      query.searchText = 'NonExistentUser';

      // Act
      const actualResult = await repository.findPaginated(query);

      // Assert
      expect(actualResult).toBeDefined();
      expect(actualResult.items).toEqual([]);
      expect(actualResult.dataCount).toBe(0);
    });

    it('should apply pagination correctly', async () => {
      // Arrange
      const query1 = new GetListQueryDto();
      query1.pageNumber = 1;
      query1.pageSize = 2;

      const query2 = new GetListQueryDto();
      query2.pageNumber = 2;
      query2.pageSize = 2;

      // Act
      const result1 = await repository.findPaginated(query1);
      const result2 = await repository.findPaginated(query2);

      // Assert
      expect(result1.items.length).toBeLessThanOrEqual(2);
      expect(result2.items.length).toBeLessThanOrEqual(2);

      // Verify different users are returned
      const userIds1 = result1.items.map((user) => user.id);
      const userIds2 = result2.items.map((user) => user.id);
      const intersection = userIds1.filter((id) => userIds2.includes(id));
      expect(intersection.length).toBe(0);
    });
  });
});
