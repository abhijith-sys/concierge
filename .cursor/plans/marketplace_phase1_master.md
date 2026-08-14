# Marketplace Platform — Phase 1 Master Plan

**Status:** architecture audit complete. Do not implement until this plan is the working agreement.

**Covers one system, three apps:**

```text
apps/super-admin  →  configure
apps/api          →  store + validate + authorize
apps/web          →  consume + render
```

**Primary dependency (do not invert):**

```text
Super Admin Category & Form Configuration
        ↓
       API
        ↓
Dynamic Web Forms (provider registration + listings)
```

Companion visual: [Phase 1 gap canvas](C:/Users/DELL/.cursor/projects/c-Users-DELL-Desktop-concierge/canvases/marketplace-phase1-gap.canvas.tsx)

This plan supersedes [networking_marketplace_alignment.md](./networking_marketplace_alignment.md) for Phase 1 execution. The earlier alignment still holds for naming: Concierge tables are reused; spec names are product language, not new schemas.

---

## 1. Objective

Establish a scalable marketplace pipeline:

```text
Main Category → Subcategory → Provider Form → Provider Profile → Listing Form → Listing
```

Phase 1 is complete only when Super Admin can create a category, attach forms, publish them, and the Web app renders those forms with **no category-specific React forms**.

---

## 2. Critical implementation principle

Web, API, and Super Admin are **not three independent features**.

| App | Responsibility | Forbidden |
|-----|----------------|-----------|
| Super Admin | Categories, subcategories, form fields, options, required/order/active, approvals | Hardcoding marketplace taxonomy for display |
| API | Source of truth, composed form payload, validation, ownership, RBAC | Category-specific frontend logic; dummy category trees in code |
| Web | Guest browse + dynamic form renderer + provider area | Independent category/form definitions |

The Web app may keep **common** (non-category) fields that exist on `Business` / `Service` columns (name, title, price). Everything category-specific must come from the API.

---

## 3. Architecture audit (Phase 1A) — findings

Inspected: `apps/web`, `apps/api` (Express + Prisma + PostgreSQL), `apps/super-admin`, `apps/api/prisma/schema.prisma`, seed, auth, categories, businesses, services, wishlist, admin, search.

### 3.1 What already exists and must be reused

| Spec concept | Existing implementation | Status |
|--------------|-------------------------|--------|
| User / roles | `User` + legacy `Role` + RBAC `RoleDef` / `UserRole` / `Permission` | Reuse |
| Main category | `Category` where `parentId` is null | Reuse |
| Subcategory | `Category` where `parentId` is set | Reuse — **do not add `SubCategory`** |
| Form / FormField | `CategoryField` with `scope` = `listing` \| `service` \| `business` | Reuse — **do not add `Form` / `FormField` tables in Phase 1** |
| Provider profile | `Business` + 1:1 directory `Listing` | Reuse — public URL stays `/business/:slug` |
| Marketplace listing (offering) | `Service` | Reuse — UI copy “Listing” / “My Listings” |
| Dynamic values | `ListingFieldValue` / `ServiceFieldValue` (EAV, not JSON blob) | Reuse — **do not add `dynamicData Json` columns** |
| Wishlist | `WishlistItem(userId, listingId)` on directory `Listing` | Reuse for Phase 1 |
| Auth | `POST /auth/register`, `/login`, `/logout`, `GET/PATCH /auth/me` | Reuse (no refresh-token endpoint today) |
| Guest browse | Home, `/listings`, `/listings/:slug`, `/business/:slug` | Works |
| Auth-gated actions | Wishlist intent → login → resume | Works for wishlist |
| Provider onboarding | `POST /businesses` + `CategoryFieldsEditor` (`scope=listing`) | Partial — fields are per-category, not composed |
| Provider dashboard | `/provider`, `/provider/listings` | Partial |
| Admin category + fields | `/admin/categories` CRUD + field CRUD | Partial UI |
| Provider approval | `Business.status` pending → activate/suspend | Partial — no reject reason |
| Search | `GET /search` over directory businesses | Partial — not offerings; no price filter |
| API errors | `{ error: { code, message, details }, requestId }` | **Keep** — do not switch to `{ success, data }` |

