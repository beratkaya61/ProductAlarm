import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(private readonly dataSource: DataSource) {}

  isConnected(): boolean {
    return this.dataSource.isInitialized;
  }

  async healthCheck(): Promise<{ connected: boolean; database: string }> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.query('SELECT 1');
    }

    return {
      connected: this.dataSource.isInitialized,
      database: this.dataSource.options.database?.toString() ?? '',
    };
  }
}
