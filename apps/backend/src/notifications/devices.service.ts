import { DevicePlatform } from '@foodhubme/shared';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    userId: string,
    expoPushToken: string,
    platform: DevicePlatform | undefined,
  ): Promise<void> {
    await this.prisma.client.userDevice.upsert({
      where: { expoPushToken },
      update: { userId, platform, lastActiveAt: new Date() },
      create: { userId, expoPushToken, platform },
    });
  }

  async tokensOf(userId: string): Promise<string[]> {
    const devices = await this.prisma.client.userDevice.findMany({
      where: { userId },
      select: { expoPushToken: true },
    });

    return devices.map((d) => d.expoPushToken);
  }

  async forget(expoPushTokens: string[]): Promise<void> {
    if (expoPushTokens.length === 0) return;

    await this.prisma.client.userDevice.deleteMany({
      where: { expoPushToken: { in: expoPushTokens } },
    });
  }
}
