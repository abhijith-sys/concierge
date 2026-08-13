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
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash,
        role: "admin",
        emailVerifiedAt: new Date(),
      },
    });
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

  it("creates business with hours and lists for owner", async () => {
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
      })
      .expect(201);
    businessId = created.body.business.id;
    expect(created.body.business.status).toBe("pending");

    const mine = await businessAgent.get("/api/businesses/mine").expect(200);
    expect(mine.body.businesses.some((b: { id: string }) => b.id === businessId)).toBe(true);

    await request(app).get(`/api/businesses/${created.body.business.slug}`).expect(404);
  });

  it("supports services CRUD ownership rules", async () => {
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

    await userAgent
      .post("/api/services")
      .send({
        businessId,
        name: "Hack",
        description: "Should not be allowed for non-owners of this business.",
        price: 1,
      })
      .expect(403);

    await adminAgent
      .post(`/api/admin/businesses/${businessId}/activate`)
      .expect(200);

    const publicServices = await request(app).get(`/api/services/business/${businessId}`).expect(200);
    expect(publicServices.body.services).toHaveLength(1);

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
  });
});
