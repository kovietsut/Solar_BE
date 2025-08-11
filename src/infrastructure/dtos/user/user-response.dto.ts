import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { User } from '../../../domain/entities/user.entity';
import { Role } from '../../../domain/entities/role.entity';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  roleId: string;

  @Expose()
  @ApiProperty()
  phoneNumber: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty({ required: false })
  avatarPath?: string | null;

  @Expose()
  @ApiProperty({ required: false })
  address?: string | null;

  @Expose()
  @ApiProperty({ type: () => Role })
  role?: Role;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  @Expose()
  @ApiProperty()
  isDeleted: boolean;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
