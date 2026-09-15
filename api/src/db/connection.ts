import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function createDatabase(dbPath?: string): Database.Database {
  let resolvedPath = dbPath;
  if (!resolvedPath) {
    const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;
    if (isTest) {
      resolvedPath = ':memory:';
    } else {
      const dataDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      resolvedPath = path.join(dataDir, 'database.sqlite');
    }
  }

  const db = new Database(resolvedPath);
  db.pragma('foreign_keys = ON');
  return db;
}
