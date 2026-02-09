import type { StateStorage } from 'zustand/middleware';
import { keyValueTable } from './db';

export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await keyValueTable.get(name);
      return value ?? null;
    } catch (e) {
      console.error("IndexedDB 데이터 읽기 실패:", e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await keyValueTable.set(name, value);
    } catch (e) {
      console.error("IndexedDB 데이터 저장 실패:", e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await keyValueTable.delete(name);
    } catch (e) {
      console.error("IndexedDB 데이터 삭제 실패:", e);
    }
  },
};
