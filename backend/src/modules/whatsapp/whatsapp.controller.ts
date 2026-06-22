import { Body, Controller, Get, Post } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('api/whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  status() {
    return { success: true, data: this.whatsappService.getStatus() };
  }

  @Get('qr')
  qr() {
    return { success: true, data: this.whatsappService.getQrCode() };
  }

  @Get('groups')
  async groups() {
    return { success: true, data: await this.whatsappService.listChats() };
  }

  @Post('test-message')
  async testMessage(@Body() body: { chatIds?: string[] }) {
    const chatIds = body.chatIds ?? [];
    const message = [
      '*Product Alarm test*',
      '',
      'Bu mesaj secili WhatsApp grubuna test amaciyla gonderildi.',
    ].join('\n');

    const results = [];
    for (const chatId of chatIds) {
      results.push({
        chatId,
        sent: await this.whatsappService.sendMessage(chatId, message),
      });
    }

    return { success: true, data: results };
  }

  @Post('disconnect')
  async disconnect() {
    await this.whatsappService.disconnect();
    return { success: true };
  }
}
