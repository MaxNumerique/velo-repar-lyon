import Dexie, { type Table } from 'dexie';

export interface UserPreference {
  id?: number;
  key: string;
  value: any;
}

export interface SessionData {
  id?: number;
  token: string;
  expiresAt: number;
}

export class VeloDb extends Dexie {
  preferences!: Table<UserPreference>;
  sessions!: Table<SessionData>;

  constructor() {
    super('veloLyonDb');
    this.version(1).stores({
      preferences: '++id, key',
      sessions: '++id, token'
    });
  }
}

export const db = new VeloDb();
