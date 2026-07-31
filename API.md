# NeegyLabels API

Base URL: `http://localhost:4321/api/labels`

## Auth

Bearer token in `Authorization` header. Tokens generated via `/admin` panel.

```
Authorization: Bearer n33gy<id>_<secret>
```

## Endpoints

### GET /api/labels

List or search labels. Public (no auth required).

| Param | Type | Description |
|-------|------|-------------|
| `address` | string | Lowercase 0x address |
| `chain` | string | Chain key (ethereum, base, bsc, etc) |
| `limit` | int | Max results, default 50 |
| `offset` | int | Pagination offset |

**All labels:**
```
GET /api/labels
```

**By address:**
```
GET /api/labels?address=0x1f98431c8ad98523631ae4a59f267346ea31f984
```

**By chain:**
```
GET /api/labels?chain=ethereum
```

**Response:**
```json
{
  "labels": [
    {
      "address": "0x1f98431c8ad98523631ae4a59f267346ea31f984",
      "chain": "ethereum",
      "label": "Uniswap V3",
      "type": "factory",
      "source": "json",
      "added_at": "2026-07-31 15:00:40"
    }
  ],
  "total": 1
}
```

### POST /api/labels

Create a label. Requires auth.

**Body:**
```json
{
  "address": "0xd29c85f15df544ba632c9e25829fd29d767d7978",
  "chain": "robinhood",
  "label": "Across Protocol SpokePool",
  "type": "bridge",
  "source": "manual"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `address` | yes | Lowercase 0x address |
| `chain` | yes | Chain key or `*` for cross-chain |
| `label` | yes | Human-readable name |
| `type` | no | factory, wallet, cex, bridge, mixer, launcher, other |
| `source` | no | Default: manual |

**Response (201):**
```json
{
  "label": {
    "address": "0xd29c85f15df544ba632c9e25829fd29d767d7978",
    "chain": "robinhood",
    "label": "Across Protocol SpokePool",
    "type": "bridge",
    "source": "manual",
    "added_at": "2026-07-31 16:00:00"
  }
}
```

### DELETE /api/labels

Delete a label. Requires auth.

```
DELETE /api/labels?address=0xabc...&chain=ethereum
```

**Response (200):**
```json
{"success": true}
```

**Response (404):**
```json
{"error": "Label not found"}
```

## Errors

| Status | Meaning |
|--------|---------|
| 400 | Missing required fields |
| 401 | Missing or invalid auth |
| 404 | Label not found |
| 500 | Database error |

## Chains

`ethereum`, `robinhood`, `base`, `bsc`, `arbitrum`, `optimism`, `polygon`, `avalanche`, `unichain`, `*`

## Types

`factory`, `wallet`, `cex`, `bridge`, `mixer`, `launcher`, `other`, `unknown`
