import 'reflect-metadata';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const appCfg = config.getOrThrow<AppConfig>('app');
  await app.listen(appCfg.port);

  Logger.log(
    `Food-Hub backend -> http://localhost:${appCfg.port}/${globalPrefix}`,
    'Bootstrap',
  );
}

void bootstrap();
