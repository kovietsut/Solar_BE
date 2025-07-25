import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { USER_SERVICE } from 'src/infrastructure/constants/injection-tokens';
import { GetListQueryDto } from 'src/infrastructure/dtos/common/get-list-query.dto';
import { IUserService } from 'src/infrastructure/services/interfaces/user.service.interface';
import { JsonUtil } from 'src/shared/utils/json.util';
import { CreateUserDto } from '../../infrastructure/dtos/user/create-user.dto';
import { UpdateUserDto } from '../../infrastructure/dtos/user/update-user.dto';
import { UserResponseDto } from '../../infrastructure/dtos/user/user-response.dto';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from 'src/infrastructure/guards/role.guard';
import { RequireRole } from 'src/infrastructure/decorators/require-role.decorator';
import { ROLES } from 'src/shared/constants/roles.constants';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RoleGuard)
export class UserController {
  constructor(
    @Inject(USER_SERVICE)
    private readonly userService: IUserService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: UserResponseDto,
  })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return JsonUtil.success(
      plainToInstance(UserResponseDto, user),
      'User created successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Return all users',
    type: [UserResponseDto],
  })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR, ROLES.NHAXE)
  async findAll() {
    const users = await this.userService.findAll();
    return JsonUtil.success(
      plainToInstance(UserResponseDto, users),
      'Users retrieved successfully',
      users.length,
    );
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Get paginated users' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated users.',
    type: [UserResponseDto],
  })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'searchText', required: false, type: String })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR, ROLES.NHAXE)
  async findPaginated(
    @Query('pageNumber', {
      transform: (value) => (value ? parseInt(value) : 1),
    })
    pageNumber?: number,
    @Query('pageSize', { transform: (value) => (value ? parseInt(value) : 25) })
    pageSize?: number,
    @Query('searchText') searchText?: string,
  ) {
    const query = new GetListQueryDto();
    query.pageNumber = pageNumber;
    query.pageSize = pageSize;
    query.searchText = searchText;
    const result = await this.userService.getPaginatedList(query);
    return JsonUtil.success(
      plainToInstance(UserResponseDto, result.data),
      'Users retrieved successfully',
      result.dataCount,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the user',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR, ROLES.NHAXE)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userService.findOne(id);
    return JsonUtil.success(
      plainToInstance(UserResponseDto, user),
      'User retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully updated',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.userService.update(id, updateUserDto);
    return JsonUtil.success(
      plainToInstance(UserResponseDto, user),
      'User updated successfully',
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully deleted',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userService.remove(id);
    return JsonUtil.success(
      plainToInstance(UserResponseDto, user),
      'User deleted successfully',
    );
  }
}
