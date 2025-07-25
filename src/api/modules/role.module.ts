import { Module } from '@nestjs/common';
import { RoleController } from '../controllers/role.controller';
import { RoleService } from 'src/infrastructure/services/role.service';
import { RoleRepository } from 'src/infrastructure/repositories/role.repository';
import { PrismaService } from 'src/infrastructure/repositories/prisma.service';
import {
  ROLE_SERVICE,
  ROLE_REPOSITORY,
} from 'src/infrastructure/constants/injection-tokens';

@Module({
  controllers: [RoleController],
  providers: [
    {
      provide: ROLE_SERVICE,
      useClass: RoleService,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleRepository,
    },
    PrismaService,
  ],
  exports: [ROLE_SERVICE],
})
export class RoleModule {}
