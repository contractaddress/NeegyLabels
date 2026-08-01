import type { APIRoute } from 'astro';

const TYPES = [
  'factory', 'wallet', 'dex', 'token', 'locker',
  'router', 'proxy', 'governance', 'oracle', 'multisig',
  'lending', 'staking', 'positions', 'multicall', 'lens', 'hook', 'threatactor', 'cex', 'bridge', 'mixer', 'launcher',
  'other', 'unknown',
];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ types: TYPES }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
