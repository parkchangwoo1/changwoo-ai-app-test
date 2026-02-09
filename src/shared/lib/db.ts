import Dexie, { type EntityTable } from 'dexie';
import type { Conversation, Project } from '@/shared/types';

export interface AppDatabase extends Dexie {
  conversations: EntityTable<Conversation, 'id'>;
  projects: EntityTable<Project, 'id'>;
  keyValue: EntityTable<{ key: string; value: string }, 'key'>;
}

export const db = new Dexie('changwoo-ai-app') as AppDatabase;

db.version(1).stores({
  conversations: 'id, projectId, updatedAt, createdAt',
  projects: 'id, updatedAt, createdAt',
  keyValue: 'key',
});

export const keyValueTable = {
  async get(key: string): Promise<string | undefined> {
    const item = await db.keyValue.get(key);
    return item?.value;
  },

  async set(key: string, value: string): Promise<void> {
    await db.keyValue.put({ key, value });
  },

  async delete(key: string): Promise<void> {
    await db.keyValue.delete(key);
  },
};
