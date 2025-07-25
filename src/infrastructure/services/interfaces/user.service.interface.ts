import { User } from '../../../domain/entities/user.entity';
import { CreateUserDto } from '../../dtos/user/create-user.dto';
import { UpdateUserDto } from '../../dtos/user/update-user.dto';
import { IBaseService } from './base.service.interface';
import { GetListQueryDto } from '../../dtos/common/get-list-query.dto';

export interface IUserService
  extends IBaseService<User, CreateUserDto, UpdateUserDto> {
  getPaginatedList(query: GetListQueryDto): Promise<any>;
}
