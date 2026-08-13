# Concierge API

Express + Prisma modular monolith. One process and one Postgres database today; domain folders are shaped so each can later become a microservice.

## Layout

```
src/
  main.ts                 # boot + shutdown
  app.ts                  # Express middleware composition
  config/                 # Zod-validated environment
  platform/               # router mounting
  shared/                 # kernel: auth, db, errors, logging, integrations, domain helpers
  modules/
    health|auth|categories|search|businesses|reviews|services|admin|verification|uploads   # active
    bookings|payments|messaging|ads|analytics|notifications  # scaffolds (unmounted)
```

### Dependency rule

- `modules/*` may import `shared/*` and their own files
- Modules must **not** import other modules’ internals
- Cross-domain rules live in `shared/domain/` (e.g. pending visibility, rating aggregates)

### Per-module shape

```
modules/<name>/
  index.ts
  <name>.routes.ts       # HTTP + Zod only
  <name>.service.ts      # business rules
  <name>.repository.ts   # Prisma access
  <name>.schemas.ts
```

## Scripts

```bash
npm run dev          # tsx watch src/main.ts
npm run build        # tsc → dist/
npm run start        # node dist/main.js
npm run typecheck
npm run lint
npm run prisma:migrate
npm run prisma:seed
npm test             # Vitest unit + optional integration (needs DATABASE_URL)
```

## Adding a module

1. Create `src/modules/<name>/` with routes/service/repository/schemas
2. Export `{ router }` from `index.ts`
3. Mount in [`src/platform/compose-routers.ts`](src/platform/compose-routers.ts)
4. Keep public URL prefixes stable (`/api/<name>`)

## Extracting a microservice later

1. Cut the module folder + its Prisma models into a new service
2. Replace cross-module shared helpers with HTTP/events
3. Keep the API gateway / nginx path or introduce an API gateway that routes by prefix
4. Do **not** share the Prisma client across services after the split

## Production hooks already present

- Fail-fast Zod env (`config/env.ts`); production warnings for default JWT / insecure cookies
- Request IDs + structured JSON logs + admin audit log helper
- Rate limit auto-on in production; stricter buckets for auth/OTP/uploads
- CSRF double-submit cookie for authenticated mutating routes
- Local `StoragePort` uploads (`UPLOAD_ROOT`) with public + private prefixes
- Integration adapters under `shared/integrations/` (email/SMS stubs; storage)
- Liveness `GET /api/health` and readiness `GET /api/ready`
