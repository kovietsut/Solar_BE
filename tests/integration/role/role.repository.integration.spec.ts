import { Test, TestingModule } from '@nestjs/testing';
import { cleanupTestDatabase } from '../../config/test-database.config';
import { GetListQueryDto } from '../../../src/infrastructure/dtos/common/get-list-query.dto';
import { CreateRoleDto } from '../../../src/infrastructure/dtos/role/create-role.dto';
import { UpdateRoleDto } from '../../../src/infrastructure/dtos/role/update-role.dto';
import { PrismaService } from '../../../src/infrastructure/repositories/prisma.service';
import { RoleRepository } from '../../../src/infrastructure/repositories/role.repository';

/**
 * Integration test suite for RoleRepository
 * Tests database operations with real Prisma connection
 */
describe('RoleRepository Integration', () => {
  let repository: RoleRepository;
  let prismaService: PrismaService;
  let module: TestingModule;

  const testRoleData: CreateRoleDto = {
    name: 'TestRole',
  };

  const testRoleData2: CreateRoleDto = {
    name: 'TestRole2',
  };

  beforeAll((done) => {
    (async () => {
      try {
        module = await Test.createTestingModule({
          providers: [RoleRepository, PrismaService],
        }).compile();

        repository = module.get<RoleRepository>(RoleRepository);
        prismaService = module.get<PrismaService>(PrismaService);

        // Clean up test data before running tests
        await prismaService.role.deleteMany({
          where: {
            name: {
              in: [testRoleData.name, testRoleData2.name, 'UpdatedTestRole'],
            },
          },
        });
        done();
      } catch (error) {
        done(error);
      }
    })();
  });

  afterAll((done) => {
    (async () => {
      try {
        // Clean up the test container
        await cleanupTestDatabase();
        done();
      } catch (error) {
        done(error);
      }
    })();
  });

  describe('create', () => {
    it('should create a new role', (done) => {
      (async () => {
        try {
          // Act
          const actualRole = await repository.create(testRoleData);

          // Assert
          expect(actualRole).toBeDefined();
          expect(actualRole.id).toBeDefined();
          expect(actualRole.name).toBe(testRoleData.name);
          expect(actualRole.isDeleted).toBe(false);
          expect(actualRole.createdAt).toBeDefined();
          expect(actualRole.updatedAt).toBeDefined();
          done();
        } catch (error) {
          done(error);
        }
      })();
    });

    it('should create another role for testing', (done) => {
      (async () => {
        try {
          // Act
          const actualRole = await repository.create(testRoleData2);

          // Assert
          expect(actualRole).toBeDefined();
          expect(actualRole.id).toBeDefined();
          expect(actualRole.name).toBe(testRoleData2.name);
          expect(actualRole.isDeleted).toBe(false);
          done();
        } catch (error) {
          done(error);
        }
      })();
    });
  });

  describe('findByName', () => {
    it('should find a role by name', (done) => {
      (async () => {
        try {
          // Act
          const actualRole = await repository.findByName(testRoleData.name);

          // Assert
          expect(actualRole).toBeDefined();
          expect(actualRole?.name).toBe(testRoleData.name);
          expect(actualRole?.isDeleted).toBe(false);
          done();
        } catch (error) {
          done(error);
        }
      })();
    });

    it('should return null for non-existent role name', (done) => {
      (async () => {
        try {
          // Act
          const actualRole = await repository.findByName('NonExistentRole');

          // Assert
          expect(actualRole).toBeNull();
          done();
        } catch (error) {
          done(error);
        }
      })();
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted roles', (done) => {
      (async () => {
        try {
          // Act
          const actualRoles = await repository.findAll();

          // Assert
          expect(Array.isArray(actualRoles)).toBe(true);
          expect(actualRoles.length).toBeGreaterThan(0);
          actualRoles.forEach((role) => {
            expect(role.isDeleted).toBe(false);
          });
          done();
        } catch (error) {
          done(error);
        }
      })();
    });
  });

  describe('findById', () => {
    it('should find a role by id', (done) => {
      (async () => {
        try {
          // Arrange
          const createdRole = await repository.create({
            name: `FindByIdTestRole_${Date.now()}`,
          });

          // Act
          const actualRole = await repository.findById(createdRole.id);

          // Assert
          expect(actualRole).toBeDefined();
          expect(actualRole?.id).toBe(createdRole.id);
          expect(actualRole?.name).toBe(createdRole.name);
          expect(actualRole?.isDeleted).toBe(false);

          // Cleanup
          await repository.softDelete(createdRole.id);
          done();
        } catch (error) {
          done(error);
        }
      })();
    });

    it('should return null for non-existent role id', (done) => {
      (async () => {
        try {
          // Act
          const actualRole = await repository.findById('non-existent-id');

          // Assert
          expect(actualRole).toBeNull();
          done();
        } catch (error) {
          done(error);
        }
      })();
    });
  });

  describe('update', () => {
    it('should update a role', (done) => {
      (async () => {
        try {
          // Arrange
          const createdRole = await repository.create({
            name: `UpdateTestRole_${Date.now()}`,
          });
          const updateData: UpdateRoleDto = {
            name: 'UpdatedTestRole',
          };

          // Act
          const actualRole = await repository.update(
            createdRole.id,
            updateData,
          );

          // Assert
          expect(actualRole).toBeDefined();
          expect(actualRole.id).toBe(createdRole.id);
          expect(actualRole.name).toBe(updateData.name);
          // Verify that updatedAt was updated (should be greater than or equal to the original)
          expect(actualRole.updatedAt).toBeDefined();
          if (createdRole.updatedAt && actualRole.updatedAt) {
            expect(actualRole.updatedAt.getTime()).toBeGreaterThanOrEqual(
              createdRole.updatedAt.getTime(),
            );
          }

          // Cleanup
          await repository.softDelete(createdRole.id);
          done();
        } catch (error) {
          done(error);
        }
      })();
    });
  });

  describe('softDelete', () => {
    it('should soft delete a role', (done) => {
      (async () => {
        try {
          // Arrange
          const createdRole = await repository.create({
            name: `SoftDeleteTestRole_${Date.now()}`,
          });

          // Act
          const actualRole = await repository.softDelete(createdRole.id);

          // Assert
          expect(actualRole).toBeDefined();
          expect(actualRole.id).toBe(createdRole.id);
          expect(actualRole.isDeleted).toBe(true);

          // Verify it's not returned in findAll
          const allRoles = await repository.findAll();
          const deletedRole = allRoles.find(
            (role) => role.id === createdRole.id,
          );
          expect(deletedRole).toBeUndefined();
          done();
        } catch (error) {
          done(error);
        }
      })();
    });
  });

  describe('findPaginated', () => {
    it('should return paginated results with default parameters', (done) => {
      (async () => {
        try {
          // Act
          const query = new GetListQueryDto();
          const actualResult = await repository.findPaginated(query);

          // Assert
          expect(actualResult).toBeDefined();
          expect(actualResult.items).toBeDefined();
          expect(actualResult.dataCount).toBeDefined();
          expect(Array.isArray(actualResult.items)).toBe(true);
          expect(typeof actualResult.dataCount).toBe('number');
          done();
        } catch (error) {
          done(error);
        }
      })();
    });

    it('should return paginated results with custom parameters', (done) => {
      (async () => {
        try {
          // Arrange
          const query = new GetListQueryDto();
          query.pageNumber = 1;
          query.pageSize = 5;
          query.searchText = 'Test';

          // Act
          const actualResult = await repository.findPaginated(query);

          // Assert
          expect(actualResult).toBeDefined();
          expect(actualResult.items).toBeDefined();
          expect(actualResult.dataCount).toBeDefined();
          expect(actualResult.items.length).toBeLessThanOrEqual(5);
          done();
        } catch (error) {
          done(error);
        }
      })();
    });

    it('should search by name when searchText is provided', (done) => {
      (async () => {
        try {
          // Arrange
          const query = new GetListQueryDto();
          query.pageNumber = 1;
          query.pageSize = 10;
          query.searchText = 'TestRole';

          // Act
          const actualResult = await repository.findPaginated(query);

          // Assert
          expect(actualResult).toBeDefined();
          expect(actualResult.items).toBeDefined();
          expect(actualResult.dataCount).toBeDefined();

          // All returned items should contain the search text in their name
          actualResult.items.forEach((role) => {
            expect(role.name.toLowerCase()).toContain(
              query.searchText!.toLowerCase(),
            );
          });
          done();
        } catch (error) {
          done(error);
        }
      })();
    });
  });
});
