import {
  MAX_SAVED_ADDRESSES,
  type SaveAddressRequest,
} from '@foodhubme/shared';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddressLimitReachedError,
  AddressNotFoundError,
} from './errors/addresses.errors';
import { UserAddressViewDto } from './view-dto/user-address.view-dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string): Promise<UserAddressViewDto[]> {
    const rows = await this.prisma.client.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return rows.map((row) => UserAddressViewDto.mapToView(row));
  }

  async save(
    userId: string,
    input: SaveAddressRequest,
  ): Promise<UserAddressViewDto> {
    const count = await this.prisma.client.userAddress.count({
      where: { userId },
    });
    if (count >= MAX_SAVED_ADDRESSES) throw new AddressLimitReachedError();

    const created = await this.prisma.runInTransaction(async () => {
      await this.clearDefault(userId);

      return this.prisma.client.userAddress.create({
        data: {
          userId,
          address: input.address,
          locality: input.locality ?? null,
          details: input.details ?? null,
          latitude: input.latitude,
          longitude: input.longitude,
          isDefault: true,
        },
      });
    });

    return UserAddressViewDto.mapToView(created);
  }

  async makeDefault(userId: string, id: string): Promise<UserAddressViewDto> {
    const updated = await this.prisma.runInTransaction(async () => {
      const { count } = await this.prisma.client.userAddress.updateMany({
        where: { id, userId },
        data: { isDefault: true },
      });
      if (count === 0) throw new AddressNotFoundError(id);

      await this.clearDefault(userId, id);

      return this.prisma.client.userAddress.findFirst({
        where: { id, userId },
      });
    });

    if (updated === null) throw new AddressNotFoundError(id);

    return UserAddressViewDto.mapToView(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const { count } = await this.prisma.client.userAddress.deleteMany({
        where: { id, userId },
      });

      if (count === 0) throw new AddressNotFoundError(id);

      const stillDefault = await this.prisma.client.userAddress.findFirst({
        where: { userId, isDefault: true },
        select: { id: true },
      });
      if (stillDefault !== null) return;

      const newest = await this.prisma.client.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (newest === null) return;

      await this.prisma.client.userAddress.update({
        where: { id: newest.id },
        data: { isDefault: true },
      });
    });
  }

  private async clearDefault(userId: string, exceptId?: string): Promise<void> {
    await this.prisma.client.userAddress.updateMany({
      where: {
        userId,
        isDefault: true,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: { isDefault: false },
    });
  }
}
