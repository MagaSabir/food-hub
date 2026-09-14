import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOrCreateByPhone(phone: string): Promise<User> {
    return this.prisma.client.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });
  }

  findActiveById(id: string): Promise<User | null> {
    return this.prisma.client.user.findFirst({
      where: { id, deletedAt: null },
    });
  }
}
