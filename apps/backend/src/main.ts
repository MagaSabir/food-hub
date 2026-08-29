import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppConfig, EnvironmentConfig } from './config';
import { applyAppInitialization } from './setup/app-initialization';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const appCfg = config.getOrThrow<AppConfig>('app');
  const env = config.getOrThrow<EnvironmentConfig>('environment');

  app.set('trust proxy', 1);
  app.enableShutdownHooks();

  applyAppInitialization(app);
  await app.listen(appCfg.port);
  Logger.log(
    `Backend [${env.nodeEnv}] -> http://localhost:${appCfg.port}/${appCfg.globalPrefix}`,
  );
}
void bootstrap();
