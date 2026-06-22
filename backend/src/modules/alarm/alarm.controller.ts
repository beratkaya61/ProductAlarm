import { Body, Controller, Get, Post } from '@nestjs/common';
import { AlarmService } from './alarm.service';
import { CreateAlarmDto } from './dto/create-alarm.dto';

@Controller('api/alarms')
export class AlarmController {
  constructor(private readonly alarmService: AlarmService) {}

  @Post()
  async create(@Body() dto: CreateAlarmDto) {
    return { success: true, data: await this.alarmService.createAlarm(dto) };
  }

  @Get()
  async findAll() {
    return { success: true, data: await this.alarmService.findAll() };
  }
}
