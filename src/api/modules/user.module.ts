import { Module } from '@nestjs/common';
import { UserController } from '../controllers/user.controller';
import { UserService } from 'src/infrastructure/services/user.service';
import { UserRepository } from 'src/infrastructure/repositories/user.repository';
import { PrismaService } from 'src/infrastructure/repositories/prisma.service';
import {
  USER_SERVICE,
  USER_REPOSITORY,
} from 'src/infrastructure/constants/injection-tokens';

@Module({
  controllers: [UserController],
  providers: [
    {
      provide: USER_SERVICE,
      useClass: UserService,
    },
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    PrismaService,
  ],
  exports: [USER_SERVICE],
})
export class UserModule {}