### 3.2 Dummy / hardcoded vs API-driven

**API seed** (`apps/api/prisma/seed.ts`) is a Justdial-style demo tree: B2B, Home & Repairs, Real Estate, Medical, Restaurants, Hotels, Beauty & Spa, Contractors, Events, Lifestyle — plus a handful of children. Only `contractors` has sample `CategoryField`s.

**Web Home** hardcodes pillars (`b2b`, `home-repairs`, `real-estate`, `medical`) even though `api.categories()` is already fetched. That violates the source-of-truth rule.

**Super Admin Categories page** can add a category **by name only** and add fields (key/label/type/scope/required) plus activate/delete. It is not a form builder (no reorder, placeholder, validation UI, conditionals, nested subcategory CMS, counts).

### 3.3 Gaps that block the Phase 1 pipeline

1. **No composed forms.** `listFields(categoryId)` returns only that row’s fields. Parent (main) + child (sub) + common fields are not merged.
2. **No common-field catalog.** Spec requires Common + Main + Sub. There is no platform-level field set Super Admin can toggle per category.
3. **No field inheritance / per-category overrides** (`required` yes for Electricians, no for another subcategory).
4. **No conditional fields** (`conditionalRules` does not exist).
5. **No reorder API.** `sortOrder` exists on the model but Super Admin cannot drag-reorder.
6. **No form version snapshot** on submit (`schemaVersion` exists on the field, not on the Business/Service submission).
7. **`Service` has no approval workflow.** Offerings go live with `isActive` only. Spec requires pending → admin approve → public.
8. **No admin listings (offerings) module.** Super Admin manages businesses, not `Service` rows.
9. **Category model missing** `description` and `image`. Soft-delete/deactivate exists (`isActive`); hard delete of categories is not exposed (good) but referenced-category guards are incomplete.
10. **Public category-by-slug + children endpoint** is missing (`GET /categories` tree only; `GET /:idOrSlug/fields` exists).
11. **Phase 1 taxonomy** (8 mains + listed subs) is not seeded.
12. **`CategoryFieldsEditor` is not a full `DynamicForm`** (no radio/location/conditional; file fields are placeholders).
13. **Create listing** does not let the provider pick a different subcategory; it reuses the business directory category.
14. **Dashboard stats** omit providers/listings/pending listings/category counts.

### 3.4 Conflicts accepted for Phase 1 (do not rewrite)

| Spec ask | Decision |
|----------|----------|
| Separate `SubCategory` table | Keep `Category` tree (`parentId`) |
| `Form` + `FormField` entities | Keep `CategoryField.scope`; composed GET is the “form” |
| `ProviderProfile` | Keep `Business` |
| Many searchable Listings as first-class search hits | Search still indexes the **directory** `Listing` (provider card). `Service` is the offering, shown on the provider profile and My Listings. Independent offering search is Phase 2. |
| Wishlist on offering id | Wishlist stays on directory `Listing` (the public business card). Offering-level wishlist is Phase 2. |
| `{ success, data, meta }` envelope | Keep existing `{ resource }` + `{ error, requestId }` |
| `POST /auth/signup` + refresh | Keep `register`; cookie session; no refresh token in Phase 1 |
| JSON `dynamicData` blob | Keep EAV value tables (filterable/typed) |

---

## 4. Locked form architecture (the shared contract)

Every **provider registration** payload is:

```text
Common provider fields  +  Main-category fields  +  Subcategory fields
scope = listing | business
```

Every **listing (offering)** payload is:

```text
Common listing columns (title/description/price/…)  +  Main-category fields  +  Subcategory fields
scope = service
```

