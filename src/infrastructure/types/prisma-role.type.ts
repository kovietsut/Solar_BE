import { BaseEntity } from 'src/domain/entities/base.entity';
import { Role } from '../../domain/entities/role.entity';

export type PrismaRole = Role & BaseEntity;
