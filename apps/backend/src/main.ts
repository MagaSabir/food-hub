import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { applyAppInitialization } from './setup/app-initialization';
import { AppConfig, EnvironmentConfig } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const appCfg = config.getOrThrow<AppConfig>('app');
  const env = config.getOrThrow<EnvironmentConfig>('environment');

  app.set('trust proxy', 1);
  app.enableShutdownHooks();

  applyAppInitialization(app);

  await app.listen(appCfg.port);

  Logger.log(
    `FoodHub backend [${env.nodeEnv}] → http://localhost:${appCfg.port}/${appCfg.globalPrefix}`,
    'Bootstrap',
  );
}

void bootstrap();
