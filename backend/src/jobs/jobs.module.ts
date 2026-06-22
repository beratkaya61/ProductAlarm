import { Module } from '@nestjs/common';
import { AlarmModule } from '../modules/alarm/alarm.module';
import { ScraperModule } from '../modules/scraper/scraper.module';
import { WhatsappModule } from '../modules/whatsapp/whatsapp.module';
import { PriceCheckerTask } from './price-checker.task';

@Module({
  imports: [AlarmModule, ScraperModule, WhatsappModule],
  providers: [PriceCheckerTask],
})
export class JobsModule {}
