import Database from 'better-sqlite3';
import { resolve } from 'node:path';

const DB_PATH = resolve(process.cwd(), 'src/data/labels.db');

const DEFAULT_TYPES = [
  ['factory', '#ff79c6'],
  ['wallet', '#50fa7b'],
  ['dex', '#7c3aed'],
  ['token', '#f59e0b'],
  ['locker', '#14b8a6'],
  ['router', '#06b6d4'],
  ['proxy', '#a855f7'],
  ['governance', '#22c55e'],
  ['oracle', '#f97316'],
  ['multisig', '#ec4899'],
  ['lending', '#3b82f6'],
  ['staking', '#eab308'],
  ['positions', '#ef4444'],
  ['multicall', '#fb923c'],
  ['lens', '#2dd4bf'],
  ['hook', '#c084fc'],
  ['threatactor', '#dc2626'],
  ['cex', '#f1fa8c'],
  ['bridge', '#8be9fd'],
  ['mixer', '#ff5555'],
  ['launcher', '#bd93f9'],
  ['other', '#6272a4'],
  ['unknown', '#5c5c5c'],
] as const;

const DEFAULT_CHAINS = [
  ['*', '#f1fa8c'],
  ['arbitrum', '#28a0f0'],
  ['avalanche', '#e84142'],
  ['base', '#0052ff'],
  ['bitcoin', '#f7931a'],
  ['bsc', '#f0b90b'],
  ['ethereum', '#627eea'],
  ['hyperliquid', '#19edb0'],
  ['optimism', '#ff0420'],
  ['polygon', '#8247e5'],
  ['robinhood', '#00c805'],
  ['tron', '#eb0029'],
  ['unichain', '#ff007a'],
] as const;

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
    db.exec(`CREATE TABLE IF NOT EXISTS types (
      name TEXT PRIMARY KEY COLLATE NOCASE,
      color TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    const seedType = db.prepare('INSERT OR IGNORE INTO types (name, color) VALUES (?, ?)');
    db.transaction(() => {
      for (const [name, color] of DEFAULT_TYPES) seedType.run(name, color);
    })();
    db.exec(`CREATE TABLE IF NOT EXISTS chains (
      name TEXT PRIMARY KEY COLLATE NOCASE,
      color TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    const seedChain = db.prepare('INSERT OR IGNORE INTO chains (name, color) VALUES (?, ?)');
    db.transaction(() => {
      for (const [name, color] of DEFAULT_CHAINS) seedChain.run(name, color);
      const existingChains = db.prepare('SELECT DISTINCT chain FROM labels').all() as { chain: string }[];
      for (const { chain } of existingChains) {
        if (/^(?:\*|[a-z0-9][a-z0-9_-]{0,49})$/.test(chain)) seedChain.run(chain, '#5c5c5c');
      }
    })();
  }
  return db;
}
