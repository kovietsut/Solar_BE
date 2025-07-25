import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';
import { IBaseRepository } from './interfaces/base.repository.interface';
import { GetListQueryDto } from '../dtos/common/get-list-query.dto';

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  protected prisma: PrismaClient;
  protected model: string;

  constructor(prisma: PrismaService, model: string) {
    this.prisma = prisma;
    this.model = model;
  }

  async create(data: any): Promise<T> {
    return this.prisma[this.model].create({
      data,
    });
  }

  async findAll(): Promise<T[]> {
    return this.prisma[this.model].findMany({
      where: {
        isDeleted: false,
      },
    });
  }

  async findById(id: string): Promise<T | null> {
    return this.prisma[this.model].findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  async update(id: string, data: any): Promise<T> {
    return this.prisma[this.model].update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<T> {
    return this.prisma[this.model].update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });
  }

  async findOne(where: any): Promise<T | null> {
    return this.prisma[this.model].findFirst({
      where: {
        ...where,
        isDeleted: false,
      },
    });
  }

  async findPaginated(
    query: GetListQueryDto,
    searchFields: string[] = ['name'],
  ): Promise<{ items: T[]; dataCount: number }> {
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
      this.prisma[this.model].findMany({
        where: whereClause,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma[this.model].count({ where: whereClause }),
    ]);

    return { items, dataCount };
  }
}
