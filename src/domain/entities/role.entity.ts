import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { BaseEntity } from 'src/domain/entities/base.entity';

export class Role extends BaseEntity {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: () => [User] })
  users?: User[];
}
