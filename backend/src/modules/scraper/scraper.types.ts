export interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  url: string;
  source: string;
  providerId: string;
  previousPrice?: number;
  lastSeenAt?: string;
}

export interface ProductSnapshot {
  name: string;
  price: number;
  url: string;
  source: string;
}
