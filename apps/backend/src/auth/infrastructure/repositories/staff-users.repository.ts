import { Injectable } from '@nestjs/common';
import type { StaffUser } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class StaffUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByEmail(email: string): Promise<StaffUser | null> {
    return this.prisma.staffUser.findFirst({
      where: { email, isActive: true },
    });
  }

  findActiveById(id: string): Promise<StaffUser | null> {
    return this.prisma.staffUser.findFirst({
      where: { id, isActive: true },
    });
  }
}
