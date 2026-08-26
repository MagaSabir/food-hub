import 'reflect-metadata';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  await app.listen(3000);

  Logger.log(`Food-Hub backend -> http://localhost:3000`, 'Bootstrap');
}

void bootstrap();
