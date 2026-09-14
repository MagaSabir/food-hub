import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server, ServerOptions } from 'socket.io';
import { CorsConfig } from '../config';
import { PubSubClients } from '../redis/pubsub.clients';

export function setupWebsockets(
  app: INestApplication,
  config: ConfigService,
): void {
  const cors = config.getOrThrow<CorsConfig>('cors');
  app.useWebSocketAdapter(new RealtimeIoAdapter(app, cors));
}

class RealtimeIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RealtimeIoAdapter.name);

  constructor(
    private readonly app: INestApplication,
    private readonly cors: CorsConfig,
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions): unknown {
    const server = super.createIOServer(port, {
      ...options,
      cors: this.cors,
    }) as Server;

    const { publisher, subscriber } = this.app.get(PubSubClients);
    server.adapter(createAdapter(publisher, subscriber));
    this.logger.log('WebSocket: события синхронизируются через Redis');

    return server;
  }
}
