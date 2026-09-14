import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AuthConfig } from '../config';
import { AuthController } from './api/auth.controller';
import { AccessTokenGuard } from './api/guards/access-token.guard';
import { RefreshTokenGuard } from './api/guards/refresh-token.guard';
import { RolesGuard } from './api/guards/roles.guard';
import { GetMeQueryHandler } from './application/queries/get-me.query';
import { AuthTokenService } from './application/services/auth-token.service';
import { SessionIssuer } from './application/services/session-issuer.service';
import { LoginUseCase } from './application/usecases/login.usecase';
import { LogoutUseCase } from './application/usecases/logout.usecase';
import { RefreshTokenUseCase } from './application/usecases/refresh-token.usecase';
import { RequestOtpUseCase } from './application/usecases/request-otp.usecase';
import { VerifyOtpUseCase } from './application/usecases/verify-otp.usecase';
import {
  ACCESS_JWT_SERVICE,
  REFRESH_JWT_SERVICE,
} from './constants/auth.constants';
import { AuthQueryRepository } from './infrastructure/repositories/auth.query-repository';
import { LoginAttemptsRepository } from './infrastructure/repositories/login-attempts.repository';
import { OtpRepository } from './infrastructure/repositories/otp.repository';
import { LogOtpSender } from './infrastructure/otp-sender/log-otp-sender';
import { OTP_SENDER } from './infrastructure/otp-sender/otp-sender.interface';
import { PasswordHasher } from './infrastructure/crypto/password-hasher';
import { PlatformAdminsRepository } from './infrastructure/repositories/platform-admins.repository';
import { SessionsRepository } from './infrastructure/repositories/sessions.repository';
import { StaffUsersRepository } from './infrastructure/repositories/staff-users.repository';
import { UsersRepository } from './infrastructure/repositories/users.repository';

const jwtProviders = [
  {
    provide: ACCESS_JWT_SERVICE,
    inject: [ConfigService],
    useFactory: (config: ConfigService): JwtService => {
      const auth = config.getOrThrow<AuthConfig>('auth');
      return new JwtService({
        secret: auth.accessSecret,
        signOptions: {
          expiresIn: auth.accessExpiresIn as JwtSignOptions['expiresIn'],
        },
      });
    },
  },
  {
    provide: REFRESH_JWT_SERVICE,
    inject: [ConfigService],
    useFactory: (config: ConfigService): JwtService => {
      const auth = config.getOrThrow<AuthConfig>('auth');
      return new JwtService({
        secret: auth.refreshSecret,
        signOptions: {
          expiresIn: auth.refreshExpiresIn as JwtSignOptions['expiresIn'],
        },
      });
    },
  },
];

@Module({
  imports: [CqrsModule],
  controllers: [AuthController],
  providers: [
    ...jwtProviders,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    RequestOtpUseCase,
    VerifyOtpUseCase,
    GetMeQueryHandler,
    { provide: OTP_SENDER, useClass: LogOtpSender },
    AuthTokenService,
    SessionIssuer,
    RefreshTokenGuard,
    AccessTokenGuard,
    RolesGuard,
    SessionsRepository,
    StaffUsersRepository,
    PlatformAdminsRepository,
    AuthQueryRepository,
    OtpRepository,
    LoginAttemptsRepository,
    UsersRepository,
    PasswordHasher,
  ],
  exports: [AccessTokenGuard, RolesGuard, AuthTokenService],
})
export class AuthModule {}
