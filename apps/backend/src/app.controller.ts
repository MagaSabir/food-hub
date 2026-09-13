import { AppService } from './app.service';
import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/api/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getInfo(): { name: string; status: string } {
    return this.appService.getInfo();
  }
}
