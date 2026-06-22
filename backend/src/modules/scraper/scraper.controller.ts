import { Controller, Get, Query } from '@nestjs/common';
import { CatalogService } from './catalog/catalog.service';
import { ScraperService } from './scraper.service';

@Controller('api/products')
export class ScraperController {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly catalogService: CatalogService,
  ) {}

  @Get('catalog')
  catalog() {
    return { success: true, data: this.catalogService.findAll() };
  }

  @Get('search')
  async search(@Query('query') query = '') {
    return { success: true, data: await this.scraperService.searchProducts(query) };
  }
}
