# @carelink/api

Fastify + TypeScript backend for CareLink. Full spec: [`spec/carelink-backend-spec.md`](../../spec/carelink-backend-spec.md).

## Status

- ✅ PR B — skeleton: `/health`, CORS, rate-limit, error envelope, shared types
- ✅ PR D — `/auth` module: register / login / refresh / logout + elder pair / verify; JWT with user + elder namespaces; bcryptjs password hashing; RefreshToken rotation stored in DB
- ⏸ **Deploy deferred** — runs on `localhost:3000` only for now; mobile still uses mocks. See [`docs/MOCKS.md`](../../docs/MOCKS.md#-demo-前必須決定後端部署方案) for options.
- ⏳ PR E+ — remaining modules per spec §5 (family, elder, checkin, medication, vitals, appointment, sos, notification, media)

## Local dev

```bash
# From repo root
npm install

# 1. Start Postgres + Redis
npm run infra:up

# 2. Configure env
cp apps/api/.env.example apps/api/.env   # then edit JWT_SECRET

# 3. Generate Prisma client + run migrations
npm -w @carelink/api run db:generate
npm -w @carelink/api run db:migrate       # or db:migrate:dev for interactive

# 4. Start API with hot-reload
npm run dev:api
```

### Smoke test

```bash
# Health
curl -s localhost:3000/health

# Register (creates a User + a Family + PRIMARY membership)
curl -s -X POST localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"志明","email":"zm@example.com","password":"password123"}'

# Login (same credentials)
curl -s -X POST localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"zm@example.com","password":"password123"}'

# Refresh (rotates the refresh token)
curl -s -X POST localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<paste refreshToken from login>"}'
```

## Layout

```
apps/api/
├── src/
│   ├── app.ts                 Fastify factory (plugins + module registrations)
│   ├── server.ts              Boot entry
│   ├── plugins/
│   │   └── error-handler.ts   Maps ApiException / ZodError → ApiError envelope
│   └── modules/
│       └── health/
│           └── health.routes.ts
├── .env.example
├── package.json
└── tsconfig.json
```

New modules (per spec §5) go under `src/modules/<name>/` with `{name}.routes.ts`, `{name}.service.ts`, `{name}.schema.ts`.

## Error handling

Throw `new ApiException(ErrorCodes.X, 'message', { status?, details? })` anywhere. The handler turns it into:

```json
{ "ok": false, "error": { "code": "NOT_FOUND", "message": "...", "details": {} } }
```

Error codes and HTTP status mapping live in `@carelink/shared` (`packages/shared/src/errors.ts`). Keep them aligned with spec §10.
