import { SaleRecord, Currency } from '../types';
import * as XLSX from 'xlsx';

const CATEGORIES = ['Electronics', 'Furniture', 'Clothing', 'Food'];
const REGIONS = ['North', 'South', 'East', 'West'];

// Helper to format currency
export const formatCurrency = (value: number, currency: Currency = 'USD', locale: string = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'PYG' ? 0 : 2, // Guarani usually doesn't use decimals
    maximumFractionDigits: currency === 'PYG' ? 0 : 2,
  }).format(value);
};

// Helper to format date
export const formatDate = (date: Date, locale: string = 'en-US'): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
};

export const generateMockData = (count: number = 500): SaleRecord[] => {
  const data: SaleRecord[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const product = `Product ${Math.floor(Math.random() * 20) + 1}`;
    
    // Simulate some logic where sales relate to quantity but vary randomly
    const quantity = Math.floor(Math.random() * 50) + 1;
    const basePrice = Math.random() * 100 + 10;
    const sales = quantity * basePrice; 
    
    // Profit margin varies between -10% and +30%
    const margin = (Math.random() * 0.4) - 0.1; 
    const profit = sales * margin;

    data.push({
      id: crypto.randomUUID(),
      date,
      category,
      region,
      product,
      quantity,
      sales,
      profit
    });
  }

  // Sort by date ascending for charts
  return data.sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const filterData = (data: SaleRecord[], selectedRegions: string[], selectedCategories: string[]): SaleRecord[] => {
  return data.filter(item => {
    const regionMatch = selectedRegions.length === 0 || selectedRegions.includes(item.region);
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(item.category);
    return regionMatch && categoryMatch;
  });
};

export const parseUploadedFile = async (file: File): Promise<SaleRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const records: SaleRecord[] = jsonData.map((row: any) => {
          // Attempt to map common column names, case insensitive
          const keys = Object.keys(row);
          const getKey = (k: string) => keys.find(key => key.toLowerCase() === k.toLowerCase());

          // Handle Excel dates or string dates
          let date = new Date();
          const rawDate = row[getKey('date') || getKey('data') || getKey('fecha')];
          if (rawDate) {
             // If number (Excel serial date)
             if (typeof rawDate === 'number') {
                date = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
             } else {
                date = new Date(rawDate);
             }
          }

          return {
            id: crypto.randomUUID(),
            date: date,
            category: String(row[getKey('category') || getKey('categoria') || getKey('categoría') || 'Category'] || 'Uncategorized'),
            product: String(row[getKey('product') || getKey('produto') || getKey('producto') || 'Product'] || 'Unknown'),
            region: String(row[getKey('region') || getKey('regiao') || getKey('região') || getKey('región') || 'Region'] || 'Unknown'),
            sales: Number(row[getKey('sales') || getKey('vendas') || getKey('ventas') || 'Sales']) || 0,
            quantity: Number(row[getKey('quantity') || getKey('quantidade') || getKey('qtd') || getKey('cantidad') || 'Quantity']) || 0,
            profit: Number(row[getKey('profit') || getKey('lucro') || getKey('ganancia') || 'Profit']) || 0,
          };
        });

        // Sort by date
        resolve(records.sort((a, b) => a.date.getTime() - b.date.getTime()));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
