# NeegyLabels API

On-chain label database for EVM addresses. Resolves raw hex addresses to human-readable labels across multiple chains.

Base URL: `http://localhost:4321/api/labels`

## Authentication

Mutating endpoints (`POST`, `PUT`, `DELETE`) require a Bearer token. There are two ways to authenticate:

1. **`API_KEY`** — the `.env` value (also the session secret). Works directly as a Bearer token when set.
2. **`n33gy...` tokens** — generated via the `/admin` panel, stored as SHA-256 hashes. Use these for other consumers so they can be revoked individually.

```
Authorization: Bearer n33gy<id>_<secret>
```

Read-only endpoints (`GET`) are public and require no auth.

## Endpoints

### GET /api/labels

List or search labels. Public.

| Param | Type | Description |
|-------|------|-------------|
| `address` | string | Lowercase 0x address |
| `chain` | string | Chain key; registered suggestions and explorer bases are managed at `/manage` |
| `type` | string | Label type; registered suggestions are available from `GET /api/types` |
| `label` | string | Case-insensitive text search on label name |
| `limit` | int | Max results per page, default 50 |
| `offset` | int | Pagination offset |
| `bulk` | bool | `true` to bypass pagination (for exports) |

**Examples**

```bash
# All labels (paginated)
GET /api/labels

# By address
GET /api/labels?address=0x1f98431c8ad98523631ae4a59f267346ea31f984

# By chain
GET /api/labels?chain=ethereum

# By type
GET /api/labels?type=mixer

# Text search on label name
GET /api/labels?label=uniswap

# Bulk export (all labels of a type, no pagination)
GET /api/labels?type=mixer&bulk=true
```

**Response**

```json
{
  "labels": [
    {
      "address": "0x1f98431c8ad98523631ae4a59f267346ea31f984",
      "chain": "ethereum",
      "label": "Uniswap V3",
      "type": "factory",
      "source": "json",
      "confidence": null,
      "added_at": "2026-07-31 15:00:40"
    }
  ],
  "total": 1
}
```

The `total` field is the full count (used to know when pagination is exhausted). An unfiltered listing also includes observed facets: a `chains` array of distinct chain keys and a `types` array of distinct label types present in the data. Configured registries are available from `GET /api/chains` and `GET /api/types`.

### POST /api/labels

Create a label. Requires auth.

```bash
POST /api/labels
Content-Type: application/json
Authorization: Bearer n33gy...
```

```json
{
  "address": "0xd29c85f15df544ba632c9e25829fd29d767d7978",
  "chain": "robinhood",
  "label": "Across Protocol SpokePool",
  "type": "bridge",
  "source": "manual",
  "confidence": 95
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `address` | yes | Lowercase 0x address |
| `chain` | yes | Chain key, or `*` for cross-chain |
| `label` | yes | Human-readable name |
| `type` | no | Label type, default `unknown` |
| `source` | no | Default `manual` |
| `confidence` | no | 0–100 confidence score |

**Response (201):** `{ "label": { ... } }`

### PUT /api/labels

Update a label. Requires auth. Identified by `address` + `chain` query params.

```bash
PUT /api/labels?address=0x...&chain=ethereum
Content-Type: application/json
Authorization: Bearer n33gy...
```

```json
{
  "label": "Updated Name",
  "type": "dex",
  "confidence": 95
}
```

All body fields are optional — only provided fields are updated.

**Response (200):** `{ "success": true }`
**Response (404):** `{ "error": "Label not found" }`

### DELETE /api/labels

Delete a label. Requires auth. Identified by `address` + `chain` query params.

```bash
DELETE /api/labels?address=0x...&chain=ethereum
Authorization: Bearer n33gy...
```

**Response (200):** `{ "success": true }`
**Response (404):** `{ "error": "Label not found" }`

### GET /api/types

List registered label type suggestions with their configured colors. Public. Browser-local archives do not change this response.

```bash
GET /api/types
```

**Response:**

```json
{
  "types": ["factory", "wallet", "dex", "..."],
  "colors": { "factory": "#ff79c6", "wallet": "#50fa7b", "dex": "#7c3aed" }
}
```

`types` lists type names in order; `colors` maps each name to its configured hex color.

### GET /api/chains

List registered chains with colors and explorer base URLs. Public.

```bash
GET /api/chains
```

**Response:**

```json
{
  "chains": [
    { "name": "ethereum", "color": "#627eea", "explorer_base_url": "https://etherscan.io" }
  ]
}
```

`explorer_base_url` is `null` for chains without an explorer, including `*`.

## Errors

| Status | Meaning |
|--------|---------|
| 400 | Missing required fields |
| 401 | Missing or invalid auth |
| 404 | Label not found |
| 500 | Database error |

## Default Chains

`ethereum` `robinhood` `base` `bsc` `arbitrum` `optimism` `polygon` `avalanche` `unichain` `hyperliquid` `bitcoin` `tron` `*`

`*` means the label applies cross-chain.

## Default Types

`factory` `wallet` `dex` `token` `locker` `router` `proxy` `governance` `oracle` `multisig` `lending` `staking` `positions` `multicall` `lens` `hook` `threatactor` `cex` `bridge` `mixer` `launcher` `other` `unknown`
