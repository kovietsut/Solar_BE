import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../src/infrastructure/services/user.service';
import { IUserRepository } from '../../../src/infrastructure/repositories/interfaces/user.repository.interface';
import { USER_REPOSITORY } from '../../../src/infrastructure/constants/injection-tokens';
import { CreateUserDto } from '../../../src/infrastructure/dtos/user/create-user.dto';
import { UpdateUserDto } from '../../../src/infrastructure/dtos/user/update-user.dto';
import { GetListQueryDto } from '../../../src/infrastructure/dtos/common/get-list-query.dto';
import { User } from '../../../src/domain/entities/user.entity';
import { Role } from '../../../src/domain/entities/role.entity';

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  const mockRole: Role = {
    id: 'role-1',
    name: 'Admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    isDeleted: false,
  };

  const mockUser: User = {
    id: 'user-1',
    roleId: 'role-1',
    phoneNumber: '0123456789',
    passwordHash: 'hashed-password',
    securityStamp: 'security-stamp',
    email: 'test@example.com',
    name: 'Test User',
    avatarPath: null,
    address: 'Test Address',
    role: mockRole,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    isDeleted: false,
  };

  const mockCreateUserDto: CreateUserDto = {
    email: 'test@example.com',
    name: 'Test User',
    phoneNumber: '0123456789',
    password: 'password123',
    address: 'Test Address',
    roleId: 'role-1',
  };

  const mockUpdateUserDto: UpdateUserDto = {
    ...mockCreateUserDto,
    password: 'newpassword123',
  };

  beforeEach(async () => {
    const mockUserRepositoryProvider = {
      provide: USER_REPOSITORY,
      useValue: {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
        findPaginated: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, mockUserRepositoryProvider],
    }).compile();

    service = module.get<UserService>(UserService);
    mockUserRepository = module.get(USER_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const expectedUser = { ...mockUser };
      mockUserRepository.create.mockResolvedValue(expectedUser);

      // Act
      const actualUser = await service.create(mockCreateUserDto);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(actualUser).toEqual(expectedUser);
    });

    it('should throw an error when repository create fails', async () => {
      // Arrange
      const errorMessage = 'Database error';
      mockUserRepository.create.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        errorMessage,
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });

  describe('findAll', () => {
    it('should return all users successfully', async () => {
      // Arrange
      const expectedUsers = [mockUser];
      mockUserRepository.findAll.mockResolvedValue(expectedUsers);

      // Act
      const actualUsers = await service.findAll();

      // Assert
      expect(mockUserRepository.findAll).toHaveBeenCalled();
      expect(actualUsers).toEqual(expectedUsers);
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      mockUserRepository.findAll.mockResolvedValue([]);

      // Act
      const actualUsers = await service.findAll();

      // Assert
      expect(mockUserRepository.findAll).toHaveBeenCalled();
      expect(actualUsers).toEqual([]);
    });

    it('should throw an error when repository findAll fails', async () => {
      // Arrange
      const errorMessage = 'Database error';
      mockUserRepository.findAll.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow(errorMessage);
      expect(mockUserRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id successfully', async () => {
      // Arrange
      const userId = 'user-1';
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const actualUser = await service.findOne(userId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(actualUser).toEqual(mockUser);
    });

    it('should throw NotFoundException when user is not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(userId)).rejects.toThrow(
        `Entity with id ${userId} not found`,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw an error when repository findById fails', async () => {
      // Arrange
      const userId = 'user-1';
      const errorMessage = 'Database error';
      mockUserRepository.findById.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.findOne(userId)).rejects.toThrow(errorMessage);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const expectedUpdatedUser = { ...mockUser, name: 'Updated User' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(expectedUpdatedUser);

      // Act
      const actualUser = await service.update(userId, mockUpdateUserDto);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        userId,
        mockUpdateUserDto,
      );
      expect(actualUser).toEqual(expectedUpdatedUser);
    });

    it('should throw an error when repository update fails', async () => {
      // Arrange
      const userId = 'user-1';
      const errorMessage = 'Database error';
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.update(userId, mockUpdateUserDto)).rejects.toThrow(
        errorMessage,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        userId,
        mockUpdateUserDto,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a user successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const expectedDeletedUser = { ...mockUser, isDeleted: true };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.softDelete.mockResolvedValue(expectedDeletedUser);

      // Act
      const actualUser = await service.remove(userId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(userId);
      expect(actualUser).toEqual(expectedDeletedUser);
    });

    it('should throw an error when repository softDelete fails', async () => {
      // Arrange
      const userId = 'user-1';
      const errorMessage = 'Database error';
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.softDelete.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.remove(userId)).rejects.toThrow(errorMessage);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(userId);
    });
  });

  describe('getPaginatedList', () => {
    it('should return paginated users successfully', async () => {
      // Arrange
      const query = new GetListQueryDto();
      query.pageNumber = 1;
      query.pageSize = 10;
      query.searchText = 'test';

      const expectedResult = {
        data: [mockUser],
        dataCount: 1,
      };
      mockUserRepository.findPaginated.mockResolvedValue({
        items: [mockUser],
        dataCount: 1,
      });

      // Act
      const actualResult = await service.getPaginatedList(query);

      // Assert
      expect(mockUserRepository.findPaginated).toHaveBeenCalledWith(query, [
        'name',
        'email',
        'phoneNumber',
      ]);
      expect(actualResult).toEqual(expectedResult);
    });

    it('should return empty paginated result when no users match criteria', async () => {
      // Arrange
      const query = new GetListQueryDto();
      query.pageNumber = 1;
      query.pageSize = 10;
      query.searchText = 'nonexistent';

      mockUserRepository.findPaginated.mockResolvedValue({
        items: [],
        dataCount: 0,
      });

      // Act
      const actualResult = await service.getPaginatedList(query);

      // Assert
      expect(mockUserRepository.findPaginated).toHaveBeenCalledWith(query, [
        'name',
        'email',
        'phoneNumber',
      ]);
      expect(actualResult.data).toEqual([]);
      expect(actualResult.dataCount).toBe(0);
    });

    it('should throw an error when repository findPaginated fails', async () => {
      // Arrange
      const query = new GetListQueryDto();
      const errorMessage = 'Database error';
      mockUserRepository.findPaginated.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(service.getPaginatedList(query)).rejects.toThrow(
        errorMessage,
      );
      expect(mockUserRepository.findPaginated).toHaveBeenCalledWith(query, [
        'name',
        'email',
        'phoneNumber',
      ]);
    });
  });
});
