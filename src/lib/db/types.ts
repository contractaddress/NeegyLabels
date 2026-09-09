import { getDb } from './core.ts';

export interface LabelType {
  name: string;
  color: string;
  created_at: string;
}

const TYPE_NAME = /^[a-z0-9][a-z0-9_-]{0,49}$/;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function validName(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (!TYPE_NAME.test(normalized)) {
    throw new Error('type must be 1-50 lowercase letters, numbers, hyphens, or underscores');
  }
  return normalized;
}

function validColor(color: string): string {
  const normalized = color.trim().toLowerCase();
  if (!HEX_COLOR.test(normalized)) throw new Error('color must be a 6-digit hex value');
  return normalized;
}

export function getAllTypes(): LabelType[] {
  return getDb().prepare('SELECT name, color, created_at FROM types ORDER BY name').all() as LabelType[];
}

export function insertType(name: string, color: string): LabelType {
  const normalizedName = validName(name);
  const normalizedColor = validColor(color);
  const result = getDb().prepare('INSERT OR IGNORE INTO types (name, color) VALUES (?, ?)').run(normalizedName, normalizedColor);
  if (result.changes === 0) throw new Error(`type "${normalizedName}" already exists`);
  return getDb().prepare('SELECT name, color, created_at FROM types WHERE name = ?').get(normalizedName) as LabelType;
}

export function updateTypeColor(name: string, color: string): boolean {
  const result = getDb().prepare('UPDATE types SET color = ? WHERE name = ?').run(validColor(color), validName(name));
  if (result.changes === 0) throw new Error('type not found');
  return true;
}
