import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { LoginInputDto } from './input-dto/login.input-dto';
import { AuthTokensViewDto } from './view-dto/auth-tokens.view-dto';
import { LoginCommand } from '../application/usecases/login.usecase';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginInputDto): Promise<AuthTokensViewDto> {
    return this.commandBus.execute(
      new LoginCommand({
        email: body.email,
        password: body.password,
        scope: body.scope,
      }),
    );
  }
}
