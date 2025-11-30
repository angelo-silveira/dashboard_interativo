export interface SaleRecord {
  id: string;
  date: Date;
  category: string;
  product: string;
  region: string;
  sales: number;
  quantity: number;
  profit: number;
}

export interface FilterState {
  regions: string[];
  categories: string[];
}

export interface AggregatedData {
  categoryData: { name: string; value: number }[];
  timeData: { date: string; sales: number }[];
}

export type Language = 'en' | 'pt' | 'es';
export type Theme = 'light' | 'dark';
export type Currency = 'BRL' | 'USD' | 'ARS' | 'PYG' | 'UYU';
