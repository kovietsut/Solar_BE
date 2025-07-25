import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { DeviceType, Platform } from 'src/shared/enums/device.enum';

@Exclude()
export class AuthResponseDto {
  @Expose()
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @Expose()
  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;

  @Expose()
  @ApiProperty({ description: 'User phone number' })
  phoneNumber: string;

  @Expose()
  @ApiProperty({ description: 'User email address' })
  email: string;

  @Expose()
  @ApiProperty({ description: 'User full name' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'User avatar path' })
  avatarPath: string;

  @Expose()
  @ApiProperty({ description: 'User address' })
  address: string;

  @Expose()
  @ApiProperty({ description: 'Device identifier' })
  deviceId: string;

  @Expose()
  @ApiProperty({ enum: DeviceType, description: 'Type of device' })
  deviceType: DeviceType;

  @Expose()
  @ApiProperty({ enum: Platform, description: 'Platform of device' })
  platform: Platform;

  @Expose()
  @ApiProperty({ description: 'Name of the device', required: false })
  deviceName?: string;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
