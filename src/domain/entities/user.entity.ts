import { ApiProperty } from '@nestjs/swagger';
import { Role } from './role.entity';
import { BaseEntity } from 'src/domain/entities/base.entity';
import { AuthMethod } from './auth-method.entity';

export class User extends BaseEntity {
  @ApiProperty()
  roleId: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  passwordHash: string;

  @ApiProperty()
  securityStamp: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatarPath?: string | null;

  @ApiProperty({ required: false })
  address?: string | null;

  @ApiProperty({ type: () => Role })
  role?: Role;

  @ApiProperty({ type: () => [AuthMethod] })
  authMethods?: AuthMethod[];
}
