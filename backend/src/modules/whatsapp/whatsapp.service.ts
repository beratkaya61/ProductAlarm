import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { rmSync } from 'node:fs';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import * as QRCode from 'qrcode';
import { WhatsappChatSummary, WhatsappQrCode, WhatsappStatus } from './whatsapp.types';

@Injectable()
export class WhatsappService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(WhatsappService.name);
  private client?: Client;
  private ready = false;
  private qrCodeDataUrl: string | null = null;
  private qrCodeGeneratedAt: string | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (!this.config.get<boolean>('WHATSAPP_ENABLED')) {
      this.logger.warn('WhatsApp client is disabled. Set WHATSAPP_ENABLED=true to start it.');
      return;
    }

    this.cleanupChromeProfileLocks();

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
      puppeteer: {
        headless: true,
        executablePath: this.config.get<string>('PUPPETEER_EXECUTABLE_PATH') || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      },
    });

    this.client.on('qr', async (qr) => {
      this.logger.log('Scan this QR code from WhatsApp linked devices.');
      qrcode.generate(qr, { small: true });
      this.qrCodeDataUrl = await QRCode.toDataURL(qr, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320,
      });
      this.qrCodeGeneratedAt = new Date().toISOString();
    });

    this.client.on('ready', () => {
      this.ready = true;
      this.qrCodeDataUrl = null;
      this.qrCodeGeneratedAt = null;
      this.logger.log('WhatsApp client is ready.');
    });

    this.client.on('disconnected', () => {
      this.ready = false;
      this.qrCodeDataUrl = null;
      this.qrCodeGeneratedAt = null;
      this.logger.warn('WhatsApp client disconnected.');
    });

    void this.initializeClient();
  }

  private async initializeClient(retry = true): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.initialize();
    } catch (error) {
      this.logger.warn(`WhatsApp initialization failed: ${(error as Error).message}`);
      if (!retry) {
        return;
      }

      this.cleanupChromeProfileLocks();
      await this.initializeClient(false);
    }
  }

  async onApplicationShutdown() {
    if (!this.client) {
      return;
    }

    try {
      await this.client.destroy();
    } catch (error) {
      this.logger.warn(`WhatsApp client shutdown failed: ${(error as Error).message}`);
    } finally {
      this.ready = false;
      this.qrCodeDataUrl = null;
      this.qrCodeGeneratedAt = null;
    }
  }

  private cleanupChromeProfileLocks(): void {
    const lockPaths = [
      '.wwebjs_auth/session/SingletonLock',
      '.wwebjs_auth/session/SingletonCookie',
      '.wwebjs_auth/session/SingletonSocket',
      '.wwebjs_auth/session/lockfile',
    ];

    for (const path of lockPaths) {
      try {
        rmSync(path, { force: true });
      } catch (error) {
        this.logger.debug(`Chrome lock cleanup skipped for ${path}: ${(error as Error).message}`);
      }
    }
  }

  getStatus(): WhatsappStatus {
    return {
      enabled: this.config.get<boolean>('WHATSAPP_ENABLED') ?? false,
      ready: this.ready,
      hasQrCode: Boolean(this.qrCodeDataUrl),
    };
  }

  getQrCode(): WhatsappQrCode {
    return {
      available: Boolean(this.qrCodeDataUrl),
      dataUrl: this.qrCodeDataUrl,
      generatedAt: this.qrCodeGeneratedAt,
    };
  }

  async listChats(): Promise<WhatsappChatSummary[]> {
    if (!this.client || !this.ready) {
      return [];
    }

    const chats = await this.client.getChats();
    return chats
      .filter((chat) => chat.isGroup)
      .map((chat) => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async sendMessage(chatId: string, message: string): Promise<boolean> {
    if (!this.client || !this.ready) {
      this.logger.warn(`Message skipped because WhatsApp is not ready: ${chatId}`);
      return false;
    }

    await this.client.sendMessage(chatId, message);
    return true;
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      this.logger.log('Disconnecting/Logging out WhatsApp client...');
      await this.client.logout();
      this.ready = false;
      this.qrCodeDataUrl = null;
      this.qrCodeGeneratedAt = null;
    } catch (error) {
      this.logger.warn(`WhatsApp disconnect failed: ${(error as Error).message}`);
      // Fallback: client.destroy ve yeniden başlatma
      try {
        await this.client.destroy();
      } catch (err) {}
      
      try {
        const fs = require('node:fs');
        fs.rmSync('.wwebjs_auth', { recursive: true, force: true });
      } catch (e) {}

      this.ready = false;
      this.qrCodeDataUrl = null;
      this.qrCodeGeneratedAt = null;

      // Yeniden ayağa kaldır
      this.onModuleInit();
    }
  }
}
