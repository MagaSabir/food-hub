import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig, PushConfig } from '../config';
import { QUEUES } from '../queues/queue-names';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { ExpoPushChannel } from './push/expo-push.channel';
import { LogPushChannel } from './push/log-push.channel';
import { PUSH_CHANNEL } from './push/push-channel.interface';
import { PushNotifier } from './push/push.notifier';
import { PushProcessor } from './push/push.processor';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.PUSH })],
  controllers: [DevicesController],
  providers: [
    DevicesService,
    PushNotifier,
    PushProcessor,
    {
      provide: PUSH_CHANNEL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (config.getOrThrow<EnvironmentConfig>('environment').isTest) {
          return new LogPushChannel();
        }

        const push = config.getOrThrow<PushConfig>('push');
        return new ExpoPushChannel(push.expoAccessToken);
      },
    },
  ],
  exports: [PushNotifier],
})
export class NotificationsModule {}
