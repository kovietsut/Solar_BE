import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenEncryptionService } from 'src/shared/services/token-encryption.service';
import { PrismaService } from '../repositories/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DeviceType, Platform } from 'src/shared/enums/device.enum';
import { IAuthService } from './interfaces/auth.service.interface';

interface DeviceInfo {
  deviceId: string;
  deviceType: DeviceType;
  platform: Platform;
  deviceName?: string;
}

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly tokenEncryptor: TokenEncryptionService,
  ) {}

  async login(
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
  }> {
    // Find user by email or phone number
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: username }, { phoneNumber: username }],
        isDeleted: false,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Combine password with securityStamp before comparison
    const combinedPassword = `${password}${user.securityStamp}`;
    const isPasswordValid = await bcrypt.compare(
      combinedPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const jwtId = crypto.randomUUID();
    const payload = { sub: user.id, jwtId, deviceId: deviceInfo.deviceId };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const encryptedAccess = this.tokenEncryptor.encrypt(accessToken);
    const encryptedRefresh = this.tokenEncryptor.encrypt(refreshToken);

    // Check if device already exists
    const existingDevice = await this.prisma.authMethod.findFirst({
      where: {
        userId: user.id,
        deviceId: deviceInfo.deviceId,
        isDeleted: false,
        isRevoked: false,
      },
    });

    if (existingDevice) {
      // Update existing device session
      await this.prisma.authMethod.update({
        where: { id: existingDevice.id },
        data: {
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          jwtId,
          isRevoked: false,
          accessTokenExpiration: new Date(Date.now() + 15 * 60 * 1000),
          refreshTokenExpiration: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
          deviceType: deviceInfo.deviceType,
          platform: deviceInfo.platform,
          deviceName: deviceInfo.deviceName,
          updatedBy: user.id,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new device session
      await this.prisma.authMethod.create({
        data: {
          userId: user.id,
          authType: 'email',
          authId: user.email,
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          jwtId,
          isRevoked: false,
          accessTokenExpiration: new Date(Date.now() + 15 * 60 * 1000),
          refreshTokenExpiration: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
          deviceId: deviceInfo.deviceId,
          deviceType: deviceInfo.deviceType,
          platform: deviceInfo.platform,
          deviceName: deviceInfo.deviceName,
          createdBy: user.id,
        },
      });
    }

    return {
      accessToken,
      refreshToken,
      phoneNumber: user.phoneNumber,
      email: user.email,
      name: user.name,
      avatarPath: user.avatarPath ?? undefined,
      address: user.address ?? undefined,
      deviceId: deviceInfo.deviceId,
      deviceType: deviceInfo.deviceType,
      platform: deviceInfo.platform,
      deviceName: deviceInfo.deviceName,
    };
  }

  async refreshToken(oldToken: string, deviceId: string) {
    const record = await this.prisma.authMethod.findFirst({
      where: {
        deviceId,
        isRevoked: false,
        isDeleted: false,
      },
    });

    if (!record) throw new UnauthorizedException('Token not found');

    const decrypted = this.tokenEncryptor.decrypt(record.refreshToken!);
    if (
      decrypted !== oldToken ||
      !record.refreshTokenExpiration ||
      record.refreshTokenExpiration < new Date()
    ) {
      throw new UnauthorizedException('Token expired or invalid');
    }

    // revoke old token
    await this.prisma.authMethod.update({
      where: { id: record.id },
      data: { isRevoked: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: record.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens
    const jwtId = crypto.randomUUID();
    const payload = { sub: user.id, jwtId, deviceId };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const encryptedAccess = this.tokenEncryptor.encrypt(accessToken);
    const encryptedRefresh = this.tokenEncryptor.encrypt(refreshToken);

    await this.prisma.authMethod.create({
      data: {
        userId: user.id,
        authType: 'email',
        authId: user.email,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        jwtId,
        isRevoked: false,
        accessTokenExpiration: new Date(Date.now() + 15 * 60 * 1000),
        refreshTokenExpiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deviceId: record.deviceId,
        deviceType: record.deviceType,
        platform: record.platform,
        deviceName: record.deviceName,
        createdBy: user.id,
      },
    });

    return { accessToken, refreshToken };
  }

  async logout(deviceId: string) {
    const authMethod = await this.prisma.authMethod.findFirst({
      where: {
        deviceId,
        isRevoked: false,
        isDeleted: false,
      },
      select: {
        userId: true,
      },
    });

    if (!authMethod) return;

    await this.prisma.authMethod.updateMany({
      where: {
        deviceId,
        isRevoked: false,
        isDeleted: false,
      },
      data: {
        isRevoked: true,
        isDeleted: true,
        updatedBy: authMethod.userId,
        updatedAt: new Date(),
      },
    });
  }

  async getActiveDevices(userId: string) {
    const devices = await this.prisma.authMethod.findMany({
      where: {
        userId,
        isRevoked: false,
        isDeleted: false,
      },
      select: {
        deviceId: true,
        deviceType: true,
        platform: true,
        deviceName: true,
        accessTokenExpiration: true,
        refreshTokenExpiration: true,
      },
    });

    return devices.map((device) => ({
      ...device,
      deviceType: device.deviceType as DeviceType,
      platform: device.platform as Platform,
      deviceName: device.deviceName ?? undefined,
      accessTokenExpiration: device.accessTokenExpiration!,
      refreshTokenExpiration: device.refreshTokenExpiration!,
    }));
  }
}
