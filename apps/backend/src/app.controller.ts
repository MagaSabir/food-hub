import { AppService } from './app.service';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getInfo(): { name: string; status: string } {
    return this.appService.getInfo();
  }

  @Get('user')
  async getUser() {
    return this.appService.getUser();
  }
}
