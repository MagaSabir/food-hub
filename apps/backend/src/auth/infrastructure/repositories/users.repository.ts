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

  async updateName(id: string, name: string): Promise<User | null> {
    const { count } = await this.prisma.client.user.updateMany({
      where: { id, deletedAt: null },
      data: { name },
    });

    if (count === 0) return null;

    return this.findActiveById(id);
  }

  findActiveById(id: string): Promise<User | null> {
    return this.prisma.client.user.findFirst({
      where: { id, deletedAt: null },
    });
  }
}
