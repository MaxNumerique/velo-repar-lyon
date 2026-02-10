import Dexie from 'dexie';

export class VeloDb extends Dexie {
  constructor() {
    super('veloLyonDb');
    this.version(1).stores({
      preferences: '++id, key',
      sessions: '++id, token'
    });
  }
}

export const db = new VeloDb();
