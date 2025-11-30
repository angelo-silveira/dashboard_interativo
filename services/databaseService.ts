import { SaleRecord } from '../types';

const STORAGE_KEY_DATA = 'dashboard_data_db';
const STORAGE_KEY_USER = 'dashboard_user_session';

export interface User {
  id: string;
  email: string;
  name: string;
  token: string;
}

// Simulated Backend Database
export const dbService = {
  
  // 1. Authentication
  login: async (email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Hardcoded logic for demo purposes (would be a real DB call)
    // Accept admin@admin.com or any email containing "admin"
    if ((email === 'admin@admin.com' && password === '1234') || 
        (email.includes('admin') && password.length >= 3)) {
      
      const user: User = {
        id: 'u-123456',
        email: email,
        name: email.split('@')[0],
        token: 'mock-jwt-token-' + Date.now()
      };
      
      // Save session
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      return user;
    }

    throw new Error('Invalid credentials');
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_USER);
  },

  getCurrentUser: (): User | null => {
    const json = localStorage.getItem(STORAGE_KEY_USER);
    return json ? JSON.parse(json) : null;
  },

  // 2. Data Persistence (The "Database" for Dashboard Content)
  saveDashboardData: async (data: SaleRecord[]) => {
    try {
      // In a real app, this POSTs to an API. Here we use IndexedDB or LocalStorage.
      // We'll use LocalStorage for simplicity in this demo environment, 
      // but serialize dates properly.
      const serialized = JSON.stringify(data);
      // Check size limit roughly
      if (serialized.length > 4500000) {
        console.warn("Data too large for LocalStorage database simulation.");
        return false;
      }
      localStorage.setItem(STORAGE_KEY_DATA, serialized);
      return true;
    } catch (e) {
      console.error("Database save error", e);
      return false;
    }
  },

  getDashboardData: async (): Promise<SaleRecord[] | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const json = localStorage.getItem(STORAGE_KEY_DATA);
    if (!json) return null;

    try {
      const parsed = JSON.parse(json);
      // Revive dates
      return parsed.map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));
    } catch (e) {
      console.error("Database load error", e);
      return null;
    }
  },

  clearDatabase: () => {
    localStorage.removeItem(STORAGE_KEY_DATA);
  }
};