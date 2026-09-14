import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WsAuthService } from './ws-auth.service';
import { RealtimeNotifier } from './realtime.notifier';
import { ClientGateway } from './gateways/client.gateway';
import { RestaurantGateway } from './gateways/restaurant.gateway';

@Module({
  imports: [AuthModule],
  providers: [
    WsAuthService,
    ClientGateway,
    RestaurantGateway,
    RealtimeNotifier,
  ],
  exports: [RealtimeNotifier],
})
export class RealtimeModule {}
