import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/api/decorators/current-user.decorator';
import { Roles } from '../auth/api/decorators/roles.decorator';
import { AccessTokenPayload } from '../auth/domain/types/access-token-payload';
import { DevicesService } from './devices.service';
import { ApiRegisterDevice } from './docs/devices.docs';
import { RegisterDeviceInputDto } from './input-dto/register-device.input-dto';

@ApiTags('devices')
@Roles(Role.CLIENT)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRegisterDevice()
  register(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: RegisterDeviceInputDto,
  ): Promise<void> {
    return this.devices.register(user.sub, body.expoPushToken, body.platform);
  }
}