### 4.1 How composition works without new Form tables

Introduce one **platform category** (hidden from public tree):

```text
slug: _platform
name: Platform common fields
parentId: null
isActive: true   // hidden in public listTree by slug prefix
```

**Read path** (API is authoritative):

```text
GET /categories/:subcategoryIdOrSlug/forms/provider
GET /categories/:subcategoryIdOrSlug/forms/listing
```

Server builds:

```text
fields = concat(
  platform fields for scope,
  parent (main) fields for scope,
  self (sub) fields for scope
)
```

Same `key` later in the list **wins** (subcategory override of a common field: required, options, isActive, sortOrder, label). Inactive fields are omitted on public GET.

Admin GET (Super Admin builder) returns the three layers separately so the UI can edit Common vs Main vs Sub without flattening.

### 4.2 Field types — map spec → existing enum

Do **not** explode `CategoryFieldType` unless a type cannot be represented.

| Spec type | Existing / mapping |
|-----------|-------------------|
| Text, Textarea, Number, Email, Phone, Date | already exist |
| Dropdown | `select` |
| Multi Select | `multiselect` |
| Radio | `select` + `widget: "radio"` in `validation` or new optional `uiWidget` JSON |
| Checkbox / Toggle | `boolean` + optional `uiWidget` |
| File Upload | `asset_ref` |
| Image Upload | `asset_ref` |
| Multiple Image Upload | `asset_gallery` |
| Location | `json` + `uiWidget: "location"` |
| URL | `url` (already exists; keep) |

Add columns/JSON on `CategoryField` (migration, not a new table):

```text
placeholder      String?
defaultValue     Json?
conditionalRules Json?     // { fieldKey, equals } — hide/show
```

`label`, `helpText` (description), `required`, `options`, `validation`, `sortOrder`, `isActive`, `schemaVersion` already exist.

### 4.3 Versioning

On Business create/update and Service create/update, persist:

```text
formSchemaVersion Int   // max(schemaVersion) of fields used at submit time
```

If Super Admin later changes a form, existing rows stay valid. New submissions use the latest active fields. Do not auto-invalidate old providers.

### 4.4 Common columns vs dynamic fields

**Stay as first-class columns** (not CategoryFields), rendered by Web as the static part of the form:

Provider / Business: name, email, phone, logo, cover, description, address, city, lat/lng, hours, website.

Listing / Service: name (title), description, price, currency, images, categoryId, isActive.

Super Admin may later promote some of these into CategoryFields; Phase 1 does not move them.

---

## 5. Category taxonomy (seed via API, not Web)

Replace/extend demo seed with the Phase 1 tree. Keep old demo businesses mapped onto the closest new subcategory **or** seed a parallel tree and deactivate obsolete roots (`isActive: false`) so existing FKs do not break.

| Sort | Main slug | Name |
|------|-----------|------|
| 1 | `home-property` | Home & Property |
| 2 | `automotive` | Automotive |
| 3 | `electronics-technology` | Electronics & Technology |
| 4 | `professional-business` | Professional & Business |
| 5 | `health-wellness` | Health & Wellness |
| 6 | `education-training` | Education & Training |
| 7 | `events-lifestyle` | Events & Lifestyle |
| 8 | `logistics-other` | Logistics & Other Services |

Subcategories: exactly the lists in the product spec (Electricians, Plumbers, …). Health/professional subs may set a seed flag or CategoryField `documents` required=true (verification already exists as KYC on Business).

Seed **example** dynamic fields (not hardcoded in Web) for at least:

- Electricians, Plumbers, Interior Designers (Home & Property)
- Car Repair (Automotive)
- Photographers (Events)

Plus platform common fields: years of experience (optional), emergency service (boolean), service radius (number), document slots as `asset_ref` where needed.

---

## 6. Implementation slices (dependency order)

Implement **across all three apps inside each slice** only where the slice needs a UI. Do not finish “all of Web” before Super Admin can publish a form.

