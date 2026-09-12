import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import Database from 'better-sqlite3';

test('migrates address collation and preserves chain-specific casing', async () => {
  const originalCwd = process.cwd();
  const workspace = await mkdtemp(join(tmpdir(), 'neegy-address-case-'));
  await mkdir(join(workspace, 'src/data'), { recursive: true });

  const legacy = new Database(join(workspace, 'src/data/labels.db'));
  legacy.exec(`CREATE TABLE labels (
    address TEXT NOT NULL,
    chain TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT DEFAULT 'unknown',
    source TEXT DEFAULT 'manual',
    confidence INTEGER DEFAULT NULL,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (address COLLATE NOCASE, chain)
  )`);
  legacy.prepare('INSERT INTO labels (address, chain, label) VALUES (?, ?, ?)').run('0xAbCd', 'ethereum', 'legacy');
  legacy.close();

  process.chdir(workspace);
  const dbModule = await import(`../db.ts?address-case=${Date.now()}`);
  const lock = new Database(join(workspace, 'src/data/labels.db'));
  lock.exec('BEGIN EXCLUSIVE');
  assert.throws(() => dbModule.getDb(), /locked/);
  lock.exec('ROLLBACK');
  lock.close();
  const database = dbModule.getDb();

  try {
    const schema = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'labels'").get() as { sql: string };
    assert.doesNotMatch(schema.sql, /COLLATE NOCASE/i);
    assert.equal((database.prepare("SELECT address FROM labels WHERE chain = 'ethereum'").get() as { address: string }).address, '0xabcd');
    assert.equal(dbModule.lookupLabels({ address: '0xABCD', chain: 'ethereum' })[0]?.label, 'legacy');

    const upper = 'AbC123SolanaAddress';
    const lower = 'abc123SolanaAddress';
    assert.equal(dbModule.insertLabel({ address: upper, chain: 'solana', label: 'upper' }).address, upper);
    assert.equal(dbModule.insertLabel({ address: lower, chain: 'solana', label: 'lower' }).address, lower);
    assert.equal(dbModule.lookupByAddress(upper)[0]?.label, 'upper');
    assert.equal(dbModule.lookupByAddress(lower)[0]?.label, 'lower');
    assert.equal(dbModule.updateLabel(upper, 'solana', { label: 'updated' }), true);
    assert.equal(dbModule.lookupLabels({ address: upper, chain: 'solana' })[0]?.label, 'updated');
    assert.equal(dbModule.deleteLabel(lower, 'solana'), true);
    assert.equal(dbModule.lookupLabels({ address: lower, chain: 'solana' }).length, 0);
  } finally {
    database.close();
    process.chdir(originalCwd);
    await rm(workspace, { recursive: true, force: true });
  }
});
