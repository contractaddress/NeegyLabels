import { getDb } from './core.ts';

export interface ChainDefinition {
  name: string;
  color: string;
  explorer_base_url: string | null;
  created_at: string;
}

const CHAIN_NAME = /^(?:\*|[a-z0-9][a-z0-9_-]{0,49})$/;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
let explorerBases: Map<string, string | null> | null = null;

function validName(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (!CHAIN_NAME.test(normalized)) {
    throw new Error('chain must be * or 1-50 lowercase letters, numbers, hyphens, or underscores');
  }
  return normalized;
}

function validColor(color: string): string {
  const normalized = color.trim().toLowerCase();
  if (!HEX_COLOR.test(normalized)) throw new Error('color must be a 6-digit hex value');
  return normalized;
}

function validExplorerBase(explorerBaseUrl: string): string {
  const normalized = explorerBaseUrl.trim().replace(/\/+$/, '').replace(/\/address$/, '');
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error('explorer must be a valid URL');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search) {
    throw new Error('explorer must be an HTTPS base URL without credentials or query parameters');
  }
  return normalized;
}

export function getAllChains(): ChainDefinition[] {
  return getDb().prepare('SELECT name, color, explorer_base_url, created_at FROM chains ORDER BY name').all() as ChainDefinition[];
}

export function insertChain(name: string, color: string, explorerBaseUrl: string): ChainDefinition {
  const normalizedName = validName(name);
  const normalizedColor = validColor(color);
  const normalizedExplorer = validExplorerBase(explorerBaseUrl);
  const result = getDb().prepare('INSERT OR IGNORE INTO chains (name, color, explorer_base_url) VALUES (?, ?, ?)').run(normalizedName, normalizedColor, normalizedExplorer);
  if (result.changes === 0) throw new Error(`chain "${normalizedName}" already exists`);
  explorerBases?.set(normalizedName, normalizedExplorer);
  return getDb().prepare('SELECT name, color, explorer_base_url, created_at FROM chains WHERE name = ?').get(normalizedName) as ChainDefinition;
}

export function updateChainColor(name: string, color: string): boolean {
  const result = getDb().prepare('UPDATE chains SET color = ? WHERE name = ?').run(validColor(color), validName(name));
  if (result.changes === 0) throw new Error('chain not found');
  return true;
}

export function updateChainExplorer(name: string, explorerBaseUrl: string): boolean {
  const normalizedName = validName(name);
  const normalizedExplorer = validExplorerBase(explorerBaseUrl);
  const result = getDb().prepare('UPDATE chains SET explorer_base_url = ? WHERE name = ?').run(normalizedExplorer, normalizedName);
  if (result.changes === 0) throw new Error('chain not found');
  explorerBases?.set(normalizedName, normalizedExplorer);
  return true;
}

export function getChainExplorerBase(name: string): string | null {
  explorerBases ??= new Map(getAllChains().map((chain) => [chain.name, chain.explorer_base_url]));
  return explorerBases.get(name.toLowerCase()) ?? null;
}
