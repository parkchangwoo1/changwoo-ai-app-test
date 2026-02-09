import { keyValueTable } from './db';

let migrationComplete = false;

export async function runMigration(): Promise<void> {
  if (migrationComplete) return;

  try {
    await Promise.all([migrateKey('chat-storage'), migrateKey('projects-storage')]);
    migrationComplete = true;
  } catch (e) {
    console.error("localStorage → IndexedDB 마이그레이션 실패:", e);
  }
}

async function migrateKey(key: string): Promise<void> {
  const localData = localStorage.getItem(key);

  if (localData) {
    const existingData = await keyValueTable.get(key);

    if (!existingData) {
      await keyValueTable.set(key, localData);
    }

    localStorage.removeItem(key);
  }
}
