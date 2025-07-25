import {
  Controller,
  Post,
  Body,
  HttpCode,
  Inject,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JsonUtil } from 'src/shared/utils/json.util';
import { LoginDto } from '../../infrastructure/dtos/auth/login.dto';
import { RefreshTokenDto } from '../../infrastructure/dtos/auth/refresh-token.dto';
import { AuthResponseDto } from '../../infrastructure/dtos/auth/auth-response.dto';
import { AUTH_SERVICE } from 'src/infrastructure/constants/injection-tokens';
import { IAuthService } from 'src/infrastructure/services/interfaces/auth.service.interface';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from 'src/infrastructure/guards/role.guard';
import { CurrentUser } from 'src/infrastructure/decorators/current-user.decorator';
import { Public } from 'src/infrastructure/decorators/public.decorator';
import { RequireRole } from 'src/infrastructure/decorators/require-role.decorator';
import { ROLES } from 'src/shared/constants/roles.constants';

@ApiTags('auths')
@ApiBearerAuth()
@Controller('auths')
@UseGuards(JwtAuthGuard, RoleGuard)
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: IAuthService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with username (email/phone) and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const auth = await this.authService.login(
      loginDto.username,
      loginDto.password,
      {
        deviceId: loginDto.deviceId,
        deviceType: loginDto.deviceType,
        platform: loginDto.platform,
        deviceName: loginDto.deviceName,
      },
    );
    return JsonUtil.success(
      plainToInstance(AuthResponseDto, auth),
      'Login successful',
    );
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refresh successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR, ROLES.NHAXE, ROLES.DRIVER, ROLES.USER)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const auth = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
      refreshTokenDto.deviceId,
    );
    return JsonUtil.success(
      plainToInstance(AuthResponseDto, auth),
      'Token refresh successful',
    );
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout from device' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR, ROLES.NHAXE, ROLES.DRIVER, ROLES.USER)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.deviceId);
    return JsonUtil.success(null, 'Logout successful');
  }

  @Get('devices')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all active devices for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of active devices',
  })
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR, ROLES.NHAXE, ROLES.DRIVER, ROLES.USER)
  async getDevices(@CurrentUser('id') userId: string) {
    const devices = await this.authService.getActiveDevices(userId);
    return JsonUtil.success(devices, 'Devices retrieved successfully');
  }
}
