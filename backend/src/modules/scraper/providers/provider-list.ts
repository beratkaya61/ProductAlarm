import { ScraperProviderDefinition } from './scraper-provider.types';

export const SCRAPER_PROVIDERS: ScraperProviderDefinition[] = [
  {
    id: 'vatan',
    name: 'Vatan Bilgisayar',
    baseUrl: 'https://www.vatanbilgisayar.com',
    searchUrl: 'https://www.vatanbilgisayar.com/arama/{query}',
    productUrlIncludes: ['/urun/', '/cep-telefonu-modelleri/', '/notebook/'],
    selectors: {
      productName: ['h1', '.product-list__product-name', '.product-name'],
      productPrice: ['.product-list__price', '.product-price', '.price'],
    },
  },
  {
    id: 'teknosa',
    name: 'Teknosa',
    baseUrl: 'https://www.teknosa.com',
    searchUrl: 'https://www.teknosa.com/arama/?s={query}',
    productUrlIncludes: ['/urunler/', '/p/'],
    selectors: {
      productName: ['h1', '.product-name', '[data-test="product-title"]'],
      productPrice: ['.prd-prc2', '.product-price', '[data-test="product-price"]', '.price'],
    },
  },
  {
    id: 'mediamarkt',
    name: 'MediaMarkt',
    baseUrl: 'https://www.mediamarkt.com.tr',
    searchUrl: 'https://www.mediamarkt.com.tr/tr/search.html?query={query}',
    productUrlIncludes: ['/tr/product/'],
    selectors: {
      productName: ['h1', '[data-test="product-title"]'],
      productPrice: ['[data-test="product-price"]', '.price', '.sc-'],
    },
  },
  {
    id: 'hepsiburada',
    name: 'Hepsiburada',
    baseUrl: 'https://www.hepsiburada.com',
    searchUrl: 'https://www.hepsiburada.com/ara?q={query}',
    productUrlIncludes: ['-p-', '/'],
    selectors: {
      productName: ['h1', '[data-test-id="title"]', '.product-name'],
      productPrice: ['[data-test-id="price-current-price"]', '[data-test-id="price"]', '.price'],
    },
  },
  {
    id: 'trendyol',
    name: 'Trendyol',
    baseUrl: 'https://www.trendyol.com',
    searchUrl: 'https://www.trendyol.com/sr?q={query}',
    productUrlIncludes: ['-p-'],
    selectors: {
      productName: ['h1', '.pr-new-br', '.product-name'],
      productPrice: ['.prc-dsc', '.product-price-container', '.price'],
    },
  },
  {
    id: 'n11',
    name: 'n11',
    baseUrl: 'https://www.n11.com',
    searchUrl: 'https://www.n11.com/arama?q={query}',
    productUrlIncludes: ['/urun/'],
    selectors: {
      productName: ['h1', '.proName', '.product-name'],
      productPrice: ['.newPrice', '.priceContainer', '.price'],
    },
  },
  {
    id: 'amazon-tr',
    name: 'Amazon TR',
    baseUrl: 'https://www.amazon.com.tr',
    searchUrl: 'https://www.amazon.com.tr/s?k={query}',
    productUrlIncludes: ['/dp/', '/gp/product/'],
    selectors: {
      productName: ['#productTitle', 'h1'],
      productPrice: ['.a-price .a-offscreen', '#corePrice_feature_div .a-offscreen'],
    },
  },
];
