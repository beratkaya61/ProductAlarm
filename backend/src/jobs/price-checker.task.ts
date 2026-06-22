import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AlarmService } from '../modules/alarm/alarm.service';
import { ScraperService } from '../modules/scraper/scraper.service';
import { WhatsappService } from '../modules/whatsapp/whatsapp.service';

@Injectable()
export class PriceCheckerTask implements OnModuleInit {
  private readonly logger = new Logger(PriceCheckerTask.name);

  constructor(
    private readonly alarmService: AlarmService,
    private readonly scraperService: ScraperService,
    private readonly whatsappService: WhatsappService,
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const intervalMs = this.config.get<number>('PRICE_CHECK_INTERVAL_MS', 180000);
    const interval = setInterval(() => {
      void this.checkPrices();
    }, intervalMs);

    this.schedulerRegistry.addInterval('price-checker', interval);
    this.logger.log(`Price checker interval registered: ${intervalMs}ms`);
  }

  async checkPrices() {
    const alarms = await this.alarmService.findActive();
    if (alarms.length === 0) {
      return;
    }

    for (const alarm of alarms) {
      const offers = await this.scraperService.searchProducts(alarm.searchQuery || alarm.productName);
      if (offers.length === 0) {
        continue;
      }

      const bestOffer = offers.reduce((best, offer) => (offer.price < best.price ? offer : best), offers[0]);

      if (alarm.initialPrice === null) {
        await this.alarmService.setInitialPrice(alarm.id, bestOffer.price, bestOffer.url);
        this.logger.log(`Initial price set for alarm ${alarm.id}: ${bestOffer.price}`);
        continue;
      }

      await this.alarmService.updatePrice(alarm.id, bestOffer.price);
      if (!this.alarmService.shouldTrigger(alarm, bestOffer.price)) {
        continue;
      }

      const targets =
        alarm.targetChatIds.length > 0
          ? alarm.targetChatIds
          : [this.config.get<string>('DEFAULT_WHATSAPP_TARGET') ?? ''].filter(Boolean);

      const message = [
        '*Product Alarm*',
        '',
        `Product: ${alarm.productName}`,
        `Current price: ${bestOffer.price.toLocaleString('tr-TR')} TL`,
        `Initial price: ${alarm.initialPrice.toLocaleString('tr-TR')} TL`,
        `Provider: ${bestOffer.source}`,
        `Link: ${bestOffer.url}`,
      ].join('\n');

      for (const target of targets) {
        await this.whatsappService.sendMessage(target, message);
        await this.delay(this.config.get<number>('WHATSAPP_MESSAGE_DELAY_MS', 1500));
      }

      await this.alarmService.markTriggered(alarm.id);
      this.logger.log(`Alarm triggered: ${alarm.id}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
