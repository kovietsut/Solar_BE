import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { DeviceType, Platform } from 'src/shared/enums/device.enum';

export class LoginDto {
  @ApiProperty({ description: 'Username (email or phone number)' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'Unique device identifier' })
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @ApiProperty({ enum: DeviceType, description: 'Type of device' })
  @IsNotEmpty()
  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @ApiProperty({ enum: Platform, description: 'Platform of device' })
  @IsNotEmpty()
  @IsEnum(Platform)
  platform: Platform;

  @ApiProperty({ description: 'Name of the device', required: false })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
