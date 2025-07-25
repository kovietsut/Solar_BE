import { Role } from 'src/domain/entities/role.entity';
import { CreateRoleDto } from 'src/infrastructure/dtos/role/create-role.dto';
import { UpdateRoleDto } from 'src/infrastructure/dtos/role/update-role.dto';
import { IBaseService } from './base.service.interface';
import { GetListQueryDto } from '../../dtos/common/get-list-query.dto';

export interface IRoleService
  extends IBaseService<Role, CreateRoleDto, UpdateRoleDto> {
  getPaginatedList(query: GetListQueryDto): Promise<any>;
}
