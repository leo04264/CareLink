# @carelink/api

Fastify + TypeScript backend for CareLink. Full spec: [`spec/carelink-backend-spec.md`](../../spec/carelink-backend-spec.md).

## Status

- ✅ PR B — skeleton: `/health` endpoint, CORS, rate-limit, error envelope, shared types
- ⏸ **Deploy deferred** — runs on `localhost:3000` only for now; mobile still uses mocks. **Must be resolved before demo to anyone outside the dev machine.** See [`docs/MOCKS.md`](../../docs/MOCKS.md#-demo-前必須決定後端部署方案) for options (Render free / Fly paid / Hetzner / Oracle).
- ⏳ PR D+ — implement modules per spec §5 (auth, elder, checkin, medication, …). These can land while deployment is still unresolved; mobile continues hitting mocks until the API is cloud-hosted.

## Local dev

```bash
# From repo root
npm install

# Start supporting services (Postgres + Redis)
docker compose -f infra/docker-compose.dev.yml up -d

# Copy env template
cp apps/api/.env.example apps/api/.env

# Run API with hot-reload
npm run dev:api
```

Hit `http://localhost:3000/health` — you should see:

```json
{ "ok": true, "data": { "status": "ok", "ts": "...", "service": "carelink-api", "version": "0.1.0" } }
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
