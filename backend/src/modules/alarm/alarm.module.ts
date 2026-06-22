import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlarmController } from './alarm.controller';
import { AlarmEntity } from './alarm.entity';
import { AlarmService } from './alarm.service';

@Module({
  imports: [TypeOrmModule.forFeature([AlarmEntity])],
  controllers: [AlarmController],
  providers: [AlarmService],
  exports: [AlarmService],
})
export class AlarmModule {}
