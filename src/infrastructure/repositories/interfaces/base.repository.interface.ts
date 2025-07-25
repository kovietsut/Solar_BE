import { GetListQueryDto } from '../../dtos/common/get-list-query.dto';

export interface IBaseRepository<T> {
  create(data: any): Promise<T>;
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: any): Promise<T>;
  softDelete(id: string): Promise<T>;
  findOne(where: any): Promise<T | null>;
  findPaginated(
    query: GetListQueryDto,
    searchFields?: string[],
  ): Promise<{ items: T[]; dataCount: number }>;
}
