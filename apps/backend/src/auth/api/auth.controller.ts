import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { CookieConfig } from '../../config';
import { LoginCommand } from '../application/usecases/login.usecase';
import { LogoutCommand } from '../application/usecases/logout.usecase';
import { RefreshTokenCommand } from '../application/usecases/refresh-token.usecase';
import { GetMeQuery } from '../application/queries/get-me.query';
import {
  OtpRequestResult,
  RequestOtpCommand,
} from '../application/usecases/request-otp.usecase';
import { VerifyOtpCommand } from '../application/usecases/verify-otp.usecase';
import { AccessTokenPayload } from '../domain/types/access-token-payload';
import { AuthTokens } from '../domain/types/auth-subject';
import { RefreshSession } from '../domain/types/refresh-session';
import { CurrentRefreshSession } from './decorators/current-refresh-session.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ApiLogin } from './docs/login.docs';
import { ApiMe } from './docs/me.docs';
import { ApiLogout, ApiRefreshTokens } from './docs/refresh.docs';
import { ApiRequestOtp } from './docs/request-otp.docs';
import { ApiVerifyOtp } from './docs/verify-otp.docs';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { LoginInputDto } from './input-dto/login.input-dto';
import { RequestOtpInputDto } from './input-dto/request-otp.input-dto';
import { VerifyOtpInputDto } from './input-dto/verify-otp.input-dto';
import { clearRefreshCookie, setRefreshCookie } from './refresh-cookie';
import { AuthTokensViewDto } from './view-dto/auth-tokens.view-dto';
import { ClientAuthTokensViewDto } from './view-dto/client-auth-tokens.view-dto';
import { MeViewDto } from './view-dto/me.view-dto';
import { OtpRequestedViewDto } from './view-dto/otp-requested.view-dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiLogin()
  async login(
    @Body() body: LoginInputDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensViewDto> {
    const tokens: AuthTokens = await this.commandBus.execute(
      new LoginCommand({
        email: body.email,
        password: body.password,
        scope: body.scope,
      }),
    );

    return this.respondWithTokens(res, tokens);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiRefreshTokens()
  async refresh(
    @CurrentRefreshSession() session: RefreshSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensViewDto | ClientAuthTokensViewDto> {
    const tokens: AuthTokens = await this.commandBus.execute(
      new RefreshTokenCommand(session),
    );

    return session.source === 'cookie'
      ? this.respondWithTokens(res, tokens)
      : ClientAuthTokensViewDto.create(tokens);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenGuard)
  @ApiLogout()
  async logout(
    @CurrentRefreshSession() session: RefreshSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.commandBus.execute(new LogoutCommand(session));

    clearRefreshCookie(res, this.config.getOrThrow<CookieConfig>('cookie'));
  }

  @Public()
  @Post('phone/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 3_600_000, limit: 100 } })
  @ApiRequestOtp()
  async requestOtp(
    @Body() body: RequestOtpInputDto,
  ): Promise<OtpRequestedViewDto> {
    const result: OtpRequestResult = await this.commandBus.execute(
      new RequestOtpCommand(body.phone, body.channel ?? 'auto'),
    );

    return OtpRequestedViewDto.create(result);
  }

  @Public()
  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 3_600_000, limit: 150 } })
  @ApiVerifyOtp()
  async verifyOtp(
    @Body() body: VerifyOtpInputDto,
  ): Promise<ClientAuthTokensViewDto> {
    const tokens: AuthTokens = await this.commandBus.execute(
      new VerifyOtpCommand(body.phone, body.code),
    );

    return ClientAuthTokensViewDto.create(tokens);
  }

  @Get('me')
  @ApiMe()
  me(@CurrentUser() user: AccessTokenPayload): Promise<MeViewDto> {
    return this.queryBus.execute(new GetMeQuery(user.sub, user.role));
  }

  private respondWithTokens(
    res: Response,
    tokens: AuthTokens,
  ): AuthTokensViewDto {
    setRefreshCookie(
      res,
      this.config.getOrThrow<CookieConfig>('cookie'),
      tokens.refreshToken,
      tokens.refreshTtlSec,
    );

    return AuthTokensViewDto.create(tokens.accessToken);
  }
}
