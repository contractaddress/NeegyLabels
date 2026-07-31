import { createHash, randomBytes } from 'node:crypto';
import {
  insertToken,
  getAllTokens,
  getTokenHash,
  touchToken,
  deleteToken,
} from './db.ts';

const TOKEN_PREFIX = 'n33gy';

export function createToken(name: string): { token: string; id: string } {
  const id = randomBytes(8).toString('hex');
  const secret = randomBytes(32).toString('hex');
  const token = `${TOKEN_PREFIX}${id}_${secret}`;
  const hash = createHash('sha256').update(token).digest('hex');
  insertToken(id, name, hash);
  return { token, id };
}

export function verifyToken(token: string): boolean {
  if (!token.startsWith(TOKEN_PREFIX)) return false;

  const rest = token.slice(TOKEN_PREFIX.length);
  const underscoreIdx = rest.indexOf('_');
  if (underscoreIdx !== 16) return false;

  const id = rest.slice(0, 16);
  const storedHash = getTokenHash(id);
  if (!storedHash) return false;

  const matches = createHash('sha256').update(token).digest('hex') === storedHash;
  if (matches) touchToken(id);
  return matches;
}

export function revokeToken(id: string): boolean {
  return deleteToken(id);
}

export function listTokens() {
  return getAllTokens();
}
