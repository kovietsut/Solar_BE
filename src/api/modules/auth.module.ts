import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'src/infrastructure/repositories/prisma.service';
import { AuthService } from 'src/infrastructure/services/auth.service';
import { TokenEncryptionService } from 'src/shared/services/token-encryption.service';
import { AuthController } from '../controllers/auth.controller';
import { AUTH_SERVICE } from 'src/infrastructure/constants/injection-tokens';
import { JwtStrategy } from 'src/infrastructure/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_SERVICE,
      useClass: AuthService,
    },
    TokenEncryptionService,
    PrismaService,
    JwtStrategy,
  ],
  exports: [AUTH_SERVICE],
})
export class AuthModule {}
