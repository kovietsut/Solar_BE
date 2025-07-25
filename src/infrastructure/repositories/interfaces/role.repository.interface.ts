import { Role } from 'src/domain/entities/role.entity';
import { IBaseRepository } from './base.repository.interface';
import { GetListQueryDto } from '../../dtos/common/get-list-query.dto';

export interface IRoleRepository extends IBaseRepository<Role> {
  findByName(name: string): Promise<Role | null>;
  findPaginated(
    query: GetListQueryDto,
  ): Promise<{ items: Role[]; dataCount: number }>;
}
