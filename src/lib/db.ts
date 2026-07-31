import Database from 'better-sqlite3';
import { resolve } from 'node:path';

const DB_PATH = resolve(process.cwd(), 'src/data/labels.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
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

export interface Label {
  address: string;
  chain: string;
  label: string;
  type: string;
  source: string;
  added_at: string;
}

export interface LabelInput {
  address: string;
  chain: string;
  label: string;
  type?: string;
  source?: string;
}

export function lookupLabels(params: {
  address?: string;
  chain?: string;
  limit?: number;
  offset?: number;
}): Label[] {
  const d = getDb();
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (params.address) {
    conditions.push('address = ?');
    values.push(params.address.toLowerCase());
  }
  if (params.chain) {
    conditions.push('chain = ?');
    values.push(params.chain);
  }

  const where = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const limit = Math.min(params.limit ?? 50, 200);
  const offset = params.offset ?? 0;

  const stmt = d.prepare(
    `SELECT * FROM labels ${where} ORDER BY added_at DESC LIMIT ? OFFSET ?`,
  );
  return stmt.all(...values, limit, offset) as Label[];
}

export function lookupByAddress(address: string): Label[] {
  const d = getDb();
  const stmt = d.prepare(
    'SELECT * FROM labels WHERE address = ? ORDER BY chain',
  );
  return stmt.all(address.toLowerCase()) as Label[];
}

export function insertLabel(input: LabelInput): Label {
  const d = getDb();
  const stmt = d.prepare(
    `INSERT OR REPLACE INTO labels (address, chain, label, type, source, added_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
  );
  stmt.run(
    input.address.toLowerCase(),
    input.chain,
    input.label,
    input.type ?? 'unknown',
    input.source ?? 'manual',
  );
  return lookupLabels({ address: input.address, chain: input.chain })[0];
}

export function deleteLabel(address: string, chain: string): boolean {
  const d = getDb();
  const stmt = d.prepare(
    'DELETE FROM labels WHERE address = ? AND chain = ?',
  );
  const result = stmt.run(address.toLowerCase(), chain);
  return result.changes > 0;
}

export function getDistinctChains(): string[] {
  const d = getDb();
  const rows = d.prepare(
    'SELECT DISTINCT chain FROM labels ORDER BY chain',
  ).all() as { chain: string }[];
  return rows.map((r) => r.chain);
}

export function getDistinctTypes(): string[] {
  const d = getDb();
  const rows = d.prepare(
    'SELECT DISTINCT type FROM labels ORDER BY type',
  ).all() as { type: string }[];
  return rows.map((r) => r.type);
}

export function getChainCounts(): { chain: string; count: number }[] {
  const d = getDb();
  return d.prepare(
    'SELECT chain, COUNT(*) as count FROM labels GROUP BY chain ORDER BY count DESC',
  ).all() as { chain: string; count: number }[];
}

export function getRecentLabels(limit = 20): Label[] {
  return lookupLabels({ limit });
}

// ── API tokens ──────────────────────────────────────────────

export interface ApiToken {
  id: string;
  name: string;
  hash: string;
  created_at: string;
  last_used_at: string | null;
}

export function insertToken(id: string, name: string, hash: string): ApiToken {
  const d = getDb();
  d.prepare(
    'INSERT INTO api_tokens (id, name, hash) VALUES (?, ?, ?)',
  ).run(id, name, hash);
  return d.prepare('SELECT * FROM api_tokens WHERE id = ?').get(id) as ApiToken;
}

export function getAllTokens(): ApiToken[] {
  const d = getDb();
  return d.prepare(
    'SELECT * FROM api_tokens ORDER BY created_at DESC',
  ).all() as ApiToken[];
}

export function getTokenHash(tokenId: string): string | null {
  const d = getDb();
  const row = d.prepare(
    'SELECT hash FROM api_tokens WHERE id = ?',
  ).get(tokenId) as { hash: string } | undefined;
  return row?.hash ?? null;
}

export function touchToken(tokenId: string): void {
  const d = getDb();
  d.prepare(
    "UPDATE api_tokens SET last_used_at = datetime('now') WHERE id = ?",
  ).run(tokenId);
}

export function deleteToken(tokenId: string): boolean {
  const d = getDb();
  const result = d.prepare('DELETE FROM api_tokens WHERE id = ?').run(tokenId);
  return result.changes > 0;
}
