export interface ScraperProviderDefinition {
  id: string;
  name: string;
  baseUrl: string;
  searchUrl: string;
  productUrlIncludes: string[];
  selectors: {
    productName: string[];
    productPrice: string[];
  };
}
