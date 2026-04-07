import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';

@SkipThrottle()
@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health / hello' })
  getHello(): string {
    return this.appService.getHello();
  }
}
