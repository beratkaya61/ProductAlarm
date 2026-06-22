import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { AlarmModule } from './modules/alarm/alarm.module';
import { DatabaseModule } from './modules/database/database.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    WhatsappModule,
    ScraperModule,
    AlarmModule,
    JobsModule,
  ],
})
export class AppModule {}
