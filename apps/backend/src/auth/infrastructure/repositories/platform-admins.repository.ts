import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformAdmin } from '@prisma/client';

@Injectable()
export class PlatformAdminsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<PlatformAdmin | null> {
    return this.prisma.platformAdmin.findFirst({
      where: { email, isActive: true },
    });
  }
}
