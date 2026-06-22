import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogService } from './catalog/catalog.service';
import { ProductOfferEntity } from './product-offer.entity';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOfferEntity])],
  controllers: [ScraperController],
  providers: [ScraperService, CatalogService],
  exports: [ScraperService],
})
export class ScraperModule {}
