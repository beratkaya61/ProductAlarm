import axios from 'axios';
import * as cheerio from 'cheerio';

const provider = {
  id: 'mediamarkt',
  name: 'MediaMarkt',
  baseUrl: 'https://www.mediamarkt.com.tr',
  searchUrl: 'https://www.mediamarkt.com.tr/tr/search.html?query={query}',
  productUrlIncludes: ['/tr/product/'],
  selectors: {
    productName: ['h1', '[data-test="product-title"]'],
    productPrice: ['[data-test="product-price"]', '.price', '.sc-'],
  },
};

function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isRelevantProductName(name: string, query: string): boolean {
  const normalizedName = normalizeSearchText(name);
  const nameTokens = normalizedName.split(' ');
  const ignoredTokens = new Set(['gb', 'tb', 'gps', 'tv', '4k', '5g']);
  const tokens = normalizeSearchText(query)
    .split(' ')
    .filter((token) => token.length >= 2 && !ignoredTokens.has(token));

  if (tokens.length === 0) return true;
  if (!tokens.every((token) => normalizedName.includes(token))) return false;

  const blacklistWords = ['yenilenmis', 'refurbished', 'outlet', 'teshir', 'revize', 'kullanilmis', 'kalite', 'yenilio', 'easycep', 'getmobil'];
  for (const word of blacklistWords) {
    if (!tokens.includes(word) && nameTokens.includes(word)) return false;
  }

  const accessoryWords = ['kilif', 'koruyucu', 'sarj', 'adaptor', 'kablo', 'kulaklik', 'askisi', 'cam', 'lens', 'standi', 'kilifi', 'cantasi', 'canta'];
  for (const word of accessoryWords) {
    if (!tokens.includes(word) && nameTokens.includes(word)) return false;
  }

  return true;
}

async function test() {
  const query = 'Apple iPhone 15 128 GB';
  const url = provider.searchUrl.replace('{query}', encodeURIComponent(query));
  console.log('Fetching MediaMarkt search page:', url);
  try {
    const response = await axios.get<string>(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.7,en;q=0.6',
        'Accept-Encoding': 'gzip, deflate, br',
        Referer: 'https://www.google.com/',
      }
    });

    const $ = cheerio.load(response.data);
    let count = 0;

    $('a').each((_, element) => {
      const anchor = $(element);
      const href = anchor.attr('href');
      if (!href) return;

      const container = anchor.closest('div, li, article, [data-component-type]');
      const name = (
        anchor.text() ||
        anchor.attr('aria-label') ||
        anchor.attr('title') ||
        container.find('h2, h3, [data-test="product-title"], .product-title, .a-size-medium').first().text()
      )
        .replace(/\s+/g, ' ')
        .trim();

      const absoluteUrl = new URL(href, url).toString();
      const isLikelyUrl = absoluteUrl.startsWith(provider.baseUrl) && provider.productUrlIncludes.some((fragment) => absoluteUrl.includes(fragment));

      if (isLikelyUrl && name.length >= 8) {
        count++;
        const relevant = isRelevantProductName(name, query);
        console.log(`\nLink [${count}]:`);
        console.log(`  Name: "${name}"`);
        console.log(`  URL:  ${absoluteUrl}`);
        console.log(`  Is Relevant: ${relevant}`);
      }
    });

    console.log(`\nTotal potential product links scanned: ${count}`);

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

test();
