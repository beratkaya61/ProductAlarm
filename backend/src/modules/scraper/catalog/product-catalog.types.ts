export interface CatalogDevice {
  id: string;
  name: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  devices: CatalogDevice[];
}
