import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(`# NeegyLabels API

Base URL: http://localhost:4321/api/labels

## Auth

Mutating endpoints require a Bearer token. Two options:

1. n33gy... tokens — generated via the /admin panel (revocable per-token).
2. API_KEY — the value from your .env, used directly as a Bearer token.

Authorization: Bearer n33gy<id>_<secret>

## Endpoints

### GET /api/labels

List or search labels. Public (no auth required).

| Param | Type | Description |
|-------|------|-------------|
| address | string | Lowercase 0x address |
| chain | string | Chain key (ethereum, base, bsc, etc) |
| type | string | Filter by label type |
| label | string | Text search on label name |
| limit | int | Max results, default 50 |
| offset | int | Pagination offset |
| bulk | bool | Set true to bypass pagination (for exports) |

All labels:
  GET /api/labels

By address:
  GET /api/labels?address=0x1f98431c8ad98523631ae4a59f267346ea31f984

By chain:
  GET /api/labels?chain=ethereum

By label:
  GET /api/labels?label=uniswap

By type (bulk export):
  GET /api/labels?type=mixer&bulk=true

Response:
  {
    "labels": [{ "address": "...", "chain": "...", "label": "...", "type": "...", "source": "...", "confidence": null, "added_at": "..." }],
    "total": 1
  }

An unfiltered listing also includes observed facets: a "chains" array of distinct chain keys and a "types" array of distinct label types present in the data.

### POST /api/labels

Create a label. Requires auth.

Body (JSON):
  {
    "address": "0x...",
    "chain": "robinhood",
    "label": "My Label",
    "type": "bridge",
    "source": "manual",
    "confidence": 95
  }

| Field | Required | Description |
|-------|----------|-------------|
| address | yes | Lowercase 0x address |
| chain | yes | Chain key or * for cross-chain |
| label | yes | Human-readable name |
| type | no | Any string; registered suggestions are available from GET /api/types |
| source | no | Default: manual |
| confidence | no | 0-100 confidence score |

Response (201): { "label": { ... } }

### DELETE /api/labels

Delete a label. Requires auth.

  DELETE /api/labels?address=0x...&chain=ethereum

Response (200): { "success": true }
Response (404): { "error": "Label not found" }

### PUT /api/labels

Update a label. Requires auth.

  PUT /api/labels?address=0x...&chain=ethereum
  Content-Type: application/json
  Authorization: Bearer n33gy...

Body (JSON — all fields optional):
  {
    "label": "Updated Name",
    "type": "dex",
    "confidence": 95
  }

Response (200): { "success": true }
Response (404): { "error": "Label not found" }

### GET /api/types

List registered label type suggestions. Public (no auth required).
Browser-local archives do not change this response.

  GET /api/types

Response:
  { "types": ["factory", "wallet", "dex", "..."] }

### GET /api/chains

List registered chains with colors and explorer base URLs. Public (no auth required).

  GET /api/chains

Response:
  { "chains": [{ "name": "ethereum", "color": "#627eea", "explorer_base_url": "https://etherscan.io" }] }

## Errors

400: Missing required fields
401: Missing or invalid auth
404: Label not found
500: Database error

## Default Chains

ethereum robinhood base bsc arbitrum optimism polygon avalanche unichain hyperliquid bitcoin tron *

## Default Types

factory wallet dex token locker router proxy governance oracle multisig lending staking positions multicall lens hook threatactor cex bridge mixer launcher other unknown
`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
