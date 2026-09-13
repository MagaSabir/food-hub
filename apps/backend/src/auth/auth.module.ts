import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthController } from './api/auth.controller';
import { LoginUseCase } from './application/usecases/login.usecase';
import { PlatformAdminsRepository } from './infrastructure/repositories/platform-admins.repository';
import { StaffUsersRepository } from './infrastructure/repositories/staff-users.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { PasswordHasher } from './infrastructure/crypto/password-hasher';
import {
  ACCESS_JWT_SERVICE,
  REFRESH_JWT_SERVICE,
} from './constants/auth.constants';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AuthConfig } from '../config';
import { AuthTokenService } from './application/services/auth-token.service';
import { SessionIssuer } from './application/services/session-issuer.service';
import { SessionsRepository } from './infrastructure/repositories/sessions.repository';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    PlatformAdminsRepository,
    StaffUsersRepository,
    PasswordHasher,
    AuthTokenService,
    SessionIssuer,
    SessionsRepository,
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
  ],
})
export class AuthModule {}
