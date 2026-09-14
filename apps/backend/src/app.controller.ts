import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/api/decorators/public.decorator';
import { AppService } from './app.service';
import { AppInfoViewDto } from './app.view-dto';

@ApiTags('service')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Что отвечает по этому адресу',
    description:
      'Имя приложения и окружение — чтобы одним запросом убедиться, что ' +
      'открыт тот самый сервис и тот самый стенд (первое, что проверяешь, ' +
      'когда деплой поехал не туда). Живость зависимостей — GET /health.',
  })
  @ApiOkResponse({ type: AppInfoViewDto })
  getInfo(): AppInfoViewDto {
    return this.appService.getInfo();
  }
}
