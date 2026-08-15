# NeegyLabels

On-chain label database for EVM addresses. Resolves raw hex addresses to human-readable labels (wallets, contracts, factories, bridges, CEX wallets) across multiple chains.

## Features

- **REST API** — look up labels by address, chain, or type; create, update, and delete labels
- **Web UI** — terminal-inspired dark interface to browse and manage the database
- **Multi-chain** — ethereum, base, bsc, arbitrum, optimism, polygon, avalanche, robinhood, unichain, hyperliquid, bitcoin, tron, and more
- **Label types** — factory, wallet, dex, token, bridge, mixer, threatactor, and 15+ more
- **Confidence scores** — optional 0–100 rating per label
- **API key auth** — Bearer tokens generated via the admin panel, stored as SHA-256 hashes

## Tech stack

- [Astro](https://astro.build) (SSR)
- SQLite via `better-sqlite3`
- bcrypt for admin authentication
- No frontend framework — plain Astro pages

## Getting started

```bash
npm install
npx astro dev
```

Open `http://localhost:4321`.

On first visit you'll be prompted to create an admin account. The admin panel (`/admin`) is where you generate API tokens.

## Configuration

**Before deploying**, generate a session secret. It signs login cookies and doubles as a fallback API token.

```bash
echo "API_KEY=$(openssl rand -hex 32)" > .env
```

| Env var | Purpose |
|---------|---------|
| `API_KEY` | Session signing secret. If unset, a hardcoded dev fallback (`dev-secret-change-me`) is used — **not secure for production**. |

### API tokens

Two ways to authenticate against the API:

1. **`API_KEY` directly** — use it as a Bearer token (the "fallback" token, handy for your own scripts).
2. **`n33gy...` tokens** — generated in the admin panel (`/admin`), stored as SHA-256 hashes. Use these for other consumers so you can revoke them individually.

```bash
# Either works:
curl -H "Authorization: Bearer $API_KEY" http://localhost:4321/api/labels
curl -H "Authorization: Bearer n33gy<id>_<secret>" http://localhost:4321/api/labels
```

## API

See `/docs` in the web UI, or fetch the raw markdown:

```bash
curl http://localhost:4321/docs.txt
```

### Quick reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/labels` | — | List / search (`?address=`, `?chain=`, `?type=`, `?label=`, `?limit=`, `?offset=`) |
| POST | `/api/labels` | Bearer | Create a label |
| PUT | `/api/labels?address=&chain=` | Bearer | Update a label |
| DELETE | `/api/labels?address=&chain=` | Bearer | Delete a label |
| GET | `/api/types` | — | List all label types |

```bash
curl -H "Authorization: Bearer n33gy<id>_<secret>" \
  http://localhost:4321/api/labels?chain=ethereum
```

## License

MIT
