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
  ['*', '#f1fa8c', null],
  ['arbitrum', '#28a0f0', 'https://arbiscan.io'],
  ['avalanche', '#e84142', 'https://snowtrace.io'],
  ['base', '#0052ff', 'https://basescan.org'],
  ['bitcoin', '#f7931a', 'https://mempool.space'],
  ['bsc', '#f0b90b', 'https://bscscan.com'],
  ['ethereum', '#627eea', 'https://etherscan.io'],
  ['hyperliquid', '#19edb0', 'https://hyperliquid.cloud'],
  ['optimism', '#ff0420', 'https://optimistic.etherscan.io'],
  ['polygon', '#8247e5', 'https://polygonscan.com'],
  ['robinhood', '#00c805', 'https://rh-scan.com'],
  ['tron', '#eb0029', 'https://tronscan.org/#'],
  ['unichain', '#ff007a', 'https://uniscan.xyz'],
] as const;

let db: Database.Database | null = null;

function createLabelsTable(database: Database.Database, table: string): void {
  database.exec(`CREATE TABLE IF NOT EXISTS ${table} (
    address TEXT NOT NULL,
    chain TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT DEFAULT 'unknown',
    source TEXT DEFAULT 'manual',
    confidence INTEGER DEFAULT NULL,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (address, chain)
  )`);
}

function migrateLabelsAddressCollation(database: Database.Database): void {
  const row = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'labels'").get() as { sql: string };
  if (!/address\s+COLLATE\s+NOCASE/i.test(row.sql)) return;

  database.transaction(() => {
    database.exec('DROP TABLE IF EXISTS labels_binary');
    createLabelsTable(database, 'labels_binary');
    const before = (database.prepare('SELECT COUNT(*) AS count FROM labels').get() as { count: number }).count;
    database.exec(`INSERT INTO labels_binary (address, chain, label, type, source, confidence, added_at)
      SELECT CASE WHEN LOWER(TRIM(chain)) = 'solana' THEN address ELSE LOWER(address) END,
        chain, label, type, source, confidence, added_at FROM labels`);
    const after = (database.prepare('SELECT COUNT(*) AS count FROM labels_binary').get() as { count: number }).count;
    if (before !== after) throw new Error(`labels migration count mismatch: ${before} != ${after}`);
    database.exec('DROP TABLE labels');
    database.exec('ALTER TABLE labels_binary RENAME TO labels');
  })();
}

export function getDb(): Database.Database {
  if (db) return db;

  const database = new Database(DB_PATH);
  try {
    database.pragma('journal_mode = WAL');
    database.pragma('foreign_keys = ON');
    createLabelsTable(database, 'labels');
    try { database.exec(`ALTER TABLE labels ADD COLUMN confidence INTEGER DEFAULT NULL`); } catch {}
    migrateLabelsAddressCollation(database);
    database.exec(`CREATE TABLE IF NOT EXISTS api_tokens (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_used_at TEXT
    )`);
    database.exec(`CREATE TABLE IF NOT EXISTS types (
      name TEXT PRIMARY KEY COLLATE NOCASE,
      color TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    const seedType = database.prepare('INSERT OR IGNORE INTO types (name, color) VALUES (?, ?)');
    database.transaction(() => {
      for (const [name, color] of DEFAULT_TYPES) seedType.run(name, color);
    })();
    database.exec(`CREATE TABLE IF NOT EXISTS chains (
      name TEXT PRIMARY KEY COLLATE NOCASE,
      color TEXT NOT NULL,
      explorer_base_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    const chainColumns = database.pragma('table_info(chains)') as { name: string }[];
    if (!chainColumns.some(({ name }) => name === 'explorer_base_url')) {
      database.exec('ALTER TABLE chains ADD COLUMN explorer_base_url TEXT');
    }
    const seedChain = database.prepare('INSERT OR IGNORE INTO chains (name, color, explorer_base_url) VALUES (?, ?, ?)');
    const seedExplorer = database.prepare('UPDATE chains SET explorer_base_url = ? WHERE name = ? AND explorer_base_url IS NULL');
    database.transaction(() => {
      for (const [name, color, explorerBaseUrl] of DEFAULT_CHAINS) {
        seedChain.run(name, color, explorerBaseUrl);
        if (explorerBaseUrl) seedExplorer.run(explorerBaseUrl, name);
      }
      const existingChains = database.prepare('SELECT DISTINCT chain FROM labels').all() as { chain: string }[];
      for (const { chain } of existingChains) {
        if (/^(?:\*|[a-z0-9][a-z0-9_-]{0,49})$/.test(chain)) seedChain.run(chain, '#5c5c5c', null);
      }
    })();
    db = database;
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}
