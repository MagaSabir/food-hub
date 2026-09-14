import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const configMock: Partial<ConfigService> = {
      getOrThrow: (key: string) => {
        if (key === 'app') return { name: 'foodhub' };
        if (key === 'environment') return { nodeEnv: 'test' };
        throw new Error(`unexpected config key: ${key}`);
      },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: ConfigService, useValue: configMock }],
    }).compile();

    controller = moduleRef.get(AppController);
  });

  it('возвращает имя, окружение и статус ok', () => {
    expect(controller.getInfo()).toEqual({
      name: 'foodhub',
      env: 'test',
      status: 'ok',
    });
  });
});
