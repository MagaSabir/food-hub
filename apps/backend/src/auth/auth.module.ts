import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthController } from './api/auth.controller';
import { LoginUseCase } from './application/usecases/login.usecase';
import { PlatformAdminsRepository } from './infrastructure/repositories/platform-admins.repository';
import { StaffUsersRepository } from './infrastructure/repositories/staff-users.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { PasswordHasher } from './infrastructure/crypto/password-hasher';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    PlatformAdminsRepository,
    StaffUsersRepository,
    PasswordHasher,
  ],
})
export class AuthModule {}
