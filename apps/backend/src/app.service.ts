import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig, EnvironmentConfig } from './config';

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getInfo(): { name: string; env: string; status: string } {
    const app = this.config.getOrThrow<AppConfig>('app');
    const { nodeEnv } =
      this.config.getOrThrow<EnvironmentConfig>('environment');
    return { name: app.name, env: nodeEnv, status: 'ok' };
  }
}
