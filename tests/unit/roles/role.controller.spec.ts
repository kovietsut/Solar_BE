import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from '../../../src/api/controllers/role.controller';
import { RoleService } from '../../../src/infrastructure/services/role.service';
import { CreateRoleDto } from '../../../src/infrastructure/dtos/role/create-role.dto';
import { UpdateRoleDto } from '../../../src/infrastructure/dtos/role/update-role.dto';
import { GetListQueryDto } from '../../../src/infrastructure/dtos/common/get-list-query.dto';
import { PrismaRole } from '../../../src/infrastructure/types/prisma-role.type';
import { ROLE_SERVICE } from '../../../src/infrastructure/constants/injection-tokens';
import { JsonUtil } from '../../../src/shared/utils/json.util';

/**
 * Test suite for RoleController
 * Tests all HTTP endpoints and their responses for role management
 */
describe('RoleController', () => {
  let controller: RoleController;
  let mockRoleService: jest.Mocked<RoleService>;

  const mockRole: PrismaRole = {
    id: '1',
    name: 'Admin',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    users: [],
  };

  beforeEach(async () => {
    // Create mock service
    mockRoleService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getPaginatedList: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: ROLE_SERVICE,
          useValue: mockRoleService,
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
  });

  describe('create', () => {
    it('should create a new role and return success response', async () => {
      // Arrange
      const inputDto: CreateRoleDto = { name: 'NewRole' };
      const expectedRole = { ...mockRole, ...inputDto };
      mockRoleService.create.mockResolvedValue(expectedRole);

      // Act
      const actualResult = await controller.create(inputDto);

      // Assert
      expect(actualResult).toEqual(
        JsonUtil.success(expectedRole.id, 'Role created successfully'),
      );
      expect(mockRoleService.create).toHaveBeenCalledWith(inputDto);
    });
  });

  describe('findAll', () => {
    it('should return all roles with success response', async () => {
      // Arrange
      const expectedRoles = [mockRole];
      mockRoleService.findAll.mockResolvedValue(expectedRoles);

      // Act
      const actualResult = await controller.findAll();

      // Assert
      expect(actualResult).toEqual(
        JsonUtil.success(
          expectedRoles,
          'Roles retrieved successfully',
          expectedRoles.length,
        ),
      );
      expect(mockRoleService.findAll).toHaveBeenCalled();
    });
  });

  describe('findPaginated', () => {
    it('should return paginated roles with default parameters', async () => {
      // Arrange
      const expectedData = {
        data: [mockRole],
        dataCount: 1,
      };
      mockRoleService.getPaginatedList.mockResolvedValue(expectedData);

      // Act
      const actualResult = await controller.findPaginated();

      // Assert
      expect(actualResult).toEqual(
        JsonUtil.success(
          expectedData.data,
          'List fetched successfully',
          expectedData.dataCount,
        ),
      );
      expect(mockRoleService.getPaginatedList).toHaveBeenCalledWith(
        expect.objectContaining({
          pageNumber: undefined,
          pageSize: undefined,
          searchText: undefined,
        }),
      );
    });

    it('should return paginated roles with custom parameters', async () => {
      // Arrange
      const pageNumber = 2;
      const pageSize = 10;
      const searchText = 'Admin';
      const expectedData = {
        data: [mockRole],
        dataCount: 1,
      };
      mockRoleService.getPaginatedList.mockResolvedValue(expectedData);

      // Act
      const actualResult = await controller.findPaginated(
        pageNumber,
        pageSize,
        searchText,
      );

      // Assert
      expect(actualResult).toEqual(
        JsonUtil.success(
          expectedData.data,
          'List fetched successfully',
          expectedData.dataCount,
        ),
      );
      expect(mockRoleService.getPaginatedList).toHaveBeenCalledWith(
        expect.objectContaining({
          pageNumber,
          pageSize,
          searchText,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a role by id with success response', async () => {
      // Arrange
      const inputId = '1';
      mockRoleService.findOne.mockResolvedValue(mockRole);

      // Act
      const actualResult = await controller.findOne(inputId);

      // Assert
      expect(actualResult).toEqual(
        JsonUtil.success(mockRole, 'Role retrieved successfully'),
      );
      expect(mockRoleService.findOne).toHaveBeenCalledWith(inputId);
    });
  });

  describe('update', () => {
    it('should update a role and return success response', async () => {
      // Arrange
      const inputId = '1';
      const inputDto: UpdateRoleDto = { name: 'UpdatedRole' };
      const expectedRole = { ...mockRole, ...inputDto };
      mockRoleService.update.mockResolvedValue(expectedRole);

      // Act
      const actualResult = await controller.update(inputId, inputDto);

      // Assert
      expect(actualResult).toEqual(
        JsonUtil.success(expectedRole.id, 'Role updated successfully'),
      );
      expect(mockRoleService.update).toHaveBeenCalledWith(inputId, inputDto);
    });
  });

  describe('remove', () => {
    it('should soft delete a role and return success response', async () => {
      // Arrange
      const inputId = '1';
      const expectedRole = { ...mockRole, isDeleted: true };
      mockRoleService.remove.mockResolvedValue(expectedRole);

      // Act
      const actualResult = await controller.remove(inputId);

      // Assert
      expect(actualResult).toEqual(
        JsonUtil.success(expectedRole.id, 'Role deleted successfully'),
      );
      expect(mockRoleService.remove).toHaveBeenCalledWith(inputId);
    });
  });
});