```text
Slice 0  Plan lock (this document)                         DONE after review
Slice 1  API taxonomy + composed forms                     API first
Slice 2  Super Admin category + form builder               Admin consumes Slice 1
Slice 3  Seed Phase 1 categories + example fields          Admin/API
Slice 4  Web consumes composed forms (onboarding+listings) Web
Slice 5  Approval (providers + offerings)                  API + Admin + Web
Slice 6  Public browse alignment (home/subcategory pages)  Web
Slice 7  Cross-app tests + typecheck
```

Wishlist, guest browse, and auth-intent already work. Do not rebuild them; only extend if a slice regresses them.

---

## 7. Slice 1 — API foundation (do this first)

**Goal:** Super Admin and Web can both call one composed-form contract.

### Schema (reuse + extend)

- `Category`: add `description String?`, `imageUrl String?`
- `CategoryField`: add `placeholder`, `defaultValue`, `conditionalRules`
- `Business`: add `rejectionReason String?`, `formSchemaVersion Int @default(1)`
- `Service`: add `approvalStatus` enum (`draft | pending | approved | rejected`), `rejectionReason String?`, `formSchemaVersion Int @default(1)`, `pricingType String?` (fixed, starting_from, hourly, daily, monthly, contact, custom)

Do **not** create Category/SubCategory/Form/ProviderProfile duplicates.

### Endpoints — public

| Keep / add | Path |
|------------|------|
| Keep | `GET /categories` (hide `_` slugs; active only) |
| Add | `GET /categories/:idOrSlug` (category + children + counts) |
| Keep | `GET /categories/:idOrSlug/fields?scope=` |
| Add | `GET /categories/:idOrSlug/forms/:kind` where `kind` is `provider` \| `listing` — **composed** |
| Keep | `GET /search` |
| Keep | `GET /businesses/:slugOrId` |
| Keep | `GET /services/business/:businessId` (public: only `approvalStatus=approved` and `isActive`) |

### Endpoints — admin (extend existing `/api/admin`)

| Keep / add | Path |
|------------|------|
| Keep | category CRUD |
| Add | `DELETE /admin/categories/:id` — **deactivate** if referenced; refuse hard delete when businesses/services exist |
| Add | `PUT /admin/category-fields/reorder` `{ ids: uuid[] }` |
| Keep | field CRUD |
| Add | `GET /admin/forms/:categoryId?kind=provider\|listing` — layered fields for the builder |
| Add | listing (service) list/get/approve/reject/status |
| Extend | `PUT /admin/businesses/:id` reject with `rejectionReason` (activate already exists) |
| Extend | `GET /admin/stats` — users, businesses (providers), services (listings), pending both, category/subcategory counts |

### Validation

Reuse `normalizeAndValidateFieldValues` on the **composed** field list. Evaluate `conditionalRules`: if parent field ≠ expected, skip required check for the child field.

### Ownership

Keep current pattern: `requireAuth` + owner check on businesses/services. Admin routes stay `requirePermission`. Do not trust Web role flags.

**Files (expected):** `schema.prisma`, migration, `categories.repository.ts`, `categories.service.ts`, `categories.routes.ts`, `admin.routes.ts`, `category-fields.ts`, `services.*`, `businesses.*`, `admin.repository.ts` stats, `seed.ts` (Slice 3), integration tests.

---

## 8. Slice 2 — Super Admin configuration

**Goal:** An operator can create the pipeline without touching code.

### Category management

Replace the single dropdown page with:

1. **Main category list** — name, slug, icon, image, status, subcategory count, created, actions (view/edit/activate/deactivate). Delete = deactivate when referenced.
2. **Create/edit main category** — name, slug, description, icon, image, status, display order.
3. **Subcategory list inside a main** — status, provider-field count, listing-field count, provider count, listing count, Configure forms.

### Form builder (highest leverage UI)

Per subcategory (and optionally per main + platform common):

