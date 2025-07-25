import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoleService } from 'src/infrastructure/services/role.service';
import { CreateRoleDto } from '../../infrastructure/dtos/role/create-role.dto';
import { UpdateRoleDto } from '../../infrastructure/dtos/role/update-role.dto';
import { Role } from 'src/domain/entities/role.entity';
import { JsonUtil } from 'src/shared/utils/json.util';
import { IRoleService } from 'src/infrastructure/services/interfaces/role.service.interface';
import { ROLE_SERVICE } from 'src/infrastructure/constants/injection-tokens';
import { GetListQueryDto } from 'src/infrastructure/dtos/common/get-list-query.dto';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from 'src/infrastructure/guards/role.guard';
import { RequireRole } from 'src/infrastructure/decorators/require-role.decorator';
import { ROLES } from 'src/shared/constants/roles.constants';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RoleGuard)
export class RoleController {
  constructor(
    @Inject(ROLE_SERVICE)
    private readonly roleService: IRoleService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'The role has been successfully created.',
    type: Role,
  })
  @ApiResponse({
    status: 409,
    description: 'Role with this name already exists.',
  })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR)
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.roleService.create(createRoleDto);
    return JsonUtil.success(role.id, 'Role created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Return all roles.', type: [Role] })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR, ROLES.NHAXE)
  async findAll() {
    const roles = await this.roleService.findAll();
    return JsonUtil.success(
      roles,
      'Roles retrieved successfully',
      roles.length,
    );
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Get paginated roles' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated roles.',
    type: [Role],
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
    const roles = await this.roleService.getPaginatedList(query);
    return JsonUtil.success(
      roles.data,
      'List fetched successfully',
      roles.dataCount,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by id' })
  @ApiResponse({ status: 200, description: 'Return the role.', type: Role })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR, ROLES.NHAXE)
  async findOne(@Param('id') id: string) {
    const role = await this.roleService.findOne(id);
    return JsonUtil.success(role, 'Role retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({
    status: 200,
    description: 'The role has been successfully updated.',
    type: Role,
  })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({
    status: 409,
    description: 'Role with this name already exists.',
  })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR)
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.roleService.update(id, updateRoleDto);
    return JsonUtil.success(role.id, 'Role updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a role' })
  @ApiResponse({
    status: 200,
    description: 'The role has been successfully deleted.',
    type: Role,
  })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR)
  async remove(@Param('id') id: string) {
    const role = await this.roleService.remove(id);
    return JsonUtil.success(role.id, 'Role deleted successfully');
  }
}
