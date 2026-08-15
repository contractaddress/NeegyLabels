import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const SECRET_PATH = resolve(process.cwd(), 'src/data/.session-secret');

let cachedSecret: string | null = null;

function loadOrCreateSecret(): string {
  try {
    if (existsSync(SECRET_PATH)) {
      const stored = readFileSync(SECRET_PATH, 'utf8').trim();
      if (stored.length >= 32) return stored;
    }
  } catch {
    // fall through to generation
  }

  const secret = randomBytes(32).toString('hex');
  try {
    mkdirSync(dirname(SECRET_PATH), { recursive: true });
    writeFileSync(SECRET_PATH, secret, { mode: 0o600 });
  } catch {
    // ignore write failures; use the in-memory secret for this process only
  }
  return secret;
}

export function getSessionSecret(): string {
  if (cachedSecret) return cachedSecret;
  const envKey = import.meta.env.API_KEY;
  cachedSecret = envKey ? envKey : loadOrCreateSecret();
  return cachedSecret;
}

export function usingFallbackSecret(): boolean {
  return !import.meta.env.API_KEY;
}
