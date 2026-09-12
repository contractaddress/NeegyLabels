import type { APIRoute } from 'astro';
import { getAllTypes } from '../../lib/db.ts';

export const GET: APIRoute = async () => {
  const entries = getAllTypes();
  const colors = Object.fromEntries(entries.map(({ name, color }) => [name, color]));
  return new Response(JSON.stringify({ types: entries.map(({ name }) => name), colors }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
