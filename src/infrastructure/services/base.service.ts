import { ConflictException, NotFoundException } from '@nestjs/common';
import { GetListQueryDto } from '../dtos/common/get-list-query.dto';
import { IBaseRepository } from '../repositories/interfaces/base.repository.interface';

export abstract class BaseService<T, CreateDto, UpdateDto> {
  constructor(
    protected readonly repository: IBaseRepository<T>,
    protected readonly uniqueFields: string[] = [],
    protected readonly searchFields: string[] = ['name'],
  ) {}

  async create(createDto: CreateDto): Promise<T> {
    for (const field of this.uniqueFields) {
      const existing = await this.repository.findOne({
        [field]: createDto[field],
      });
      if (existing) {
        throw new ConflictException(
          `Entity with ${field} ${createDto[field]} already exists`,
        );
      }
    }
    return this.repository.create(createDto);
  }

  async findAll(): Promise<T[]> {
    return this.repository.findAll();
  }

  async findOne(id: string): Promise<T> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
    return entity;
  }

  async update(id: string, updateDto: UpdateDto): Promise<T> {
    await this.findOne(id);
    return this.repository.update(id, updateDto);
  }

  async remove(id: string): Promise<T> {
    await this.findOne(id);
    return this.repository.softDelete(id);
  }

  async getPaginatedList(query: GetListQueryDto) {
    const { items, dataCount } = await this.repository.findPaginated(
      query,
      this.searchFields,
    );
    return {
      data: items,
      dataCount,
    };
  }
}
