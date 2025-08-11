import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../../domain/entities/user.entity';
import { GetListQueryDto } from '../dtos/common/get-list-query.dto';
import { CreateUserDto } from '../dtos/user/create-user.dto';
import { UpdateUserDto } from '../dtos/user/update-user.dto';
import { BaseRepository } from './base.repository';
import { IUserRepository } from './interfaces/user.repository.interface';
import { PrismaService } from './prisma.service';

@Injectable()
export class UserRepository
  extends BaseRepository<User>
  implements IUserRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, 'user');
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const securityStamp = Math.random().toString(36).substring(2);
    // Combine password with securityStamp before hashing
    const combinedPassword = `${createUserDto.password}${securityStamp}`;
    const hashedPassword = await bcrypt.hash(combinedPassword, 10);
    const { password, ...userData } = createUserDto;

    return this.prisma.user.create({
      data: {
        ...userData,
        passwordHash: hashedPassword,
        securityStamp,
      },
      include: { role: true },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { isDeleted: false },
      include: { role: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, isDeleted: false },
      include: { role: true },
    });
  }

  async findOne(where: any): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { ...where, isDeleted: false },
      include: { role: true },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updateData: any = { ...updateUserDto };
    if (updateUserDto.password && updateUserDto.password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }
    delete updateData.password; // Always remove password field

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });
  }

  async softDelete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isDeleted: true },
      include: { role: true },
    });
  }

  async findPaginated(
    query: GetListQueryDto,
    searchFields: string[] = ['name', 'email', 'phoneNumber'],
  ): Promise<{ items: User[]; dataCount: number }> {
    const { pageNumber = 1, pageSize = 25, searchText = '' } = query;

    const whereClause: any = {
      isDeleted: false,
    };

    if (searchText && searchFields.length > 0) {
      whereClause.OR = searchFields.map((field) => ({
        [field]: {
          contains: searchText,
        },
      }));
    }

    const [items, dataCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: whereClause,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { role: true },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return { items, dataCount };
  }
}
