import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { MeViewDto } from '../../api/view-dto/me.view-dto';

@Injectable()
export class AuthQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(subjectId: string, role: Role): Promise<MeViewDto | null> {
    if (role === Role.PLATFORM_ADMIN) {
      const admin = await this.prisma.client.platformAdmin.findFirst({
        where: { id: subjectId, isActive: true },
      });

      return admin ? MeViewDto.fromAdmin(admin) : null;
    }

    if (role === Role.CLIENT) {
      const user = await this.prisma.client.user.findFirst({
        where: { id: subjectId, deletedAt: null },
      });

      return user ? MeViewDto.fromUser(user) : null;
    }

    const staff = await this.prisma.client.staffUser.findFirst({
      where: { id: subjectId, isActive: true },
    });

    return staff ? MeViewDto.fromStaff(staff) : null;
  }
}
