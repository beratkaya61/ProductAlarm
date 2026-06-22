import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { ProductOfferEntity } from './product-offer.entity';
import { SCRAPER_PROVIDERS } from './providers/provider-list';
import { ScraperProviderDefinition } from './providers/scraper-provider.types';
import { ProductSearchResult, ProductSnapshot } from './scraper.types';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
  ];

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(ProductOfferEntity)
    private readonly offerRepository: Repository<ProductOfferEntity>,
  ) {}

  async searchProducts(query: string): Promise<ProductSearchResult[]> {
    const normalized = query.trim();
    if (!normalized) {
      return [];
    }

    const providers = this.getEnabledProviders();
    const results: ProductSearchResult[] = [];

    for (const provider of providers) {
      await this.waitWithJitter();
      const providerResults = await this.searchProvider(provider, normalized);
      results.push(...providerResults);

      if (results.length >= this.config.get<number>('SCRAPER_MAX_TOTAL_RESULTS', 24)) {
        break;
      }
    }

    const uniqueResults = this.uniqueByUrl(results).slice(
      0,
      this.config.get<number>('SCRAPER_MAX_TOTAL_RESULTS', 24),
    );
    return this.saveOffers(normalized, uniqueResults);
  }

  async fetchProductSnapshot(url: string): Promise<ProductSnapshot | null> {
    const provider = this.findProviderByUrl(url);
    try {
      const response = await axios.get<string>(url, this.requestOptions());
      const $ = cheerio.load(response.data);
      const name = this.pickText($, provider?.selectors.productName ?? ['h1', '.product-name']);
      const priceText = this.pickText($, provider?.selectors.productPrice ?? ['.price', '.product-price']);
      const price = this.parsePrice(priceText) ?? this.parsePrice($('body').text());

      if (!price) {
        this.logger.warn(`Price not found for ${url}`);
        return null;
      }

      return {
        name: name || url,
        price,
        url,
        source: provider?.name ?? new URL(url).hostname,
      };
    } catch (error) {
      this.logger.warn(`Product snapshot failed for ${url}: ${(error as Error).message}`);
      return null;
    }
  }

  private async searchProvider(
    provider: ScraperProviderDefinition,
    query: string,
  ): Promise<ProductSearchResult[]> {
    const url = provider.searchUrl.replace('{query}', encodeURIComponent(query));
    try {
      const response = await axios.get<string>(url, this.requestOptions());
      const $ = cheerio.load(response.data);
      const candidates: ProductSearchResult[] = [];
      const links: Array<{ href: string; name: string; text: string }> = [];

      $('a').each((_, element) => {
        const anchor = $(element);
        const href = anchor.attr('href');
        const container = anchor.closest('div, li, article, [data-component-type]');
        const name = (
          anchor.text() ||
          anchor.attr('aria-label') ||
          anchor.attr('title') ||
          container.find('h2, h3, [data-test="product-title"], .product-title, .a-size-medium').first().text()
        )
          .replace(/\s+/g, ' ')
          .trim();
        const price = this.parsePrice(container.text());

        if (!href || name.length < 8 || !this.isRelevantProductName(name, query)) {
          return;
        }

        const absoluteUrl = new URL(href, url).toString();
        if (!this.isLikelyProductUrl(provider, absoluteUrl)) {
          return;
        }

        links.push({ href: absoluteUrl, name, text: container.text() });
      });

      for (const link of links) {
        const price = this.parsePrice(link.text);
        if (!this.isValidPrice(price)) {
          const snapshot = await this.fetchProductSnapshot(link.href);
          if (!snapshot || !this.isValidPrice(snapshot.price)) {
            continue;
          }
          candidates.push({
            id: createHash('sha1').update(link.href).digest('hex'),
            name: snapshot.name.slice(0, 160),
            price: snapshot.price,
            url: link.href,
            source: provider.name,
            providerId: provider.id,
          });
          await this.waitWithJitter();
          continue;
        }

        candidates.push({
          id: createHash('sha1').update(link.href).digest('hex'),
          name: link.name.slice(0, 160),
          price,
          url: link.href,
          source: provider.name,
          providerId: provider.id,
        });
      }

      return this.uniqueByUrl(candidates).slice(
        0,
        this.config.get<number>('SCRAPER_MAX_RESULTS_PER_PROVIDER', 6),
      );
    } catch (error) {
      this.logger.warn(`Search failed for ${provider.name}: ${(error as Error).message}`);
      return [];
    }
  }

  private requestOptions() {
    return {
      timeout: this.config.get<number>('SCRAPER_TIMEOUT_MS', 15000),
      headers: {
        'User-Agent': this.randomUserAgent(),
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.7,en;q=0.6',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Referer: 'https://www.google.com/',
        DNT: '1',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Dest': 'document',
        Pragma: 'no-cache',
      },
    };
  }

  private getEnabledProviders(): ScraperProviderDefinition[] {
    const enabled = this.config
      .get<string>('SCRAPER_ENABLED_PROVIDERS', '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (enabled.length === 0) {
      return SCRAPER_PROVIDERS;
    }

    return SCRAPER_PROVIDERS.filter((provider) => enabled.includes(provider.id));
  }

  private findProviderByUrl(url: string): ScraperProviderDefinition | undefined {
    return SCRAPER_PROVIDERS.find((provider) => url.startsWith(provider.baseUrl));
  }

  private isLikelyProductUrl(provider: ScraperProviderDefinition, url: string): boolean {
    return (
      url.startsWith(provider.baseUrl) &&
      provider.productUrlIncludes.some((fragment) => url.includes(fragment))
    );
  }

  private randomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private async waitWithJitter(): Promise<void> {
    const min = this.config.get<number>('SCRAPER_REQUEST_DELAY_MIN_MS', 900);
    const max = this.config.get<number>('SCRAPER_REQUEST_DELAY_MAX_MS', 2400);
    const delay = Math.floor(Math.random() * Math.max(max - min, 0)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private pickText($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const value = $(selector).first().text().replace(/\s+/g, ' ').trim();
      if (value) {
        return value;
      }
    }
    return '';
  }

  private parsePrice(text: string): number | null {
    const match = text.match(
      /(?:₺\s*([0-9]{1,3}(?:[.\s][0-9]{3})*(?:,[0-9]{1,2})?|[0-9]+(?:,[0-9]{1,2})?)|([0-9]{1,3}(?:[.\s][0-9]{3})*(?:,[0-9]{1,2})?|[0-9]+(?:,[0-9]{1,2})?)\s*(?:TL|TRY|₺))/i,
    );
    if (!match) {
      return null;
    }
    const normalized = (match[1] ?? match[2]).replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const value = Number.parseFloat(normalized);
    return Number.isFinite(value) ? value : null;
  }

  private isValidPrice(price: number | null): price is number {
    return price !== null && price >= this.config.get<number>('SCRAPER_MIN_PRICE', 1000);
  }

  private isRelevantProductName(name: string, query: string): boolean {
    const normalizedName = this.normalizeSearchText(name);
    const nameTokens = normalizedName.split(' ');
    const ignoredTokens = new Set(['gb', 'tb', 'gps', 'tv', '4k', '5g']);
    const tokens = this.normalizeSearchText(query)
      .split(' ')
      .filter((token) => token.length >= 2 && !ignoredTokens.has(token));

    if (tokens.length === 0) {
      return true;
    }

    if (!tokens.every((token) => normalizedName.includes(token))) {
      return false;
    }

    if (!tokens.includes('yenilenmis') && (nameTokens.includes('yenilenmis') || nameTokens.includes('refurbished'))) {
      return false;
    }

    const variantTokens = ['pro', 'plus', 'ultra', 'max', 'mini'];
    const queryTokenSet = new Set(tokens);
    return !variantTokens.some((token) => nameTokens.includes(token) && !queryTokenSet.has(token));
  }

  private normalizeSearchText(value: string): string {
    return value
      .toLocaleLowerCase('tr-TR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private uniqueByUrl(results: ProductSearchResult[]): ProductSearchResult[] {
    const seen = new Set<string>();
    return results.filter((item) => {
      if (seen.has(item.url)) {
        return false;
      }
      seen.add(item.url);
      return true;
    });
  }

  private async saveOffers(query: string, results: ProductSearchResult[]): Promise<ProductSearchResult[]> {
    const saved: ProductSearchResult[] = [];

    for (const result of results) {
      const existing = await this.offerRepository.findOne({
        where: { query, providerId: result.providerId, url: result.url },
      });
      const now = new Date();

      if (existing) {
        const previousPrice = Number(existing.price);
        existing.name = result.name;
        existing.providerName = result.source;
        existing.previousPrice = existing.price;
        existing.price = result.price.toString();
        existing.lastSeenAt = now;
        const entity = await this.offerRepository.save(existing);
        saved.push(this.toSearchResult(entity, previousPrice));
        continue;
      }

      const entity = await this.offerRepository.save(
        this.offerRepository.create({
          query,
          providerId: result.providerId,
          providerName: result.source,
          name: result.name,
          url: result.url,
          price: result.price.toString(),
          previousPrice: null,
          lastSeenAt: now,
        }),
      );
      saved.push(this.toSearchResult(entity));
    }

    return saved;
  }

  private toSearchResult(entity: ProductOfferEntity, previousPrice?: number): ProductSearchResult {
    return {
      id: entity.id,
      name: entity.name,
      price: Number(entity.price),
      url: entity.url,
      source: entity.providerName,
      providerId: entity.providerId,
      previousPrice: previousPrice ?? (entity.previousPrice === null ? undefined : Number(entity.previousPrice)),
      lastSeenAt: entity.lastSeenAt.toISOString(),
    };
  }
}
