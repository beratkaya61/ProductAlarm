import { Injectable } from '@nestjs/common';
import { PRODUCT_CATALOG } from './product-catalog';
import { CatalogCategory } from './product-catalog.types';

@Injectable()
export class CatalogService {
  findAll(): CatalogCategory[] {
    return PRODUCT_CATALOG;
  }
}
