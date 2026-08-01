import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import type { User } from './types.ts';

const AUTH_DB_PATH = resolve(process.cwd(), 'src/data/auth.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(AUTH_DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
  }
  return db;
}

export function getUserByUsername(username: string): User | undefined {
  const d = getDb();
  return d.prepare(
    'SELECT * FROM users WHERE username = ?',
  ).get(username.toLowerCase()) as User | undefined;
}

export function createUser(id: string, username: string, hash: string): User {
  const d = getDb();
  d.prepare(
    'INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)',
  ).run(id, username.toLowerCase(), hash);
  return d.prepare('SELECT * FROM users WHERE id = ?').get(id) as User;
}

export function userCount(): number {
  const d = getDb();
  const row = d.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  return row.count;
}
