# NeegyLabels

Your very own self-hosted Wallet labeling database

![NeegyLabels showcase](public/showcase.png)

## Features

- **REST API**: look up/add/delete labels and integrate directly into your other sleuthing tools.
- **Web UI**: browse and manage the database 
- **Multi-chain**: EVM (Solana planned)
- **Label types**: factory, wallet, dex, token, bridge, mixer, threatactor, and 15+ more
- **Confidence scores**: optional 0–100 rating per label
- **API key auth**: Bearer tokens generated via the admin panel

## Tech stack

- [Astro](https://astro.build) (SSR)
- SQLite via `better-sqlite3`
- bcrypt for admin authentication
- plain Astro pages

## Getting started

```bash
git clone <remote repo> && cd NeegyLabels
npm install

# 1. Set up your environment — generate a session secret
cp .env.example .env
openssl rand -hex 32   # paste the output into API_KEY= in .env

# 2. Start the dev server
npx astro dev
```

Open `http://localhost:4321`.

On first visit you'll be prompted to create an admin account. The admin panel (`/admin`) is where you generate API tokens.

> **Note:** If you skip the `.env` setup, the app still runs but uses an insecure fallback secret and shows a warning banner in the UI. Do this before deploying anywhere.

## Configuration

The `.env` file holds your secrets. A template is provided in `.env.example`:

```bash
cp .env.example .env
openssl rand -hex 32   # copy the output into API_KEY=
```

Or generate and set it in one step:

```bash
echo "API_KEY=$(openssl rand -hex 32)" > .env
```

| Env var | Purpose |
|---------|---------|
| `API_KEY` | Session signing secret. If unset, a hardcoded dev fallback (`dev-secret-change-me`) is used and a warning banner appears in the UI — **not secure for production**. |

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
# List labels on a chain (auth required for mutations only)
curl -H "Authorization: Bearer n33gy<id>_<secret>" \
  http://localhost:4321/api/labels?chain=ethereum

# List all label types
curl http://localhost:4321/api/types
```

## License

MIT
