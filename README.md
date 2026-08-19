# Concierge MVP

A local-search marketplace for discovering curated businesses, viewing profiles and maps, authenticating, submitting owner listings, and managing reviews. The MVP uses a React/Vite SPA, an Express/Prisma API, PostgreSQL, and nginx as the single public entry point.

## Prerequisites

- Docker Desktop with Docker Compose v2
- For non-Docker development: Node.js 22 and npm
- Ports `8080`, `5173`, and `3001` available as applicable

No external API key is required. Leaflet uses public OpenStreetMap tiles, and email delivery is a console-log stub.

## One-command Docker startup

Copy the example environment file once, then start the stack:

```bash
cp .env.example .env
docker compose up --build
```

PowerShell equivalent:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Open:

- App: [http://localhost:8080](http://localhost:8080)
- API health: [http://localhost:8080/api/health](http://localhost:8080/api/health)

The API container waits for PostgreSQL, applies migrations, and idempotently seeds demo data before starting. nginx serves the SPA and proxies `/api/*` to Express. Stop containers with `docker compose down`; add `-v` only when you intentionally want to erase the local database and uploads.

## Demo accounts

All seeded accounts use password `Concierge123!`.

| Email | Role | Intended flow |
|---|---|---|
| `user@demo.com` | `user` | Browse and manage reviews |
| `business@demo.com` | `business` | Submit a business listing |
| `admin@demo.com` | `admin` | Exercise admin-authorized API paths |

These credentials and the default JWT secret are for local development only.

## Seed walkthrough

1. Open `/` and browse the seeded category hierarchy.
2. Search for `Elite` or open `/listings/contractors`.
3. Select **Elite Build & Masonry** or **Aura Interior & Furniture**.
4. Confirm the profile, reviews, and Leaflet/OpenStreetMap map render.
5. Sign in as `user@demo.com` to exercise review management.
6. Sign in as `business@demo.com`, open `/list-business`, and submit a listing. Business submissions remain `pending`; seeded directory businesses are `active`.

The seed is repeatable and restores the six design-reference businesses and their demo reviews without duplicating them.

## Local development

For fully host-native development, start PostgreSQL 16 on `localhost:5432` and set `DATABASE_URL` accordingly. The Compose database is intentionally not exposed to the host; use the full Docker workflow when you do not already have a local PostgreSQL server.

API:

```bash
cd apps/api
npm ci
# Set DATABASE_URL, JWT_SECRET, CORS_ORIGIN and API_PORT in your shell.
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Web:

```bash
cd apps/web
npm ci
npm run dev
```

Vite serves [http://localhost:5173](http://localhost:5173) and proxies `/api` to `http://localhost:3001`.

## Environment variables

| Variable | Default/example | Purpose |
|---|---|---|
| `POSTGRES_USER` | `concierge` | PostgreSQL user used by Compose |
| `POSTGRES_PASSWORD` | `concierge` | Local PostgreSQL password |
| `POSTGRES_DB` | `concierge` | PostgreSQL database |
| `DATABASE_URL` | `postgresql://...@db:5432/...` | Prisma connection URL; `db` is the Compose service hostname |
| `API_PORT` | `3001` | Host-native API port; Compose keeps its internal API on `3001` |
| `JWT_SECRET` | local-only placeholder | Signs the HttpOnly session cookie; replace outside local development |
| `CORS_ORIGIN` | localhost `5173,8080` | Comma-separated browser origins accepted by Express |
| `COOKIE_SECURE` | `false` | Set `true` when serving over HTTPS |
| `RUN_SEED` | `true` | Runs the idempotent demo seed on API startup; set `false` in production |
| `RATE_LIMIT_ENABLED` | `false` | Enables simple in-memory rate limiting (auto-on in production) |
| `REQUIRE_EMAIL_VERIFICATION` | `false` | Require OTP email verification for sensitive flows (auto-on in production) |
| `UPLOAD_ROOT` | `uploads` | Local filesystem root for public/private uploads |
| `LOG_LEVEL` | `info` | API structured log level (`debug` \| `info` \| `warn` \| `error`) |
| `VITE_API_URL` | empty | Optional API origin at web build time; empty uses same-origin `/api` |

## Production checklist

- Set `NODE_ENV=production`, a non-default `JWT_SECRET`, `COOKIE_SECURE=true`, and `RUN_SEED=false`.
- Rate limiting and email-verification gates turn on automatically in production (`RATE_LIMIT_ENABLED` / `REQUIRE_EMAIL_VERIFICATION` can also be forced in any environment).
- Mutating authenticated requests require the double-submit `X-CSRF-Token` header matching the readable `concierge_csrf` cookie.
- Uploads land under `UPLOAD_ROOT` (`/app/uploads` in Compose). Public files are served at `/uploads/public/*`; private KYC files only via `/api/uploads/private/:fileName` for owners/admins.
- CI runs lint, typecheck, and Vitest (with Postgres) on pull requests — see [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Architecture

```text
Browser :8080
  └─ nginx (web)
      ├─ / and SPA routes -> static Vite build
      └─ /api/* -> Express :3001
                     └─ Prisma -> PostgreSQL :5432
```

Repository layout:

```text
apps/web/       React 19, Vite, TanStack Query, Leaflet, nginx
apps/api/       Modular Express monolith (domain modules + shared kernel)
design/         Original HTML visual references
docker-compose.yml
```

The API is a **modular monolith**: active domains live under `apps/api/src/modules/{auth,categories,search,businesses,reviews,services,admin,verification,uploads,health}` with routes → service → repository layers. Shared kernel code is in `apps/api/src/shared/`. Future domains (`bookings`, `payments`, `messaging`, `ads`, `analytics`, `notifications`) are scaffolded but unmounted. See [`apps/api/README.md`](apps/api/README.md) for dependency rules and how to extract a microservice later.

Authentication uses a seven-day, HttpOnly, SameSite=Lax JWT cookie named `concierge_session`, plus a readable CSRF cookie for mutating requests. Roles are `user`, `business`, and `admin`.

## Frontend routes

| Route | Purpose |
|---|---|
| `/` | Home, search, and top-level categories |
| `/listings` | Search results and filters (`q`, `city`, `rating`, `open`, `lat`/`lng`, `page`) |
| `/listings/:categorySlug` | Category-filtered results |
| `/business/:slug` | Business profile, services, reviews, gallery, and map |
| `/business/:slug/edit` | Owner/admin edit + services management |
| `/login`, `/register` | Cookie-based authentication |
| `/account` | Profile, OTP verification, avatar, owned businesses |
| `/list-business` | Guarded business-owner onboarding form |
| `/verification` | Owner KYC photo/document submission |
| `/admin` | Admin business moderation + verification queue |

Unknown frontend routes use the SPA fallback and render the in-app not-found state.

## API inventory

| Method | Route | Access |
|---|---|---|
| `GET` | `/api/health` | Public |
| `GET` | `/api/ready` | Public readiness (DB ping) |
| `POST` | `/api/auth/register` | Public; creates `user` or `business` |
| `POST` | `/api/auth/login` | Public; sets session cookie |
| `POST` | `/api/auth/logout` | Public; clears session cookie |
| `GET` | `/api/auth/me` | Authenticated |
| `PATCH` | `/api/auth/me` | Authenticated |
| `POST` | `/api/auth/otp/request` | Authenticated; rate-limited |
| `POST` | `/api/auth/otp/verify` | Authenticated; rate-limited |
| `POST` | `/api/uploads` | Authenticated; public/private base64 upload |
| `GET` | `/api/categories` | Public; returns category tree |
| `GET` | `/api/search` | Public; `q`, city, category, rating, open, lat/lng/radiusKm, pagination |
| `GET` | `/api/businesses/mine` | Owner/admin |
| `GET` | `/api/businesses/:slugOrId` | Public (active; owner/admin may see pending/suspended) |
| `POST` | `/api/businesses` | `business` or `admin` |
| `PATCH` | `/api/businesses/:id` | Owner or `admin` |
| `GET` | `/api/services/business/:businessId` | Public (active only unless owner/admin) |
| `POST/PATCH/DELETE` | `/api/services` | Owner or `admin` (DELETE soft-deactivates) |
| `GET/PUT/POST` | `/api/verification/*` | Owner draft/submit; admin queue/review |
| `GET/PATCH/POST/DELETE` | `/api/admin/businesses*` | Admin only |
| `GET` | `/api/reviews?businessId=...` | Public |
| `POST` | `/api/reviews` | Authenticated; one review per user/business |
| `DELETE` | `/api/reviews/:id` | Review author or `admin` |

## Checks and smoke tests

Run static checks and API tests:

```bash
cd apps/api
npm run lint
npm run typecheck
npm test
npm run build

cd ../web
npm run lint
npm run typecheck
npm run build
```

After `docker compose up --build`, a minimal HTTP smoke pass is:

```bash
curl -f http://localhost:8080/
curl -f http://localhost:8080/api/health
curl -f http://localhost:8080/api/categories
curl -f "http://localhost:8080/api/search?q=Elite&city=New%20York"
curl -f http://localhost:8080/api/businesses/elite-build-masonry
curl -f http://localhost:8080/business/elite-build-masonry
```

Use a cookie jar for auth:

```bash
curl -f -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"user@demo.com","password":"Concierge123!"}' \
  http://localhost:8080/api/auth/login
curl -f -b cookies.txt http://localhost:8080/api/auth/me
```

## Troubleshooting

- **Port 8080 is already used:** stop the conflicting process or change the web mapping in `docker-compose.yml`.
- **API remains unhealthy:** run `docker compose logs api db`; migration, seed, or `DATABASE_URL` errors appear there.
- **A copied `.env` breaks Docker database access:** inside Compose, `DATABASE_URL` must use hostname `db`, not `localhost`.
- **Login works in curl but not the browser:** ensure the browser origin is listed in `CORS_ORIGIN`; use `COOKIE_SECURE=false` for plain local HTTP.
- **Map frame loads without tiles:** OpenStreetMap tiles require internet access. The marker is a vector circle, so no Leaflet marker image path is required.
- **Stale local data:** `docker compose down -v` deletes local volumes; the next startup migrates and reseeds from scratch.
- **Windows shell lacks `cp`:** use the PowerShell `Copy-Item` command shown above.

## Design assets, motion, and accessibility

The public site and Super Admin share category card and banner photos under `apps/web/public/assets/categories` (copied to Super Admin `public` for local previews). Seeded records use `/assets/categories/{slug}.jpg` and `/assets/categories/{slug}-banner.jpg`. Super Admin can replace any of these from **Categories → Edit** (card image + listings banner); uploads go to `/uploads/public/...` and are not overwritten on re-seed. Demo listing photos live under `apps/web/public/assets/listings`. `SafeImage` supplies a neutral local fallback when an image is missing or fails to decode. Hero/LCP images load eagerly with high fetch priority; card, gallery, and editorial images are lazy-loaded in fixed-aspect containers.

The old Stitch/Google design-reference JPEGs (`heritage-estate.jpg`, `builders-hero.jpg`, and the recycled luxury-architecture set) were dummy placeholders and have been removed.

Motion is limited to a short content entrance, mobile-navigation transition, and card/image hover feedback. `prefers-reduced-motion` disables animation and smooth scrolling. Interactive controls have visible keyboard focus, the mobile menu closes on Escape, images have contextual alternative text (or intentionally empty alt text when decorative), and form fields use associated labels.

## Production checklist

- Replace `JWT_SECRET`, database credentials, and demo accounts before any public deployment. The API refuses to start without a `JWT_SECRET` and warns when the development default is used with `NODE_ENV=production`.
- Set `RUN_SEED=false` in production so API restarts never touch data.
- Serve over HTTPS and set `COOKIE_SECURE=true`.
- Set `CORS_ORIGIN` to exact trusted HTTPS origins.
- Put PostgreSQL backups, secret management, TLS termination, observability, rate limiting/WAF controls, and an image-upload/CDN policy in the deployment platform.
- Confirm outbound access to OpenStreetMap tiles and Google Fonts, or self-host approved equivalents. All business and editorial photography needed by the app is local.
- Run the lint, typecheck, build, Compose health, deep-link, auth-cookie, API-flow, and local-asset checks documented above.

## Deferred beyond the MVP

Bookings, payments, SMS, messaging, ads, business analytics, admin moderation UI, OAuth, Redis, Elasticsearch, voice search, production email delivery, image uploads, and production map providers are intentionally not implemented.

The source visual references remain in `design/`.
