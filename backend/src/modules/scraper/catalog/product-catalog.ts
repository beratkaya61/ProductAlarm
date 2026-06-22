import { CatalogCategory } from './product-catalog.types';

export const PRODUCT_CATALOG: CatalogCategory[] = [
  {
    id: 'phones',
    name: 'Telefonlar',
    devices: [
      { id: 'iphone-15-128', name: 'Apple iPhone 15 128 GB' },
      { id: 'iphone-16-128', name: 'Apple iPhone 16 128 GB' },
      { id: 'iphone-16-pro-256', name: 'Apple iPhone 16 Pro 256 GB' },
      { id: 'samsung-s24-256', name: 'Samsung Galaxy S24 256 GB' },
      { id: 'samsung-s24-ultra-256', name: 'Samsung Galaxy S24 Ultra 256 GB' },
      { id: 'xiaomi-14t-256', name: 'Xiaomi 14T 256 GB' },
      { id: 'redmi-note-13-pro', name: 'Redmi Note 13 Pro' },
    ],
  },
  {
    id: 'smart-watches',
    name: 'Akilli Saatler',
    devices: [
      { id: 'apple-watch-series-10', name: 'Apple Watch Series 10 GPS' },
      { id: 'apple-watch-ultra-2', name: 'Apple Watch Ultra 2' },
      { id: 'samsung-watch-7', name: 'Samsung Galaxy Watch 7' },
      { id: 'huawei-watch-gt5', name: 'Huawei Watch GT 5' },
      { id: 'xiaomi-watch-s3', name: 'Xiaomi Watch S3' },
    ],
  },
  {
    id: 'televisions',
    name: 'Televizyonlar',
    devices: [
      { id: 'samsung-55-qled', name: 'Samsung 55 QLED 4K Smart TV' },
      { id: 'samsung-65-qled', name: 'Samsung 65 QLED 4K Smart TV' },
      { id: 'lg-65-oled', name: 'LG 65 OLED 4K Smart TV' },
      { id: 'philips-55-ambilight', name: 'Philips 55 Ambilight 4K TV' },
      { id: 'sony-bravia-55', name: 'Sony Bravia 55 4K Google TV' },
    ],
  },
  {
    id: 'game-consoles',
    name: 'Oyun Konsollari',
    devices: [
      { id: 'playstation-5-slim', name: 'Sony PlayStation 5 Slim' },
      { id: 'playstation-5-pro', name: 'Sony PlayStation 5 Pro' },
      { id: 'xbox-series-x', name: 'Microsoft Xbox Series X' },
      { id: 'nintendo-switch-oled', name: 'Nintendo Switch OLED' },
    ],
  },
  {
    id: 'laptops',
    name: 'Bilgisayarlar',
    devices: [
      { id: 'macbook-air-m3-13', name: 'Apple MacBook Air M3 13' },
      { id: 'macbook-pro-m4-14', name: 'Apple MacBook Pro M4 14' },
      { id: 'lenovo-loq-15', name: 'Lenovo LOQ 15 Gaming Notebook' },
      { id: 'asus-tuf-a15', name: 'Asus TUF Gaming A15' },
      { id: 'msi-thin-15', name: 'MSI Thin 15 Gaming Notebook' },
    ],
  },
];