```text
Provider registration form  |  Listing form
```

Show stacked fields: label, type, required, order. Add field. Edit: name/key, label, placeholder, description, type, required, default, options, validation min/max/length, status, conditional rule. Reorder via up/down or drag (up/down is enough for Phase 1 if drag slips).

Do not build a separate “Forms” table UI — the builder is a view over `CategoryField` layers.

**Files:** `CategoriesPage.tsx` (likely split into list / detail / FormBuilder), `lib/api.ts`, `DashboardPage.tsx` stats, `AdminLayout.tsx` nav if a Listings admin page is added in Slice 5.

---

## 9. Slice 3 — Seed Phase 1 taxonomy

After Slice 1 APIs exist:

1. Upsert 8 mains + all listed subs.
2. Deactivate obsolete demo roots that are not in the new tree (keep rows).
3. Remap existing demo businesses’ `Listing.categoryId` to the nearest new subcategory so `/listings` is not empty.
4. Seed platform common fields + the five example subcategory field sets.
5. Super Admin remains able to change all of this; Web never contains this tree.

---

## 10. Slice 4 — Web dynamic consumption

**Goal:** Web has one renderer. Category trees come only from `GET /categories`.

### `DynamicForm`

Evolve `CategoryFieldsEditor` (do not create a second parallel component):

```text
<DynamicForm
  fields={composed.fields}
  values={values}
  onChange={...}
/>
```

Honor `conditionalRules`, `placeholder`, `defaultValue`, `uiWidget` (radio vs select, location JSON). Submit still goes through `toFieldValuePayload`.

### Provider onboarding (`/list-business`)

```text
Select main category → select subcategory → GET composed provider form → submit POST /businesses → pending
```

Today the category picker is a flat list. Change to two-step from the API tree. Load `forms/provider` for the **subcategory** id.

### Create / edit listing (`/provider/listings`)

```text
Select category/subcategory (default: business’s category) → GET forms/listing → POST /services → pending approval
```

Add edit route for an existing service. Publish/unpublish maps to `isActive` **only after** `approvalStatus=approved`.

### Do not

- Hardcode Home pillars (replace with API mains).
- Add ElectricianForm.tsx / PlumberForm.tsx.
- Call field APIs with only the parent id when a subcategory is selected.

**Files:** `CategoryFieldsEditor.tsx` → DynamicForm behavior, `ListBusiness.tsx`, `ProviderListings.tsx`, `Home.tsx`, `Listings.tsx` (subcategory filters from API children), `lib/api.ts`.

---

## 11. Slice 5 — Approval (all three apps)

```text
User → dynamic provider form → Business pending
Admin → activate / reject(+reason)
Approved → provider dashboard + create listings

Provider → dynamic listing form → Service pending
Admin → approve / reject(+reason)
Approved + isActive → visible on public provider profile
```

- Super Admin: Businesses page already activates/suspends — add Reject + reason; filter by category.
- Super Admin: new Listings (services) page — search, filter, approve/reject, link to provider.
- Web: show pending/rejected banners on dashboard and My Listings. Do not show rejected offerings publicly.
- API: `servicesService.create` sets `approvalStatus=pending` (admins may auto-approve). Public list filters approved.

KYC (`/verification`) stays as the medical/professional document path; CategoryFields can require extra docs. Do not invent a second KYC system.

---

## 12. Slice 6 — Public browse alignment

Guest pages (no login): Home, category/subcategory browse, search, listing (business) details, provider profile.

- Home category grid = API mains (icons from `category.icon` / image).
- `/listings/:categorySlug` already works; populate subcategory chips from `GET /categories/:slug` children.
- Search: keep current filters; add optional `subcategory` (schema already has the query key — verify repository uses it). Price filter on **offerings** is Phase 2 unless cheap to add as metadata on directory cards.
- Provider profile: show approved services as “Listings” with price/pricingType.

