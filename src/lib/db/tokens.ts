import { getDb } from './core.ts';
import type { ApiToken } from '../types.ts';

export function insertToken(id: string, name: string, hash: string): ApiToken {
  const d = getDb();
  d.prepare('INSERT INTO api_tokens (id, name, hash) VALUES (?, ?, ?)').run(id, name, hash);
  return d.prepare('SELECT * FROM api_tokens WHERE id = ?').get(id) as ApiToken;
}

export function getAllTokens(): ApiToken[] {
  const d = getDb();
  return d.prepare('SELECT * FROM api_tokens ORDER BY created_at DESC').all() as ApiToken[];
}

export function getTokenHash(tokenId: string): string | null {
  const d = getDb();
  const row = d.prepare('SELECT hash FROM api_tokens WHERE id = ?').get(tokenId) as { hash: string } | undefined;
  return row?.hash ?? null;
}

export function touchToken(tokenId: string): void {
  const d = getDb();
  d.prepare("UPDATE api_tokens SET last_used_at = datetime('now') WHERE id = ?").run(tokenId);
}

export function deleteToken(tokenId: string): boolean {
  const d = getDb();
  return d.prepare('DELETE FROM api_tokens WHERE id = ?').run(tokenId).changes > 0;
}
