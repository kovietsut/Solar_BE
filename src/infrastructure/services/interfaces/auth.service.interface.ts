import { DeviceType, Platform } from 'src/shared/enums/device.enum';

interface DeviceInfo {
  deviceId: string;
  deviceType: DeviceType;
  platform: Platform;
  deviceName?: string;
}

export interface IAuthService {
  login(
    username: string,
    password: string,
    deviceInfo: DeviceInfo,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    phoneNumber: string;
    email: string;
    name: string;
    avatarPath?: string;
    address?: string;
    deviceId: string;
    deviceType: DeviceType;
    platform: Platform;
    deviceName?: string;
  }>;

  refreshToken(
    oldToken: string,
    deviceId: string,
  ): Promise<{ accessToken: string; refreshToken: string }>;

  logout(deviceId: string): Promise<void>;

  getActiveDevices(userId: string): Promise<
    {
      deviceId: string;
      deviceType: DeviceType;
      platform: Platform;
      deviceName?: string;
      accessTokenExpiration: Date;
      refreshTokenExpiration: Date;
    }[]
  >;
}
