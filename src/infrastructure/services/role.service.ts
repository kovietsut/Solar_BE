import { Injectable, Inject } from '@nestjs/common';
import { CreateRoleDto } from 'src/infrastructure/dtos/role/create-role.dto';
import { UpdateRoleDto } from 'src/infrastructure/dtos/role/update-role.dto';
import { Role } from 'src/domain/entities/role.entity';
import { BaseService } from './base.service';
import { IRoleService } from './interfaces/role.service.interface';
import { IRoleRepository } from '../repositories/interfaces/role.repository.interface';
import { ROLE_REPOSITORY } from '../constants/injection-tokens';
import { GetListQueryDto } from '../dtos/common/get-list-query.dto';

@Injectable()
export class RoleService
  extends BaseService<Role, CreateRoleDto, UpdateRoleDto>
  implements IRoleService
{
  constructor(
    @Inject(ROLE_REPOSITORY)
    roleRepository: IRoleRepository,
  ) {
    super(roleRepository, ['name']);
  }

  async getPaginatedList(query: GetListQueryDto) {
    return super.getPaginatedList(query);
  }
}
