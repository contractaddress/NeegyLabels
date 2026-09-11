import { getDb } from './core.ts';
import type { Label, LabelInput, LabelUpdate } from '../types.ts';

const DANGEROUS_ADDR_CHARS = /['"<>`\x00-\x1f\x7f]/;

function normalizeAddress(address: string): string {
  const a = address.toLowerCase();
  if (DANGEROUS_ADDR_CHARS.test(a)) {
    throw new Error('Invalid address: contains disallowed characters');
  }
  return a;
}

export function lookupLabels(params: {
  address?: string;
  chain?: string;
  type?: string;
  label?: string;
  limit?: number;
  offset?: number;
}): Label[] {
  const d = getDb();
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (params.address) { conditions.push('address = ?'); values.push(params.address.toLowerCase()); }
  if (params.chain)   { conditions.push('chain = ?');   values.push(params.chain); }
  if (params.type)    { conditions.push('type = ?');    values.push(params.type); }
  if (params.label)   { conditions.push('label LIKE ?'); values.push(`%${params.label}%`); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(params.limit ?? 50, 500000);
  const offset = params.offset ?? 0;

  const stmt = d.prepare(`SELECT * FROM labels ${where} ORDER BY added_at DESC LIMIT ? OFFSET ?`);
  return stmt.all(...values, limit, offset) as Label[];
}

export function lookupByAddress(address: string): Label[] {
  const d = getDb();
  return d.prepare('SELECT * FROM labels WHERE address = ? ORDER BY chain').all(address.toLowerCase()) as Label[];
}

export function insertLabel(input: LabelInput): Label {
  const d = getDb();
  const address = normalizeAddress(input.address);
  d.prepare(
    `INSERT OR REPLACE INTO labels (address, chain, label, type, source, confidence, added_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
  ).run(address, input.chain, input.label, input.type ?? 'unknown', input.source ?? 'manual', input.confidence ?? null);
  return lookupLabels({ address, chain: input.chain })[0];
}

export function deleteLabel(address: string, chain: string): boolean {
  const d = getDb();
  const result = d.prepare('DELETE FROM labels WHERE address = ? AND chain = ?').run(address.toLowerCase(), chain);
  return result.changes > 0;
}

export function updateLabel(address: string, chain: string, fields: LabelUpdate): boolean {
  const d = getDb();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (fields.label !== undefined)      { sets.push('label = ?');      values.push(fields.label); }
  if (fields.type !== undefined)       { sets.push('type = ?');       values.push(fields.type); }
  if (fields.source !== undefined)     { sets.push('source = ?');     values.push(fields.source); }
  if (fields.confidence !== undefined) { sets.push('confidence = ?'); values.push(fields.confidence); }

  if (sets.length === 0) return false;
  values.push(address.toLowerCase(), chain);
  return d.prepare(`UPDATE labels SET ${sets.join(', ')} WHERE address = ? AND chain = ?`).run(...values).changes > 0;
}

export function getDistinctChains(): string[] {
  const d = getDb();
  return (d.prepare('SELECT DISTINCT chain FROM labels ORDER BY chain').all() as { chain: string }[]).map(r => r.chain);
}

export function getDistinctTypes(): string[] {
  const d = getDb();
  return (d.prepare('SELECT DISTINCT type FROM labels WHERE type IS NOT NULL ORDER BY type').all() as { type: string }[]).map(r => r.type);
}

export function getChainCounts(): { chain: string; count: number }[] {
  const d = getDb();
  return d.prepare('SELECT chain, COUNT(*) as count FROM labels GROUP BY chain ORDER BY count DESC').all() as { chain: string; count: number }[];
}

export function getTypeCounts(): { type: string; count: number }[] {
  const d = getDb();
  return d.prepare('SELECT type, COUNT(*) as count FROM labels GROUP BY type ORDER BY count DESC').all() as { type: string; count: number }[];
}

export function getRecentLabels(limit = 20): Label[] {
  return lookupLabels({ limit });
}

export function getLabelCount(): number {
  const d = getDb();
  return (d.prepare('SELECT COUNT(*) as count FROM labels').get() as { count: number }).count;
}
