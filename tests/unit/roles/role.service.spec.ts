import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from '../../../src/infrastructure/services/role.service';
import { RoleRepository } from '../../../src/infrastructure/repositories/role.repository';
import { CreateRoleDto } from '../../../src/infrastructure/dtos/role/create-role.dto';
import { UpdateRoleDto } from '../../../src/infrastructure/dtos/role/update-role.dto';
import { PrismaRole } from '../../../src/infrastructure/types/prisma-role.type';
import { NotFoundException, ConflictException } from '@nestjs/common';

/**
 * Test suite for RoleService
 * Tests all CRUD operations and edge cases for role management
 */
describe('RoleService', () => {
  let service: RoleService;
  let mockRoleRepository: jest.Mocked<RoleRepository>;

  const mockRole: PrismaRole = {
    id: '1',
    name: 'admin',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Create mock repository
    mockRoleRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: RoleRepository,
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  describe('create', () => {
    it('should create a new role when name is unique', async () => {
      // Arrange
      const inputDto: CreateRoleDto = { name: 'new-role' };
      const expectedRole = { ...mockRole, ...inputDto };
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockResolvedValue(expectedRole);

      // Act
      const actualRole = await service.create(inputDto);

      // Assert
      expect(actualRole).toEqual(expectedRole);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        name: inputDto.name,
      });
      expect(mockRoleRepository.create).toHaveBeenCalledWith(inputDto);
    });

    it('should throw ConflictException when role name already exists', async () => {
      // Arrange
      const inputDto: CreateRoleDto = { name: 'existing-role' };
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      // Act & Assert
      await expect(service.create(inputDto)).rejects.toThrow(ConflictException);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        name: inputDto.name,
      });
      expect(mockRoleRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      // Arrange
      const expectedRoles = [mockRole];
      mockRoleRepository.findAll.mockResolvedValue(expectedRoles);

      // Act
      const actualRoles = await service.findAll();

      // Assert
      expect(actualRoles).toEqual(expectedRoles);
      expect(mockRoleRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a role when it exists', async () => {
      // Arrange
      const inputId = '1';
      mockRoleRepository.findById.mockResolvedValue(mockRole);

      // Act
      const actualRole = await service.findOne(inputId);

      // Assert
      expect(actualRole).toEqual(mockRole);
      expect(mockRoleRepository.findById).toHaveBeenCalledWith(inputId);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      // Arrange
      const inputId = 'non-existent';
      mockRoleRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(inputId)).rejects.toThrow(NotFoundException);
      expect(mockRoleRepository.findById).toHaveBeenCalledWith(inputId);
    });
  });

  describe('update', () => {
    it('should update a role when it exists and new name is unique', async () => {
      // Arrange
      const inputId = '1';
      const inputDto: UpdateRoleDto = { name: 'updated-role' };
      const expectedRole = { ...mockRole, ...inputDto };
      mockRoleRepository.findById.mockResolvedValue(mockRole);
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.update.mockResolvedValue(expectedRole);

      // Act
      const actualRole = await service.update(inputId, inputDto);

      // Assert
      expect(actualRole).toEqual(expectedRole);
      expect(mockRoleRepository.findById).toHaveBeenCalledWith(inputId);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        name: inputDto.name,
      });
      expect(mockRoleRepository.update).toHaveBeenCalledWith(inputId, inputDto);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      // Arrange
      const inputId = 'non-existent';
      const inputDto: UpdateRoleDto = { name: 'updated-role' };
      mockRoleRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(inputId, inputDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRoleRepository.findById).toHaveBeenCalledWith(inputId);
      expect(mockRoleRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when new name already exists', async () => {
      // Arrange
      const inputId = '1';
      const inputDto: UpdateRoleDto = { name: 'existing-role' };
      mockRoleRepository.findById.mockResolvedValue(mockRole);
      mockRoleRepository.findOne.mockResolvedValue({ ...mockRole, id: '2' });

      // Act & Assert
      await expect(service.update(inputId, inputDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRoleRepository.findById).toHaveBeenCalledWith(inputId);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        name: inputDto.name,
      });
      expect(mockRoleRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a role when it exists', async () => {
      // Arrange
      const inputId = '1';
      const expectedRole = { ...mockRole, deletedAt: new Date() };
      mockRoleRepository.findById.mockResolvedValue(mockRole);
      mockRoleRepository.softDelete.mockResolvedValue(expectedRole);

      // Act
      const actualRole = await service.remove(inputId);

      // Assert
      expect(actualRole).toEqual(expectedRole);
      expect(mockRoleRepository.findById).toHaveBeenCalledWith(inputId);
      expect(mockRoleRepository.softDelete).toHaveBeenCalledWith(inputId);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      // Arrange
      const inputId = 'non-existent';
      mockRoleRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(inputId)).rejects.toThrow(NotFoundException);
      expect(mockRoleRepository.findById).toHaveBeenCalledWith(inputId);
      expect(mockRoleRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
