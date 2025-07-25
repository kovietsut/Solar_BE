import { Injectable, Inject } from '@nestjs/common';
import { CreateUserDto } from '../dtos/user/create-user.dto';
import { UpdateUserDto } from '../dtos/user/update-user.dto';
import { User } from '../../domain/entities/user.entity';
import { IUserService } from './interfaces/user.service.interface';
import { IUserRepository } from '../repositories/interfaces/user.repository.interface';
import { USER_REPOSITORY } from '../constants/injection-tokens';
import { BaseService } from './base.service';
import { GetListQueryDto } from '../dtos/common/get-list-query.dto';
import { NotFoundException } from '@nestjs/common';

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

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.userRepository.create(createUserDto);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);
    return this.userRepository.update(id, updateUserDto);
  }

  async remove(id: string): Promise<User> {
    await this.findOne(id);
    return this.userRepository.softDelete(id);
  }
}
