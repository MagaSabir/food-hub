import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig, EnvironmentConfig } from './config';
import { AppInfoViewDto } from './app.view-dto';

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getInfo(): AppInfoViewDto {
    const app = this.config.getOrThrow<AppConfig>('app');
    const { nodeEnv } =
      this.config.getOrThrow<EnvironmentConfig>('environment');
    return { name: app.name, env: nodeEnv, status: 'ok' };
  }
}
