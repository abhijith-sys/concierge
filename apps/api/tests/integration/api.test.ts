import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { loadEnv, resetEnvCache } from "../../src/config/env";
import { prisma } from "../../src/shared/db/prisma";
import { hashOtp } from "../../src/shared/integrations/storage";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("API integration", () => {
  const app = createApp();
  const suffix = Date.now();
  let userAgent = request.agent(app);
  let businessAgent = request.agent(app);
  let adminAgent = request.agent(app);
  let businessId = "";
  let categoryId = "";

  beforeAll(async () => {
    resetEnvCache();
    loadEnv();
    await prisma.$connect();

    const { assignDefaultRoleForLegacy, ensureRbacCatalog } = await import(
      "../../src/shared/auth/rbac.service"
    );
    await ensureRbacCatalog(prisma);

    const category = await prisma.category.findFirst({ where: { parentId: { not: null } } });
    if (!category) {
      const parent = await prisma.category.create({
        data: { name: "Test Parent", slug: `test-parent-${suffix}`, sortOrder: 99 },
      });
      const child = await prisma.category.create({
        data: {
          name: "Test Child",
          slug: `test-child-${suffix}`,
          parentId: parent.id,
          sortOrder: 1,
        },
      });
      categoryId = child.id;
    } else {
      categoryId = category.id;
    }

    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: `user-${suffix}@test.local`,
        password: "Concierge123!",
        role: "user",
      })
      .expect(201);

    userAgent = request.agent(app);
    await userAgent
      .post("/api/auth/login")
      .send({ email: `user-${suffix}@test.local`, password: "Concierge123!" })
      .expect(200);

    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Biz",
        email: `biz-${suffix}@test.local`,
        password: "Concierge123!",
        role: "business",
      })
      .expect(201);
    businessAgent = request.agent(app);
    await businessAgent
      .post("/api/auth/login")
      .send({ email: `biz-${suffix}@test.local`, password: "Concierge123!" })
      .expect(200);

    const adminEmail = `admin-${suffix}@test.local`;
    const passwordHash = await import("bcryptjs").then((m) => m.hash("Concierge123!", 10));
    const adminUser = await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash,
        role: "admin",
        emailVerifiedAt: new Date(),
      },
    });
    await assignDefaultRoleForLegacy(adminUser.id, "admin");
    adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({ email: adminEmail, password: "Concierge123!" }).expect(200);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects unauthenticated uploads", async () => {
    await request(app)
      .post("/api/uploads")
      .send({ data: "aaaa", mime: "image/png" })
      .expect(401);
  });

  it("authenticated upload creates an Asset row", async () => {
    // 1x1 PNG
    const png =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const res = await userAgent
      .post("/api/uploads")
      .send({ data: png, mime: "image/png", visibility: "public" })
      .expect(201);
    expect(res.body.file.url).toMatch(/^\/uploads\/public\//);
    expect(res.body.asset.id).toBeTruthy();
    expect(res.body.file.assetId).toBe(res.body.asset.id);
    const asset = await prisma.asset.findUnique({ where: { id: res.body.asset.id } });
    expect(asset?.status).toBe("ready");
    expect(asset?.uploadedById).toBeTruthy();
  });

  it("supports OTP request and verify", async () => {
    await businessAgent.post("/api/auth/otp/request").send({ channel: "email", purpose: "register" }).expect(200);
    const user = await prisma.user.findUnique({ where: { email: `biz-${suffix}@test.local` } });
    const challenge = await prisma.verificationChallenge.findFirst({
      where: { userId: user!.id, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    expect(challenge).toBeTruthy();
    // Force known code for assert
    await prisma.verificationChallenge.update({
      where: { id: challenge!.id },
      data: { codeHash: hashOtp("424242") },
    });
    const verified = await businessAgent
      .post("/api/auth/otp/verify")
      .send({ channel: "email", purpose: "register", code: "424242" })
      .expect(200);
    expect(verified.body.user.emailVerifiedAt).toBeTruthy();
  });

  it("refreshes an authenticated session", async () => {
    const refreshed = await userAgent.post("/api/auth/refresh").expect(200);
    expect(refreshed.body.user.email).toBe(`user-${suffix}@test.local`);
    await userAgent.get("/api/auth/me").expect(200);
  });

  it("resets a password with email OTP", async () => {
    const email = `reset-${suffix}@test.local`;
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Reset User", email, password: "Concierge123!" })
      .expect(201);
    await request(app).post("/api/auth/forgot-password").send({ email, method: "account" }).expect(200);
    const user = await prisma.user.findUnique({ where: { email } });
    const challenge = await prisma.verificationChallenge.findFirst({
      where: { userId: user!.id, purpose: "reset", consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    await prisma.verificationChallenge.update({
      where: { id: challenge!.id },
      data: { codeHash: hashOtp("424242") },
    });
    const verified = await request(app)
      .post("/api/auth/verify-reset-otp")
      .send({ email, method: "account", code: "424242" })
      .expect(200);
    expect(verified.body.resetToken).toBeTruthy();
    await request(app)
      .post("/api/auth/reset-password")
      .send({
        email,
        method: "account",
        newPassword: "NewPass123!",
        resetToken: verified.body.resetToken,
      })
      .expect(200);
    await request(app).post("/api/auth/login").send({ email, password: "NewPass123!" }).expect(200);
  });

  it("creates business with hours and lists for owner", async () => {
    const fieldsRes = await request(app).get(`/api/categories/${categoryId}/fields`).expect(200);
    const required = (fieldsRes.body.fields as { key: string; required: boolean }[]).filter((f) => f.required);
    const fieldValues = required.map((f) => ({
      key: f.key,
      value: f.key === "license_number" ? "LIC-12345" : "value",
    }));

    const created = await businessAgent
      .post("/api/businesses")
      .send({
        name: `Studio ${suffix}`,
        email: `studio-${suffix}@test.local`,
        title: "Studio listing title",
        description: "A carefully considered studio profile for integration tests.",
        address: "1 Test Street",
        city: "New York",
        categoryId,
        lat: 40.7128,
        lng: -74.006,
        hours: { monday: ["09:00", "17:00"], tuesday: ["09:00", "17:00"] },
        images: [],
        coverUrl: "https://example.com/cover.jpg",
        socialLinks: { instagram: "https://instagram.com/example" },
        ...(fieldValues.length ? { fieldValues } : {}),
      })
      .expect(201);
    businessId = created.body.business.id;
    expect(created.body.business.status).toBe("pending");

    const pendingItem = await businessAgent
      .post("/api/services")
      .send({
        businessId,
        name: "Pending catalog item",
        description: "Submitted while the business profile is still pending review.",
        price: 80,
        currency: "USD",
      })
      .expect(201);
    expect(pendingItem.body.service.approvalStatus).toBe("pending");

    const mine = await businessAgent.get("/api/businesses/mine").expect(200);
    expect(mine.body.businesses.some((b: { id: string }) => b.id === businessId)).toBe(true);

    await request(app).get(`/api/businesses/${created.body.business.slug}`).expect(404);

    await adminAgent
      .post(`/api/admin/businesses/${businessId}/reject`)
      .send({ reason: "Missing license details" })
      .expect(200);
    const afterReject = await businessAgent.get("/api/businesses/mine").expect(200);
    const rejected = afterReject.body.businesses.find((b: { id: string }) => b.id === businessId);
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectionReason).toBe("Missing license details");
  });

  it("supports services CRUD ownership rules", async () => {
    await userAgent
      .post("/api/services")
      .send({
        businessId,
        name: "Hack",
        description: "Should not be allowed for non-owners of this business.",
        price: 1,
      })
      .expect(403);

    await businessAgent
      .post("/api/services")
      .send({
        businessId,
        name: "Consultation",
        description: "One hour design consultation for new clients.",
        price: 150,
        currency: "USD",
        durationMinutes: 60,
      })
      .expect(403);

    await adminAgent.post(`/api/admin/businesses/${businessId}/activate`).expect(200);

    const created = await businessAgent
      .post("/api/services")
      .send({
        businessId,
        name: "Consultation",
        description: "One hour design consultation for new clients.",
        price: 150,
        currency: "USD",
        durationMinutes: 60,
      })
      .expect(201);
    expect(created.body.service.approvalStatus).toBe("pending");

    const hidden = await request(app).get(`/api/services/business/${businessId}`).expect(200);
    expect(hidden.body.services).toHaveLength(0);

    await adminAgent
      .post(`/api/admin/listings/${created.body.service.id}/reject`)
      .send({ reason: "Need more photos of completed work" })
      .expect(200);

    await adminAgent.post(`/api/admin/listings/${created.body.service.id}/approve`).expect(200);

    const publicServices = await request(app).get(`/api/services/business/${businessId}`).expect(200);
    expect(publicServices.body.services).toHaveLength(1);

    const patched = await businessAgent
      .patch(`/api/services/${created.body.service.id}`)
      .send({ name: "Design consultation" })
      .expect(200);
    expect(patched.body.service.name).toBe("Design consultation");

    await userAgent
      .patch(`/api/services/${created.body.service.id}`)
      .send({ name: "Stolen listing" })
      .expect(403);

    await businessAgent.delete(`/api/services/${created.body.service.id}`).expect(204);
    const after = await request(app).get(`/api/services/business/${businessId}`).expect(200);
    expect(after.body.services).toHaveLength(0);
  });

  it("admin can suspend and hide from search", async () => {
    await adminAgent.post(`/api/admin/businesses/${businessId}/suspend`).expect(200);
    const search = await request(app).get("/api/search?q=Studio&city=New%20York").expect(200);
    expect(search.body.items.every((b: { id: string }) => b.id !== businessId)).toBe(true);
    await adminAgent.post(`/api/admin/businesses/${businessId}/activate`).expect(200);
  });

  it("nearby search orders by distance", async () => {
    const res = await request(app)
      .get("/api/search")
      .query({ lat: 40.7128, lng: -74.006, radiusKm: 25, pageSize: 50 })
      .expect(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    const withDistance = res.body.items.filter((item: { distanceKm?: number }) => typeof item.distanceKm === "number");
    for (let i = 1; i < withDistance.length; i += 1) {
      expect(withDistance[i].distanceKm).toBeGreaterThanOrEqual(withDistance[i - 1].distanceKm);
    }
  });

  it("non-admin cannot access admin APIs", async () => {
    await userAgent.get("/api/admin/businesses").expect(403);
    await businessAgent.get("/api/admin/businesses").expect(403);
    await request(app).get("/api/admin/businesses").expect(401);
  });

  it("login returns RBAC permissions for admin", async () => {
    const me = await adminAgent.get("/api/auth/me").expect(200);
    expect(me.body.user.roles).toContain("super_admin");
    expect(me.body.user.permissions).toContain("businesses.moderate");
    expect(me.body.user.permissions).toContain("roles.manage");
  });

  it("consumer login has no admin permissions", async () => {
    const me = await userAgent.get("/api/auth/me").expect(200);
    expect(me.body.user.roles).toContain("consumer");
    expect(me.body.user.permissions ?? []).not.toContain("businesses.read");
  });

  it("admin can manage category fields", async () => {
    const created = await adminAgent
      .post(`/api/admin/categories/${categoryId}/fields`)
      .send({
        key: `test_field_${suffix}`,
        label: "Test field",
        fieldType: "text",
        required: false,
        scope: "listing",
      })
      .expect(201);
    expect(created.body.field.key).toBe(`test_field_${suffix}`);

    const publicFields = await request(app).get(`/api/categories/${categoryId}/fields`).expect(200);
    expect(publicFields.body.fields.some((f: { key: string }) => f.key === `test_field_${suffix}`)).toBe(
      true,
    );

    await adminAgent.delete(`/api/admin/category-fields/${created.body.field.id}`).expect(204);
  });

  it("signup is always a consumer even if a business role is sent", async () => {
    const email = `consumer-${suffix}@test.local`;
    const registered = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Later Provider",
        email,
        password: "Concierge123!",
        role: "business",
      })
      .expect(201);
    expect(registered.body.user.role).toBe("user");
    expect(registered.body.user.roles).toContain("consumer");
    expect(registered.body.user.businessCount).toBe(0);
  });

  it("lets a consumer become a provider by creating a business", async () => {
    const fieldsRes = await request(app).get(`/api/categories/${categoryId}/fields`).expect(200);
    const required = (fieldsRes.body.fields as { key: string; required: boolean }[]).filter((f) => f.required);
    const fieldValues = required.map((f) => ({
      key: f.key,
      value: f.key === "license_number" ? "LIC-99999" : "value",
    }));

    const created = await userAgent
      .post("/api/businesses")
      .send({
        name: `Consumer Biz ${suffix}`,
        email: `consumer-biz-${suffix}@test.local`,
        title: "Consumer-created studio",
        description: "A consumer account becoming a provider through onboarding.",
        address: "2 Test Street",
        city: "New York",
        categoryId,
        hours: { monday: ["09:00", "17:00"] },
        images: [],
        ...(fieldValues.length ? { fieldValues } : {}),
      })
      .expect(201);
    expect(created.body.business.status).toBe("pending");
    expect(created.body.user.role).toBe("business");
    expect(created.body.user.roles).toContain("service_provider");
    expect(created.body.user.businessCount).toBeGreaterThan(0);

    const mine = await userAgent.get("/api/businesses/mine").expect(200);
    expect(mine.body.businesses.some((b: { id: string }) => b.id === created.body.business.id)).toBe(true);
  });

  it("requires auth for wishlist and stores listing ids for public businesses", async () => {
    await request(app).get("/api/wishlist").expect(401);
    await request(app).post("/api/wishlist").send({ listingId: listing!.id }).expect(401);

    const listing = await prisma.listing.findFirst({
      where: { businessId },
      select: { id: true },
    });
    expect(listing).toBeTruthy();

    const added = await userAgent.post("/api/wishlist").send({ listingId: listing!.id }).expect(201);
    expect(added.body.item.listingId).toBe(listing!.id);

    const listed = await userAgent.get("/api/wishlist").expect(200);
    expect(listed.body.items.some((item: { listingId: string }) => item.listingId === listing!.id)).toBe(
      true,
    );

    await userAgent.delete(`/api/wishlist/${listing!.id}`).expect(204);
    const after = await userAgent.get("/api/wishlist").expect(200);
    expect(after.body.items.some((item: { listingId: string }) => item.listingId === listing!.id)).toBe(
      false,
    );
  });

  it("composes provider forms from platform, main, and subcategory fields", async () => {
    const parent = await prisma.category.findUnique({ where: { id: categoryId } });
    const mainId = parent?.parentId ?? categoryId;

    await request(app).get(`/api/categories/${categoryId}/forms/provider`).expect(200);
    const platform = await prisma.category.findUnique({ where: { slug: "_platform" } });
    expect(platform).toBeTruthy();

    await adminAgent
      .post(`/api/admin/categories/${platform!.id}/fields`)
      .send({
        key: `common_staff_${suffix}`,
        label: "Staff count",
        fieldType: "number",
        required: false,
        scope: "listing",
      })
      .expect(201);

    await adminAgent
      .post(`/api/admin/categories/${mainId}/fields`)
      .send({
        key: `main_exp_${suffix}`,
        label: "Years of experience",
        fieldType: "number",
        required: false,
        scope: "listing",
      })
      .expect(201);

    const override = await adminAgent
      .post(`/api/admin/categories/${categoryId}/fields`)
      .send({
        key: `common_staff_${suffix}`,
        label: "Crew size",
        fieldType: "number",
        required: true,
        scope: "listing",
      })
      .expect(201);

    const tree = await request(app).get("/api/categories").expect(200);
    expect(tree.body.categories.length).toBeGreaterThan(0);
    expect(tree.body.categories.every((c: { slug: string }) => !c.slug.startsWith("_"))).toBe(true);
    expect(tree.body.categories.some((c: { id: string }) => c.id === categoryId)).toBe(true);

    const detail = await request(app).get(`/api/categories/${categoryId}`).expect(200);
    expect(detail.body.category.id).toBe(categoryId);

    const form = await request(app).get(`/api/categories/${categoryId}/forms/provider`).expect(200);
    expect(form.body.kind).toBe("provider");
    const byKey = new Map(form.body.fields.map((f: { key: string; label: string; source: string; required: boolean }) => [f.key, f]));
    expect(byKey.get(`main_exp_${suffix}`)).toBeTruthy();
    expect(byKey.get(`common_staff_${suffix}`)).toMatchObject({
      label: "Crew size",
      required: true,
      source: "sub",
    });

    const reordered = await adminAgent
      .put("/api/admin/category-fields/reorder")
      .send({ ids: [override.body.field.id] })
      .expect(200);
    expect(reordered.body.fields[0].sortOrder).toBe(0);
  });

  it("lets Super Admin create a category tree that public browse can load", async () => {
    const main = await adminAgent
      .post("/api/admin/categories")
      .send({
        name: `Home Contract ${suffix}`,
        slug: `home-contract-${suffix}`,
        description: "Main category for Phase 1 contract tests.",
        icon: "home_repair_service",
        imageUrl: "/assets/builders-hero.jpg",
        bannerUrl: "/assets/heritage-estate.jpg",
      })
      .expect(201);
    expect(main.body.category.imageUrl).toBe("/assets/builders-hero.jpg");
    expect(main.body.category.bannerUrl).toBe("/assets/heritage-estate.jpg");

    const sub = await adminAgent
      .post("/api/admin/categories")
      .send({
        name: `Electricians ${suffix}`,
        slug: `electricians-contract-${suffix}`,
        parentId: main.body.category.id,
        icon: "electrical_services",
        description: "Verified electricians for residential and commercial work.",
        imageUrl: "/assets/elite-plans.jpg",
        bannerUrl: "/assets/aura-showroom.jpg",
      })
      .expect(201);

    const tree = await request(app).get("/api/categories").expect(200);
    const publicMain = tree.body.categories.find((row: { id: string }) => row.id === main.body.category.id);
    expect(publicMain?.name).toBe(`Home Contract ${suffix}`);
    expect(publicMain?.imageUrl).toBe("/assets/builders-hero.jpg");
    expect(publicMain?.bannerUrl).toBe("/assets/heritage-estate.jpg");
    expect(publicMain?.children?.some((row: { id: string }) => row.id === sub.body.category.id)).toBe(true);

    const detail = await request(app).get(`/api/categories/${sub.body.category.slug}`).expect(200);
    expect(detail.body.category.parent.id).toBe(main.body.category.id);
    expect(detail.body.category.bannerUrl).toBe("/assets/aura-showroom.jpg");
    expect(detail.body.category.description).toContain("electricians");
    expect(detail.body.category.children ?? []).toEqual([]);

    await adminAgent
      .post(`/api/admin/categories/${sub.body.category.id}/fields`)
      .send({
        key: `wire_type_${suffix}`.replace(/-/g, "_"),
        label: "Wiring type",
        fieldType: "select",
        required: true,
        scope: "listing",
        options: ["residential", "commercial"],
      })
      .expect(201);

    await adminAgent
      .post(`/api/admin/categories/${sub.body.category.id}/fields`)
      .send({
        key: `callout_fee_${suffix}`.replace(/-/g, "_"),
        label: "Call-out fee",
        fieldType: "number",
        required: false,
        scope: "service",
      })
      .expect(201);

    const providerForm = await request(app)
      .get(`/api/categories/${sub.body.category.slug}/forms/provider`)
      .expect(200);
    expect(providerForm.body.kind).toBe("provider");
    expect(
      providerForm.body.fields.some((field: { key: string; scope: string }) =>
        field.key.startsWith("wire_type_") && field.scope === "listing",
      ),
    ).toBe(true);

    const listingForm = await request(app)
      .get(`/api/categories/${sub.body.category.slug}/forms/listing`)
      .expect(200);
    expect(listingForm.body.kind).toBe("listing");
    expect(
      listingForm.body.fields.some((field: { key: string; scope: string }) =>
        field.key.startsWith("callout_fee_") && field.scope === "service",
      ),
    ).toBe(true);

    await adminAgent
      .patch(`/api/admin/categories/${main.body.category.id}`)
      .send({ isActive: false })
      .expect(200);
    await adminAgent
      .patch(`/api/admin/categories/${main.body.category.id}`)
      .send({ isActive: true })
      .expect(200);

    const unused = await adminAgent
      .post("/api/admin/categories")
      .send({ name: `Unused ${suffix}`, slug: `unused-cat-${suffix}` })
      .expect(201);
    await adminAgent.delete(`/api/admin/categories/${unused.body.category.id}?hard=true`).expect(200);
    await request(app).get(`/api/categories/${unused.body.category.slug}`).expect(404);
  });

  it("covers consumer onboarding, listing approval, and inactive categories", async () => {
    const main = await adminAgent
      .post("/api/admin/categories")
      .send({
        name: `Onboard Main ${suffix}`,
        slug: `onboard-main-${suffix}`,
      })
      .expect(201);
    const sub = await adminAgent
      .post("/api/admin/categories")
      .send({
        name: `Onboard Sub ${suffix}`,
        slug: `onboard-sub-${suffix}`,
        parentId: main.body.category.id,
      })
      .expect(201);

    const email = `onboard-${suffix}@test.local`;
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Onboard User", email, password: "Concierge123!" })
      .expect(201);
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email, password: "Concierge123!" }).expect(200);
    const onboardUser = await prisma.user.findUnique({ where: { email } });
    const onboardOtp = await prisma.verificationChallenge.findFirst({
      where: { userId: onboardUser!.id, purpose: "register", consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    await prisma.verificationChallenge.update({
      where: { id: onboardOtp!.id },
      data: { codeHash: hashOtp("424242") },
    });
    await agent.post("/api/auth/verify-signup-otp").send({ code: "424242" }).expect(200);

    const fieldsRes = await request(app).get(`/api/categories/${sub.body.category.id}/forms/provider`).expect(200);
    const fieldValues = (fieldsRes.body.fields as {
      key: string;
      required: boolean;
      fieldType: string;
      options?: string[] | null;
    })
      .filter((field) => field.required)
      .map((field) => ({
        key: field.key,
        value:
          field.fieldType === "boolean"
            ? true
            : field.fieldType === "number"
              ? 5
              : field.fieldType === "select"
                ? field.options?.[0] ?? "Other"
                : field.fieldType === "multiselect"
                  ? field.options?.slice(0, 1) ?? ["value"]
                  : field.key.includes("license")
                    ? "LIC-555"
                    : "value",
      }));

    const created = await agent
      .post("/api/businesses")
      .send({
        name: `Onboard Studio ${suffix}`,
        email: `onboard-studio-${suffix}@test.local`,
        title: "Onboard studio",
        description: "Consumer becoming a provider through the composed registration form.",
        address: "9 Contract Street",
        city: "Austin",
        categoryId: sub.body.category.id,
        hours: { monday: ["09:00", "17:00"] },
        images: [],
        ...(fieldValues.length ? { fieldValues } : {}),
      })
      .expect(201);
    expect(created.body.business.status).toBe("pending");
    expect(created.body.user.roles).toContain("service_provider");

    const pendingQueue = await adminAgent
      .get("/api/admin/businesses")
      .query({ status: "pending", q: `Onboard Studio ${suffix}` })
      .expect(200);
    expect(pendingQueue.body.items.some((row: { id: string }) => row.id === created.body.business.id)).toBe(true);

    await request(app).get(`/api/businesses/${created.body.business.slug}`).expect(404);
    await adminAgent.post(`/api/admin/businesses/${created.body.business.id}/activate`).expect(200);
    await request(app).get(`/api/businesses/${created.body.business.slug}`).expect(200);

    const listing = await agent
      .post("/api/services")
      .send({
        businessId: created.body.business.id,
        categoryId: sub.body.category.id,
        name: "Emergency callout",
        description: "Same-day electrical callout for residential faults.",
        price: 90,
        currency: "USD",
        pricingType: "starting_from",
      })
      .expect(201);
    expect(listing.body.service.approvalStatus).toBe("pending");

    const hidden = await request(app).get(`/api/services/business/${created.body.business.id}`).expect(200);
    expect(hidden.body.services).toHaveLength(0);

    await adminAgent.post(`/api/admin/listings/${listing.body.service.id}/approve`).expect(200);
    const visible = await request(app).get(`/api/services/business/${created.body.business.id}`).expect(200);
    expect(visible.body.services).toHaveLength(1);
    expect(visible.body.services[0].pricingType).toBe("starting_from");

    const search = await request(app)
      .get("/api/search")
      .query({ subcategory: sub.body.category.slug, city: "Austin" })
      .expect(200);
    expect(search.body.items.some((item: { id: string }) => item.id === created.body.business.id)).toBe(true);

    await adminAgent.delete(`/api/admin/categories/${sub.body.category.id}`).expect(200);
    const tree = await request(app).get("/api/categories").expect(200);
    const parent = tree.body.categories.find((row: { id: string }) => row.id === main.body.category.id);
    expect(parent?.children?.some((row: { id: string }) => row.id === sub.body.category.id)).toBeFalsy();
    await request(app).get(`/api/categories/${sub.body.category.slug}`).expect(404);

    await agent
      .post("/api/businesses")
      .send({
        name: `Blocked Studio ${suffix}`,
        email: `blocked-studio-${suffix}@test.local`,
        title: "Should not use inactive subcategory",
        description: "Onboarding must refuse deactivated categories.",
        address: "10 Contract Street",
        city: "Austin",
        categoryId: sub.body.category.id,
        hours: { monday: ["09:00", "17:00"] },
        images: [],
      })
      .expect(400);

    const stillVisible = await agent.get(`/api/businesses/${created.body.business.slug}`).expect(200);
    expect(stillVisible.body.business.id).toBe(created.body.business.id);
    const adminView = await adminAgent.get(`/api/businesses/${created.body.business.slug}`).expect(200);
    expect(adminView.body.business.id).toBe(created.body.business.id);
  });
});
