import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { configLoaders } from './config';
import { envValidationSchema } from './config/env.validation';

const NODE_ENV = process.env.NODE_ENV || 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configLoaders,
      validationSchema: envValidationSchema,
      envFilePath: [`env/.env.${NODE_ENV}`, 'env/.env'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