Auth-required (already gated): wishlist, account, onboarding, provider routes, reviews.

Preserve auth intent for wishlist; do not force login on browse.

---

## 13. Slice 7 — Testing (three apps together)

Run after each slice and as a final gate: API integration tests + typecheck (`apps/api`, `apps/web`, `apps/super-admin`).

**Category contract**

```text
Admin creates main + sub → API stores → Web Home/listings show it
```

**Form contract**

```text
Admin adds provider fields on Electricians → publishes (isActive)
Web fetches /forms/provider for electricians → DynamicForm renders those fields
```

**Provider contract**

```text
User registers (consumer) → Become provider → pick Home & Property → Electricians
→ submit → Admin pending queue → approve → /provider enabled
```

**Listing contract**

```text
Provider creates listing → pending → Admin approve → appears on public profile
```

**Wishlist contract** (regression)

```text
Guest → heart → login → item saved
```

**Security**

```text
User cannot PATCH another owner’s service
User cannot call /admin/*
Inactive category omitted from new onboarding but old business URL still loads for owner/admin
```

---

## 14. Authorization (already in place — do not weaken)

| Actor | How |
|-------|-----|
| Guest | Public GETs only |
| User | Auth cookie; wishlist; become provider via `POST /businesses` (role upgrades to `business` + RBAC `service_provider`) |
| Provider | Same account; owner checks on `/businesses/:id` and `/services/:id` |
| Admin / Super Admin | Isolated `apps/super-admin` + `requirePermission` on `/api/admin` |

A stale JWT must not allow managing another user’s listings. Continue ownership checks in the service layer.

---

## 15. Out of Phase 1 (do not implement now)

- Messaging, requests/leads, reviews-on-offerings
- Payments / Stripe
- Breaking `Listing` 1:1 with `Business` so offerings are the search index
- Dedicated provider subdomain / `apps/provider`
- Dropping legacy `Role` enum
- Charts on Super Admin dashboard
- Drag-and-drop if up/down reorder ships
- Refresh tokens
- Response-envelope rewrite
- Hardcoded per-subcategory React forms
- New Form/SubCategory/ProviderProfile tables

---

## 16. Cursor execution rules

1. Inspect is done; implement **Slice 1 only** until composed forms exist.
2. Reuse models in §3.1. Do not duplicate.
3. Do not hardcode the 8-category tree in `apps/web`.
4. Do not break guest browse, wishlist intent, or admin RBAC.
5. Typecheck/lint after each slice.
6. Prefer deactivating categories over deleting.
7. Keep API error shape.
8. Treat Super Admin field `scope`: `listing`/`business` = provider registration; `service` = listing form.
9. Product copy: “Listing” = `Service`; “Provider” = `Business`; “Category page” = directory `Listing` search.

---

## 17. Acceptance criteria (Phase 1 done)

### Categories

- [ ] Eight mains and listed subs exist in the database and Super Admin.
- [ ] Web shows them from the API only.
- [ ] Inactive categories hidden from new registration/listing; existing rows remain.

### Forms

- [ ] Super Admin can add/edit/reorder/require/activate fields for provider and listing forms.
- [ ] Composed GET returns common + main + sub.
- [ ] Web `DynamicForm` renders that payload.
- [ ] No subcategory-specific React form components.

### Providers

- [ ] Consumer can become a provider without a second account.
- [ ] Registration uses the composed form for the chosen subcategory.
- [ ] Pending → admin approve/reject(+reason) → dashboard.

### Listings (offerings)

- [ ] Provider creates/edits/deletes offerings via composed listing form.
- [ ] Pending → admin approve → public on provider profile.
- [ ] Publish/unpublish after approval.

### Auth / security

- [ ] Guest browse works.
- [ ] Wishlist resume-after-login still works.
- [ ] Provider ownership enforced on the API.
- [ ] Admin APIs permission-gated.
- [ ] Backend validates dynamic fields (including conditionals).
