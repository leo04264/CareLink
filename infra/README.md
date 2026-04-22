# infra/

Local dev + cloud deploy configs. Kept separate from `apps/` so per-app
code isn't polluted by infrastructure files.

## Current contents

| File | Purpose |
|---|---|
| `docker-compose.dev.yml` | Local Postgres 16 + Redis 7 for `apps/api` dev |

## Coming in PR C

| File | Purpose |
|---|---|
| `../apps/api/Dockerfile` | Multi-stage Node build (lives with the app it packages) |
| `../apps/api/fly.toml` | Fly.io app config |

## Quick start (once infra is set up)

```bash
docker compose -f infra/docker-compose.dev.yml up -d    # pg + redis
docker compose -f infra/docker-compose.dev.yml down     # stop
docker compose -f infra/docker-compose.dev.yml down -v  # stop + wipe data
```

Root shortcuts: `npm run infra:up` / `npm run infra:down`.
