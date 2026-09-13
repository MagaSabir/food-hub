import { Injectable } from '@nestjs/common';
import type { PlatformAdmin } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PlatformAdminsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByEmail(email: string): Promise<PlatformAdmin | null> {
    return this.prisma.platformAdmin.findFirst({
      where: { email, isActive: true },
    });
  }

  findActiveById(id: string): Promise<PlatformAdmin | null> {
    return this.prisma.platformAdmin.findFirst({
      where: { id, isActive: true },
    });
  }
}
