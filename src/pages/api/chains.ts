import type { APIRoute } from 'astro';
import { getAllChains } from '../../lib/db.ts';

export const GET: APIRoute = async () => {
  const chains = getAllChains().map(({ name, color, explorer_base_url }) => ({ name, color, explorer_base_url }));
  return new Response(JSON.stringify({ chains }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
