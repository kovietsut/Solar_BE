import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RoleModule } from './api/modules/role.module';
import { PrismaService } from './infrastructure/repositories/prisma.service';
import { UserModule } from './api/modules/user.module';
import { AuthModule } from './api/modules/auth.module';
import { RoleGuard } from './infrastructure/guards/role.guard';
import { PermissionGuard } from './infrastructure/guards/permission.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RoleModule,
    UserModule,
    AuthModule,
  ],
  providers: [PrismaService, RoleGuard, PermissionGuard],
})
export class AppModule {}
