import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { PrismaService } from '../repositories/prisma.service';
import { TokenEncryptionService } from 'src/shared/services/token-encryption.service';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  jwtId: string;
  deviceId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenEncryptor: TokenEncryptionService,
  ) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    };
    super(options);
  }

  async validate(req: Request, payload: JwtPayload) {
    const deviceId = payload.deviceId;
    const jwtId = payload.jwtId;

    const authMethod = await this.prisma.authMethod.findFirst({
      where: {
        deviceId,
        jwtId,
        isRevoked: false,
        isDeleted: false,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!authMethod) {
      return null;
    }

    return authMethod.user;
  }
}
