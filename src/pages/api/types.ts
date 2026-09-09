import type { APIRoute } from 'astro';
import { getAllTypes } from '../../lib/db.ts';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ types: getAllTypes().map(({ name }) => name) }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
