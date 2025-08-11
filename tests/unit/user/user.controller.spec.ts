import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../../src/api/controllers/user.controller';
import { IUserService } from '../../../src/infrastructure/services/interfaces/user.service.interface';
import { USER_SERVICE } from '../../../src/infrastructure/constants/injection-tokens';
import { CreateUserDto } from '../../../src/infrastructure/dtos/user/create-user.dto';
import { UpdateUserDto } from '../../../src/infrastructure/dtos/user/update-user.dto';
import { UserResponseDto } from '../../../src/infrastructure/dtos/user/user-response.dto';
import { GetListQueryDto } from '../../../src/infrastructure/dtos/common/get-list-query.dto';
import { User } from '../../../src/domain/entities/user.entity';
import { Role } from '../../../src/domain/entities/role.entity';
import { JsonUtil } from '../../../src/shared/utils/json.util';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: jest.Mocked<IUserService>;

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
    const mockUserServiceProvider = {
      provide: USER_SERVICE,
      useValue: {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        getPaginatedList: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [mockUserServiceProvider],
    }).compile();

    controller = module.get<UserController>(UserController);
    mockUserService = module.get(USER_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const expectedUser = { ...mockUser };
      const expectedResponse = JsonUtil.success(
        expect.any(UserResponseDto),
        'User created successfully',
      );
      mockUserService.create.mockResolvedValue(expectedUser);

      // Act
      const actualResponse = await controller.create(mockCreateUserDto);

      // Assert
      expect(mockUserService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(actualResponse).toEqual(expectedResponse);
      expect(actualResponse.body.data).toBeDefined();
      expect(actualResponse.body.message).toBe('User created successfully');
    });

    it('should throw an error when service create fails', async () => {
      // Arrange
      const errorMessage = 'Service error';
      mockUserService.create.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.create(mockCreateUserDto)).rejects.toThrow(
        errorMessage,
      );
      expect(mockUserService.create).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });

  describe('findAll', () => {
    it('should return all users successfully', async () => {
      // Arrange
      const expectedUsers = [mockUser];
      const expectedResponse = JsonUtil.success(
        expect.any(Array),
        'Users retrieved successfully',
        1,
      );
      mockUserService.findAll.mockResolvedValue(expectedUsers);

      // Act
      const actualResponse = await controller.findAll();

      // Assert
      expect(mockUserService.findAll).toHaveBeenCalled();
      expect(actualResponse).toEqual(expectedResponse);
      expect(actualResponse.body.data).toBeDefined();
      expect(actualResponse.body.message).toBe('Users retrieved successfully');
      expect(actualResponse.body.dataCount).toBe(1);
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      const expectedUsers: User[] = [];
      const expectedResponse = JsonUtil.success(
        expect.any(Array),
        'Users retrieved successfully',
        0,
      );
      mockUserService.findAll.mockResolvedValue(expectedUsers);

      // Act
      const actualResponse = await controller.findAll();

      // Assert
      expect(mockUserService.findAll).toHaveBeenCalled();
      expect(actualResponse).toEqual(expectedResponse);
      expect(actualResponse.body.data).toEqual([]);
      expect(actualResponse.body.dataCount).toBe(0);
    });

    it('should throw an error when service findAll fails', async () => {
      // Arrange
      const errorMessage = 'Service error';
      mockUserService.findAll.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow(errorMessage);
      expect(mockUserService.findAll).toHaveBeenCalled();
    });
  });

  describe('findPaginated', () => {
    it('should return paginated users successfully', async () => {
      // Arrange
      const pageNumber = 1;
      const pageSize = 10;
      const searchText = 'test';
      const query = new GetListQueryDto();
      query.pageNumber = pageNumber;
      query.pageSize = pageSize;
      query.searchText = searchText;

      const mockPaginatedResult = {
        data: [mockUser],
        dataCount: 1,
      };
      const expectedResponse = JsonUtil.success(
        expect.any(Array),
        'Users retrieved successfully',
        1,
      );
      mockUserService.getPaginatedList.mockResolvedValue(mockPaginatedResult);

      // Act
      const actualResponse = await controller.findPaginated(
        pageNumber,
        pageSize,
        searchText,
      );

      // Assert
      expect(mockUserService.getPaginatedList).toHaveBeenCalledWith(query);
      expect(actualResponse).toEqual(expectedResponse);
      expect(actualResponse.body.data).toBeDefined();
      expect(actualResponse.body.message).toBe('Users retrieved successfully');
      expect(actualResponse.body.dataCount).toBe(1);
    });

    it('should use default values when parameters are not provided', async () => {
      // Arrange
      const query = new GetListQueryDto();
      query.pageNumber = undefined;
      query.pageSize = undefined;
      query.searchText = undefined;

      const mockPaginatedResult = {
        data: [],
        dataCount: 0,
      };
      const expectedResponse = JsonUtil.success(
        expect.any(Array),
        'Users retrieved successfully',
        0,
      );
      mockUserService.getPaginatedList.mockResolvedValue(mockPaginatedResult);

      // Act
      const actualResponse = await controller.findPaginated();

      // Assert
      expect(mockUserService.getPaginatedList).toHaveBeenCalledWith(
        expect.objectContaining({
          pageNumber: undefined,
          pageSize: undefined,
          searchText: undefined,
        }),
      );
      expect(actualResponse).toEqual(expectedResponse);
      expect(actualResponse.body.dataCount).toBe(0);
    });

    it('should throw an error when service getPaginatedList fails', async () => {
      // Arrange
      const pageNumber = 1;
      const pageSize = 10;
      const searchText = 'test';
      const errorMessage = 'Service error';
      mockUserService.getPaginatedList.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(
        controller.findPaginated(pageNumber, pageSize, searchText),
      ).rejects.toThrow(errorMessage);
      expect(mockUserService.getPaginatedList).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const expectedUser = { ...mockUser };
      const expectedResponse = JsonUtil.success(
        expect.any(UserResponseDto),
        'User retrieved successfully',
      );
      mockUserService.findOne.mockResolvedValue(expectedUser);

      // Act
      const actualResponse = await controller.findOne(userId);

      // Assert
      expect(mockUserService.findOne).toHaveBeenCalledWith(userId);
      expect(actualResponse).toEqual(expectedResponse);
      expect(actualResponse.body.data).toBeDefined();
      expect(actualResponse.body.message).toBe('User retrieved successfully');
    });

    it('should throw an error when service findOne fails', async () => {
      // Arrange
      const userId = 'user-1';
      const errorMessage = 'Service error';
      mockUserService.findOne.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.findOne(userId)).rejects.toThrow(errorMessage);
      expect(mockUserService.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const expectedUpdatedUser = { ...mockUser, name: 'Updated User' };
      const expectedResponse = JsonUtil.success(
        expect.any(UserResponseDto),
        'User updated successfully',
      );
      mockUserService.update.mockResolvedValue(expectedUpdatedUser);

      // Act
      const actualResponse = await controller.update(userId, mockUpdateUserDto);

      // Assert
      expect(mockUserService.update).toHaveBeenCalledWith(
        userId,
        mockUpdateUserDto,
      );
      expect(actualResponse).toEqual(expectedResponse);
      expect(actualResponse.body.data).toBeDefined();
      expect(actualResponse.body.message).toBe('User updated successfully');
    });

    it('should throw an error when service update fails', async () => {
      // Arrange
      const userId = 'user-1';
      const errorMessage = 'Service error';
      mockUserService.update.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        controller.update(userId, mockUpdateUserDto),
      ).rejects.toThrow(errorMessage);
      expect(mockUserService.update).toHaveBeenCalledWith(
        userId,
        mockUpdateUserDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const expectedDeletedUser = { ...mockUser, isDeleted: true };
      const expectedResponse = JsonUtil.success(
        expect.any(UserResponseDto),
        'User deleted successfully',
      );
      mockUserService.remove.mockResolvedValue(expectedDeletedUser);

      // Act
      const actualResponse = await controller.remove(userId);

      // Assert
      expect(mockUserService.remove).toHaveBeenCalledWith(userId);
      expect(actualResponse).toEqual(expectedResponse);
      expect(actualResponse.body.data).toBeDefined();
      expect(actualResponse.body.message).toBe('User deleted successfully');
    });

    it('should throw an error when service remove fails', async () => {
      // Arrange
      const userId = 'user-1';
      const errorMessage = 'Service error';
      mockUserService.remove.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.remove(userId)).rejects.toThrow(errorMessage);
      expect(mockUserService.remove).toHaveBeenCalledWith(userId);
    });
  });
});
