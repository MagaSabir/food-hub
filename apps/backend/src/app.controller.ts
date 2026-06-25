import { AppService } from './app.service';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getInfo(): { name: string; status: string } {
    console.log('fl');
    return this.appService.getInfo();
  }
}
