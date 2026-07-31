# NeegyLabels — On-Chain Label Database

Central label database for EVM addresses (wallets, contracts, factories,
bridges, CEX wallets). Hosted on the server, used by all internal apps via
REST API.

## What this is

`labels.db` provides human-readable labels for blockchain addresses — so any
internal tool can resolve `0x1F984...` to "Uniswap V3 Factory" instead of
showing raw hex. Apps POST new labels and GET lookups through the API.

## DB Schema (SQLite — labels.db)

```sql
CREATE TABLE labels (
    address TEXT NOT NULL,    -- lowercase 0x... address
    chain   TEXT NOT NULL,    -- chain key: ethereum, robinhood, base, bsc,
                              --   unichain, or "*" for cross-chain
    label   TEXT NOT NULL,    -- human-readable name
    type    TEXT DEFAULT 'unknown',  -- factory, launcher, wallet, cex,
                                    --   bridge, mixer, other
    source  TEXT DEFAULT 'manual',   -- manual, json, explorer
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (address COLLATE NOCASE, chain)
);
```

Same address can have labels on multiple chains. Chain `"*"` means the label
applies everywhere.

## What to build

### 1. REST API (Astro server endpoints)

Central API consumed by any app on the server.

| Method | Path                    | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/labels`           | Lookup: `?address=0x...` or `?chain=robinhood` |
| POST   | `/api/labels`           | Create label (JSON body) |
| DELETE | `/api/labels`           | Delete: `?address=0x...&chain=robinhood` |

**POST body:**
```json
{
  "address": "0xd29c85f15df544ba632c9e25829fd29d767d7978",
  "chain": "robinhood",
  "label": "Across Protocol SpokePool",
  "type": "bridge"
}
```

**Authentication:**
- API key in `Authorization: Bearer <token>` header
- Token stored in `.env` as `API_KEY`

### 2. Web UI (Astro pages)

runtime: DENO (NO NPM, no COMPONENTS)
FONTS: Mononoki Nerd Font Mono  
DARK/black minimalist aesthetic, modern terminalesque

Frontend to browse and manage the database.

- Homepage — search bar by address, recent labels table
- Lookup — enter address → shows all labels across chains
- Add label — form (address, chain dropdown, type dropdown, label name)
- Chain browser — `/chain/robinhood` → all labels on that chain

AESTHETHIC, use your front-end skill

## Current data

23 seed labels from contracts/*.json (DEX factories on 8 chains).
1 manual label (Across Protocol SpokePool on Robinhood).

## Deno considerations

Astro + Deno runtime means:
- No `node:sqlite3` — use Deno KV or WASM SQLite
- For simple SQLite access, `better-sqlite3` with `--allow-ffi` works
- Astro endpoints use `Astro.request` for body/params
- `Bun.sqlite` is also an option if switching runtime

## Future

- Real PostgreSQL when SQLite hits its limits
- Auto-detect EOA vs contract via `eth_getCode`
- Import/export labels as JSON
- Webhook notifications when labels are added
