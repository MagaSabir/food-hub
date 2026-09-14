import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/api/decorators/current-user.decorator';
import { Roles } from '../auth/api/decorators/roles.decorator';
import { AccessTokenPayload } from '../auth/domain/types/access-token-payload';
import { AddressesService } from './addresses.service';
import {
  ApiGetAddresses,
  ApiMakeAddressDefault,
  ApiRemoveAddress,
  ApiSaveAddress,
} from './docs/addresses.docs';
import { SaveAddressInputDto } from './input-dto/save-address.input-dto';
import { UserAddressViewDto } from './view-dto/user-address.view-dto';

@ApiTags('addresses')
@Roles(Role.CLIENT)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  @ApiGetAddresses()
  list(@CurrentUser() user: AccessTokenPayload): Promise<UserAddressViewDto[]> {
    return this.addresses.findMine(user.sub);
  }

  @Post()
  @ApiSaveAddress()
  save(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: SaveAddressInputDto,
  ): Promise<UserAddressViewDto> {
    return this.addresses.save(user.sub, body);
  }

  @Put(':id/default')
  @ApiMakeAddressDefault()
  makeDefault(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserAddressViewDto> {
    return this.addresses.makeDefault(user.sub, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRemoveAddress()
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.addresses.remove(user.sub, id);
  }
}
