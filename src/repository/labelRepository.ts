/**
 * Chust Textile ERP - Abstrakt Ma'lumotlar Qatlami (Repository Pattern)
 * 
 * Hozirda IndexedDB (va localStorage zaxirasi) orqali to'liq mijoz (offline)
 * rejimida ishlaydi. Kelajakda server yoki Supabase ulanganda faqat shu interfeys
 * orqali yangi Repository klassi kiritiladi, UI va biznes mantig'iga tegilmaydi.
 */

import { BarcodeItem } from '../lib/barcode/types';

export interface ILabelRepository {
  getAll(): Promise<BarcodeItem[]>;
  saveAll(items: BarcodeItem[]): Promise<void>;
  addItem(item: BarcodeItem): Promise<void>;
  updateItem(id: string, updates: Partial<BarcodeItem>): Promise<void>;
  deleteItem(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

const DB_NAME = 'chust_textile_erp_labels';
const STORE_NAME = 'labels_store';
const DB_VERSION = 1;
const LOCAL_STORAGE_KEY = 'chust_barcode_labels_cache';

export class IndexedDBLabelRepository implements ILabelRepository {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB mavjud emas'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };

      request.onerror = (event: any) => {
        console.warn('IndexedDB ochishda xato, localStorage zaxirasiga o\'tiladi:', event);
        reject(event.target.error);
      };
    });

    return this.dbPromise;
  }

  // LocalStorage zaxirasi
  private getLocalCache(): BarcodeItem[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalCache(items: BarcodeItem[]) {
    try {
      // imageUrl katta bo'lsa xotiradan oshib ketmasligi uchun saqlashda imageUrl ni qisqartirish
      const trimmed = items.map(item => ({
        ...item,
        imageUrl: item.imageUrl && item.imageUrl.length > 5000 ? undefined : item.imageUrl
      }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('LocalStorage saqlashda xato:', e);
    }
  }

  async getAll(): Promise<BarcodeItem[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const results = req.result as BarcodeItem[];
          if (!results || results.length === 0) {
            resolve(this.getLocalCache());
          } else {
            resolve(results);
          }
        };

        req.onerror = () => resolve(this.getLocalCache());
      });
    } catch {
      return this.getLocalCache();
    }
  }

  async saveAll(items: BarcodeItem[]): Promise<void> {
    this.saveLocalCache(items);
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        for (const item of items) {
          store.put(item);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('IndexedDB ga to\'liq yozishda xato:', err);
    }
  }

  async addItem(item: BarcodeItem): Promise<void> {
    const list = await this.getAll();
    list.unshift(item);
    await this.saveAll(list);
  }

  async updateItem(id: string, updates: Partial<BarcodeItem>): Promise<void> {
    const list = await this.getAll();
    const index = list.findIndex(i => i.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      await this.saveAll(list);
    }
  }

  async deleteItem(id: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter(i => i.id !== id);
    await this.saveAll(filtered);
  }

  async clearAll(): Promise<void> {
    this.saveLocalCache([]);
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Zaxira tozalandi
    }
  }
}

// Global Repository instansiyasi
export const labelRepository: ILabelRepository = new IndexedDBLabelRepository();
