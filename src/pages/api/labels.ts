import type { APIRoute } from 'astro';
import {
  lookupLabels,
  insertLabel,
  deleteLabel,
  updateLabel,
  getDistinctChains,
} from '../../lib/db.ts';
import { getLabelCount } from '../../lib/db.ts';
import { verifyToken } from '../../lib/tokens.ts';

function checkAuth(request: Request): boolean {
  const envKey = import.meta.env.API_KEY;
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (envKey && token === envKey) return true; // fallback token: API_KEY used directly as Bearer

  return verifyToken(token);
}

export const GET: APIRoute = async ({ request, url }) => {
  const address = url.searchParams.get('address');
  const chain = url.searchParams.get('chain');
  const type = url.searchParams.get('type');
  const label = url.searchParams.get('label');
  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  try {
    const labels = lookupLabels({
      address: address ?? undefined,
      chain: chain ?? undefined,
      type: type ?? undefined,
      label: label ?? undefined,
      limit: url.searchParams.get('bulk') === 'true' ? 1_000_000 : limit,
      offset: url.searchParams.get('bulk') === 'true' ? 0 : offset,
    });

    const total = address || chain || type
      ? labels.length
      : getLabelCount();

    const body: Record<string, unknown> = { labels, total };
    if (!address && !chain && !type) {
      body.chains = getDistinctChains();
    }

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Database error', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    if (!body.address || !body.chain || !body.label) {
      return new Response(
        JSON.stringify({ error: 'address, chain, and label are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const label = insertLabel({
      address: body.address,
      chain: body.chain,
      label: body.label,
      type: body.type,
      source: body.source,
      confidence: body.confidence,
    });

    return new Response(JSON.stringify({ label }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', detail: String(err) }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const address = url.searchParams.get('address');
  const chain = url.searchParams.get('chain');

  if (!address || !chain) {
    return new Response(
      JSON.stringify({ error: 'address and chain query params required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const deleted = deleteLabel(address, chain);

  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Label not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request, url }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const address = url.searchParams.get('address');
  const chain = url.searchParams.get('chain');

  if (!address || !chain) {
    return new Response(
      JSON.stringify({ error: 'address and chain query params required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await request.json();
    const updated = updateLabel(address, chain, {
      label: body.label,
      type: body.type,
      source: body.source,
      confidence: body.confidence,
    });

    if (!updated) {
      return new Response(JSON.stringify({ error: 'Label not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', detail: String(err) }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
