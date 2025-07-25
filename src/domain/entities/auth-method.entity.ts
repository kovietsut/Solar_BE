import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { DeviceType, Platform } from 'src/shared/enums/device.enum';

export class AuthMethod extends BaseEntity {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  authType: string;

  @ApiProperty()
  authId: string;

  @ApiProperty({ required: false })
  accessToken?: string;

  @ApiProperty({ required: false })
  refreshToken?: string;

  @ApiProperty({ required: false })
  jwtId?: string;

  @ApiProperty()
  isRevoked: boolean;

  @ApiProperty()
  accessTokenExpiration: Date;

  @ApiProperty()
  refreshTokenExpiration: Date;

  @ApiProperty()
  deviceId: string;

  @ApiProperty({ enum: DeviceType })
  deviceType: DeviceType;

  @ApiProperty({ enum: Platform })
  platform: Platform;

  @ApiProperty({ required: false })
  deviceName?: string;

  @ApiProperty({ type: () => User })
  user?: User;
}
