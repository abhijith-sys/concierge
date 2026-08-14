# Networking Marketplace Alignment

> Execution plan for Phase 1 lives in [marketplace_phase1_master.md](./marketplace_phase1_master.md). This file is the naming/reuse map only.

## Inspected stack (do not add projects)

- `apps/web` — public SPA (guest browse already works)
- `apps/api` — modular Express + Prisma + PostgreSQL
- `apps/super-admin` — isolated admin SPA on a separate origin

## Entity mapping (keep existing tables)

The spec’s names differ from Concierge’s Justdial-style directory. We **do not** split Listing 1:1 with Business in this phase.

| Spec | Existing model | Notes |
|------|----------------|-------|
| User | `User` | Multi-capability via RBAC `UserRole` + legacy `Role` shortcut |
| Provider profile | `Business` | Who they are; public page stays `/business/:slug` |
| Directory card | `Listing` (1:1 Business) | Search/geo/hours document — not an offering |
| Listing (offering) | `Service` | What they offer; UI copy: “My Listings” |
| Registration form | `CategoryField` `scope=listing` (and `business`) | Loaded after category pick |
| Listing form | `CategoryField` `scope=service` | Independent of registration fields |
| Super Admin | `apps/super-admin` | Already separate |

**Conflict accepted:** spec wants many Listings per Provider as first-class search results. Today search indexes the business directory card. Offerings remain attached to the provider profile for MVP; making offerings independently searchable is a later slice (no rewrite of `/listings/:categorySlug`).

**Multiple categories:** one `categoryId` on the business listing now; `Service.categoryId` already allows a second category later.

## Phase 1 (this implementation)

1. **Discover first** — public browse/search unchanged; auth only on identity actions.
2. **Signup is always a consumer** — ignore buyer/seller at register.
3. **Become a provider later** — any authenticated user may `POST /businesses`; role upgrades to `business` + `service_provider` RBAC; JWT cookie refreshed.
4. **Backend ownership, not role gates** — provider resource APIs use `requireAuth` + owner checks (stale JWT cannot grant another user’s listings).
5. **Wishlist** — `WishlistItem(userId, listingId)` on the directory Listing; guest ❤️ → login → resume add.
6. **Unified nav** — Explore / Wishlist / Profile; provider items only when the account has provider capability.
7. **Provider area** — `/provider`, `/provider/listings` (existing `/list-business` remains onboarding).
8. **Admin form builder** — field `scope` = registration (`listing`/`business`) vs offering (`service`).

## Deferred (spec Phase 2+)

Messaging, leads/requests, reviews-on-offerings, payments, dedicated provider subdomain, breaking Listing 1:1, dropping `Role` enum.
