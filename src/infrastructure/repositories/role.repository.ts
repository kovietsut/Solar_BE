import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Role } from 'src/domain/entities/role.entity';
import { CreateRoleDto } from 'src/infrastructure/dtos/role/create-role.dto';
import { UpdateRoleDto } from 'src/infrastructure/dtos/role/update-role.dto';
import { BaseRepository } from './base.repository';
import { IRoleRepository } from './interfaces/role.repository.interface';

@Injectable()
export class RoleRepository
  extends BaseRepository<Role>
  implements IRoleRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'role');
  }

  async findByName(name: string): Promise<Role | null> {
    return this.findOne({ name });
  }

  async create(data: CreateRoleDto): Promise<Role> {
    return this.prisma.role.create({
      data,
    });
  }

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({
      where: {
        isDeleted: false,
      },
    });
  }

  async findById(id: string): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  async update(id: string, data: UpdateRoleDto): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });
  }
}
