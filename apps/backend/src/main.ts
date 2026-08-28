import 'reflect-metadata';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config';
import { appInitialization } from './setup/app-initialization';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  appInitialization(app, config);

  const appCfg = config.getOrThrow<AppConfig>('app');
  await app.listen(appCfg.port);

  Logger.log(
    `Food-Hub backend -> http://localhost:${appCfg.port}/${appCfg.globalPrefix}`,
    'Bootstrap',
  );
}

void bootstrap();
