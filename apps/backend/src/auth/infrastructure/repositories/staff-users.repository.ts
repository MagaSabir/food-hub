import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StaffUser } from '@prisma/client';

@Injectable()
export class StaffUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<StaffUser | null> {
    return this.prisma.staffUser.findFirst({
      where: { email, isActive: true },
    });
  }
}
