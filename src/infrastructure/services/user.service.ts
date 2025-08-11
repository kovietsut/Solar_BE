import { Injectable, Inject } from '@nestjs/common';
import { CreateUserDto } from '../dtos/user/create-user.dto';
import { UpdateUserDto } from '../dtos/user/update-user.dto';
import { User } from '../../domain/entities/user.entity';
import { IUserService } from './interfaces/user.service.interface';
import { IUserRepository } from '../repositories/interfaces/user.repository.interface';
import { USER_REPOSITORY } from '../constants/injection-tokens';
import { BaseService } from './base.service';
import { GetListQueryDto } from '../dtos/common/get-list-query.dto';

@Injectable()
export class UserService
  extends BaseService<User, CreateUserDto, UpdateUserDto>
  implements IUserService
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {
    super(
      userRepository,
      ['email', 'phoneNumber'],
      ['name', 'email', 'phoneNumber'],
    );
  }

  async getPaginatedList(query: GetListQueryDto) {
    return super.getPaginatedList(query);
  }
}
