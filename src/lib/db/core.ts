import Database from 'better-sqlite3';
import { resolve } from 'node:path';

const DB_PATH = resolve(process.cwd(), 'src/data/labels.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(`CREATE TABLE IF NOT EXISTS labels (
      address TEXT NOT NULL,
      chain TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT DEFAULT 'unknown',
      source TEXT DEFAULT 'manual',
      confidence INTEGER DEFAULT NULL,
      added_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (address COLLATE NOCASE, chain)
    )`);
    try { db.exec(`ALTER TABLE labels ADD COLUMN confidence INTEGER DEFAULT NULL`); } catch {}
    db.exec(`CREATE TABLE IF NOT EXISTS api_tokens (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_used_at TEXT
    )`);
  }
  return db;
}
