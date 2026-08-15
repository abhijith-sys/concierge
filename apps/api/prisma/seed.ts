import { BusinessStatus, Prisma, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assignDefaultRoleForLegacy, ensureRbacCatalog } from "../src/shared/auth/rbac.service.js";
import {
  PLATFORM_CATEGORY_SLUG,
  demoBusinessCategoryMap,
  exampleSubcategoryFields,
  healthWellnessFields,
  phase1Mains,
  phase1Subs,
  platformListingFields,
  platformProviderFields,
  rentalHireListingFields,
  type FieldSeed,
} from "./taxonomy.js";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Concierge123!";

const listingImages = [
  "/assets/brett-villa.jpg",
  "/assets/terra-stone.jpg",
  "/assets/arcadian-desert.jpg",
  "/assets/heritage-estate.jpg",
];

type DemoCatalogItem = {
  name: string;
  description: string;
  price: number;
  pricingType?: string;
  images: string[];
  fields?: Record<string, string>;
};

type DemoBusiness = {
  name: string;
  slug: string;
  category: string;
  city: string;
  address: string;
  headline?: string;
  description: string;
  lat: number;
  lng: number;
  images: string[];
  years?: number;
  supportTurnaround?: string;
  catalog?: DemoCatalogItem[];
};

const businesses: DemoBusiness[] = [
  {
    name: "Elite Build & Masonry",
    slug: "elite-build-masonry",
    category: "fabricators",
    city: "New York",
    address: "150 Madison Avenue, New York, NY",
    headline: "Artistry in Every Atom.",
    description:
      "Curating the world's most exquisite architectural materials for luxury custom homes and high-end commercial developments.\n\nFor over three decades, Elite Build & Masonry has been the silent partner behind the world's most exclusive architectural envelopes. We source rare stones from Italy, Greece, and Brazil to ensure every project is a masterpiece of geological artistry.",
    lat: 40.7458,
    lng: -73.9847,
    images: [
      "/assets/concierge-architectural-hero.jpg",
      "/assets/elite-plans.jpg",
      "/assets/brett-villa.jpg",
      "/assets/terra-stone.jpg",
      "/assets/arcadian-desert.jpg",
    ],
    years: 30,
    supportTurnaround: "24h",
    catalog: [
      {
        name: "Calacatta Borghini Selection",
        description: "Imported from Carrara, Italy",
        price: 0,
        pricingType: "contact",
        images: ["/assets/elite-slab.jpg"],
        fields: {
          availability_qty: "42 Slabs",
          thickness: "20mm / 30mm",
          finish: "Polished",
        },
      },
      {
        name: "Engineered Timber",
        description: "Sustainable European Oak & Walnut",
        price: 0,
        pricingType: "contact",
        images: ["/assets/heritage-estate.jpg"],
        fields: { selection_note: "12 Variants" },
      },
      {
        name: "Architectural Steel",
        description: "Custom Beams & Facade Panels",
        price: 0,
        pricingType: "contact",
        images: ["/assets/builders-hero.jpg"],
        fields: { selection_note: "4 Finishes" },
      },
      {
        name: "Structural Glass",
        description: "High-Performance Thermal Glazing",
        price: 0,
        pricingType: "contact",
        images: ["/assets/aura-showroom.jpg"],
        fields: { selection_note: "Ultra-Clear" },
      },
    ],
  },
  {
    name: "Aura Interior & Furniture",
    slug: "aura-interior-furniture",
    category: "interior-designers",
    city: "New York",
    address: "88 Wooster Street, New York, NY",
    description: "A curated sanctuary of artisanal craftsmanship, contemporary furniture, and bespoke living.",
    lat: 40.723,
    lng: -74.0017,
    images: ["/assets/aura-showroom.jpg", "/assets/aura-chair.jpg", "/assets/aura-craft.jpg"],
  },
  {
    name: "Brett Architects & Builders",
    slug: "brett-architects-builders",
    category: "interior-designers",
    city: "Brooklyn",
    address: "45 Main Street, Brooklyn, NY",
    description: "Award-winning architects and builders creating refined, sustainable homes with natural materials.",
    lat: 40.7033,
    lng: -73.9903,
    images: [listingImages[0]],
  },
  {
    name: "Terra & Stone Collective",
    slug: "terra-stone-collective",
    category: "fabricators",
    city: "New York",
    address: "210 West 18th Street, New York, NY",
    description: "Premium stone sourcing and architectural material consultancy for exceptional residential projects.",
    lat: 40.7411,
    lng: -74.0002,
    images: [listingImages[1]],
  },
  {
    name: "Arcadian Structures",
    slug: "arcadian-structures",
    category: "interior-designers",
    city: "Scottsdale",
    address: "7200 East Camelback Road, Scottsdale, AZ",
    description: "Modern desert architecture combining rammed earth, glass, and integrated landscape design.",
    lat: 33.5021,
    lng: -111.9261,
    images: [listingImages[2]],
  },
  {
    name: "Heritage Artisan Group",
    slug: "heritage-artisan-group",
    category: "interior-designers",
    city: "New York",
    address: "12 East 74th Street, New York, NY",
    description: "Expert restoration of landmark estates through traditional craft and modern precision.",
    lat: 40.7731,
    lng: -73.9652,
    images: [listingImages[3]],
  },
];

function jsonField(value: Prisma.InputJsonValue | object | undefined) {
  return value === undefined ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

async function upsertFields(categoryId: string, fields: FieldSeed[]) {
  for (const field of fields) {
    const options = jsonField(field.options);
    const validation = jsonField(field.validation);
    const conditionalRules = jsonField(field.conditionalRules);
    await prisma.categoryField.upsert({
      where: { categoryId_key: { categoryId, key: field.key } },
      update: {
        label: field.label,
        helpText: field.helpText ?? null,
        placeholder: field.placeholder ?? null,
        fieldType: field.fieldType,
        required: field.required ?? false,
        section: field.section ?? null,
        sortOrder: field.sortOrder,
        options,
        validation,
        conditionalRules,
        isActive: true,
        scope: field.scope,
      },
      create: {
        categoryId,
        key: field.key,
        label: field.label,
        helpText: field.helpText ?? null,
        placeholder: field.placeholder ?? null,
        fieldType: field.fieldType,
        required: field.required ?? false,
        section: field.section ?? null,
        sortOrder: field.sortOrder,
        options,
        validation,
        conditionalRules,
        scope: field.scope,
        isActive: true,
      },
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await ensureRbacCatalog(prisma);

  const demoUsers = [
    { name: "Demo User", email: "user@demo.com", role: Role.user },
    { name: "Demo Business", email: "business@demo.com", role: Role.business },
    { name: "Demo Admin", email: "admin@demo.com", role: Role.admin },
    ...Array.from({ length: 9 }, (_, index) => ({
      name: `Concierge Reviewer ${index + 1}`,
      email: `reviewer${index + 1}@demo.com`,
      role: Role.user,
    })),
  ];

  const users = new Map<string, { id: string }>();
  for (const user of demoUsers) {
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, passwordHash, emailVerifiedAt: new Date() },
      create: { ...user, passwordHash, emailVerifiedAt: new Date() },
      select: { id: true, role: true },
    });
    users.set(user.email, saved);
    await assignDefaultRoleForLegacy(saved.id, saved.role);
  }

  const categoryIds = new Map<string, string>();

  const platform = await prisma.category.upsert({
    where: { slug: PLATFORM_CATEGORY_SLUG },
    update: { name: "Platform common fields", isActive: true, sortOrder: 0 },
    create: { name: "Platform common fields", slug: PLATFORM_CATEGORY_SLUG, isActive: true, sortOrder: 0 },
  });
  categoryIds.set(PLATFORM_CATEGORY_SLUG, platform.id);

  for (const category of phase1Mains) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { ...category, parentId: null, isActive: true },
      create: { ...category, isActive: true },
    });
    categoryIds.set(category.slug, saved.id);
  }

  for (const category of phase1Subs) {
    const { parentSlug, ...data } = category;
    const parentId = categoryIds.get(parentSlug);
    if (!parentId) throw new Error(`Missing parent category ${parentSlug}`);
    const saved = await prisma.category.upsert({
      where: { slug: data.slug },
      update: { ...data, parentId, isActive: true },
      create: { ...data, parentId, isActive: true },
    });
    categoryIds.set(data.slug, saved.id);
  }

  const keepRootSlugs = [...phase1Mains.map((item) => item.slug), PLATFORM_CATEGORY_SLUG];
  await prisma.category.updateMany({
    where: { parentId: null, slug: { notIn: keepRootSlugs } },
    data: { isActive: false },
  });
  const keepChildSlugs = phase1Subs.map((item) => item.slug);
  await prisma.category.updateMany({
    where: { parentId: { not: null }, slug: { notIn: keepChildSlugs } },
    data: { isActive: false },
  });

  await upsertFields(platform.id, [...platformProviderFields, ...platformListingFields]);
  const healthId = categoryIds.get("health-wellness");
  if (healthId) await upsertFields(healthId, healthWellnessFields);
  const rentalHireId = categoryIds.get("rental-hire");
  if (rentalHireId) await upsertFields(rentalHireId, rentalHireListingFields);
  for (const [slug, fields] of Object.entries(exampleSubcategoryFields)) {
    const id = categoryIds.get(slug);
    if (id) await upsertFields(id, fields);
  }

  for (const [fromSlug, toSlug] of Object.entries(demoBusinessCategoryMap)) {
    const fromId = (await prisma.category.findUnique({ where: { slug: fromSlug } }))?.id;
    const toId = categoryIds.get(toSlug);
    if (fromId && toId) {
      await prisma.listing.updateMany({ where: { categoryId: fromId }, data: { categoryId: toId } });
      await prisma.service.updateMany({ where: { categoryId: fromId }, data: { categoryId: toId } });
    }
  }

  const platformFields = new Map(
    (
      await prisma.categoryField.findMany({
        where: { categoryId: platform.id },
        select: { id: true, key: true },
      })
    ).map((field) => [field.key, field.id]),
  );

  const businessIds: string[] = [];
  for (const [index, item] of businesses.entries()) {
    const business = await prisma.business.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        email: `hello@${item.slug}.example`,
        verified: true,
        status: BusinessStatus.active,
        coverUrl: item.images[0],
        socialLinks: {
          instagram: `https://instagram.com/${item.slug}`,
        },
      },
      create: {
        ownerId: users.get("business@demo.com")!.id,
        name: item.name,
        slug: item.slug,
        email: `hello@${item.slug}.example`,
        phone: "+1 212 555 0100",
        verified: true,
        status: BusinessStatus.active,
        coverUrl: item.images[0],
        socialLinks: {
          instagram: `https://instagram.com/${item.slug}`,
        },
      },
    });
    businessIds.push(business.id);
    const categoryId = categoryIds.get(demoBusinessCategoryMap[item.category] ?? item.category);
    if (!categoryId) throw new Error(`Missing seeded category ${item.category}`);
    const listing = await prisma.listing.upsert({
      where: { businessId: business.id },
      update: {
        categoryId,
        title: item.headline ?? item.name,
        description: item.description,
        address: item.address,
        city: item.city,
        lat: item.lat,
        lng: item.lng,
        images: item.images,
        featured: index < 2,
      },
      create: {
        businessId: business.id,
        categoryId,
        title: item.headline ?? item.name,
        description: item.description,
        address: item.address,
        city: item.city,
        lat: item.lat,
        lng: item.lng,
        hours: {
          monday: ["09:00", "18:00"],
          tuesday: ["09:00", "18:00"],
          wednesday: ["09:00", "18:00"],
          thursday: ["09:00", "18:00"],
          friday: ["09:00", "18:00"],
          saturday: ["10:00", "16:00"],
          sunday: null,
        },
        images: item.images,
        website: `https://${item.slug}.example`,
        featured: index < 2,
      },
    });

    const yearsFieldId = platformFields.get("years_of_experience");
    const emergencyFieldId = platformFields.get("emergency_timing");
    const emergencyFlagId = platformFields.get("emergency_service");
    if (item.years != null && yearsFieldId) {
      await prisma.listingFieldValue.upsert({
        where: { listingId_fieldId: { listingId: listing.id, fieldId: yearsFieldId } },
        update: { valueNumber: item.years },
        create: { listingId: listing.id, fieldId: yearsFieldId, valueNumber: item.years },
      });
    }
    if (item.supportTurnaround && emergencyFieldId) {
      if (emergencyFlagId) {
        await prisma.listingFieldValue.upsert({
          where: { listingId_fieldId: { listingId: listing.id, fieldId: emergencyFlagId } },
          update: { valueBool: true },
          create: { listingId: listing.id, fieldId: emergencyFlagId, valueBool: true },
        });
      }
      await prisma.listingFieldValue.upsert({
        where: { listingId_fieldId: { listingId: listing.id, fieldId: emergencyFieldId } },
        update: { valueText: item.supportTurnaround },
        create: { listingId: listing.id, fieldId: emergencyFieldId, valueText: item.supportTurnaround },
      });
    }

    const catalog = item.catalog ?? [
      {
        name: "Design consultation",
        description: "A one-hour consultation to scope your project and recommend next steps.",
        price: 150,
        images: [] as string[],
      },
    ];
    const catalogNames = catalog.map((entry) => entry.name);
    await prisma.service.deleteMany({
      where: { businessId: business.id, name: { in: ["Design consultation", ...catalogNames] } },
    });
    for (const entry of catalog) {
      const service = await prisma.service.create({
        data: {
          businessId: business.id,
          categoryId,
          name: entry.name,
          description: entry.description,
          price: entry.price,
          currency: "USD",
          pricingType: entry.pricingType ?? null,
          durationMinutes: entry.pricingType ? null : 60,
          isActive: true,
          approvalStatus: "approved",
          images: entry.images,
        },
      });
      if (entry.fields) {
        const categoryFields = await prisma.categoryField.findMany({
          where: { categoryId, key: { in: Object.keys(entry.fields) } },
          select: { id: true, key: true },
        });
        for (const field of categoryFields) {
          const value = entry.fields[field.key];
          if (!value) continue;
          await prisma.serviceFieldValue.upsert({
            where: { serviceId_fieldId: { serviceId: service.id, fieldId: field.id } },
            update: { valueText: value },
            create: { serviceId: service.id, fieldId: field.id, valueText: value },
          });
        }
      }
    }
  }

  const reviewerEmails = ["user@demo.com", ...Array.from({ length: 9 }, (_, index) => `reviewer${index + 1}@demo.com`)];
  const scoreSets = [
    [5, 5, 5, 5, 5, 5, 5, 5, 4, 4],
    [5, 5, 5, 5, 5, 5, 5, 5, 5, 4],
    [5, 5, 5, 5, 5, 5, 5, 5, 5, 4],
    [5, 5, 5, 5, 5, 5, 5, 5, 4, 4],
    [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    [5, 5, 5, 5, 5, 5, 5, 4, 4, 4],
  ];

  for (const [businessIndex, businessId] of businessIds.entries()) {
    for (const [reviewerIndex, email] of reviewerEmails.entries()) {
      const userId = users.get(email)!.id;
      const rating = scoreSets[businessIndex][reviewerIndex];
      await prisma.review.upsert({
        where: { userId_businessId: { userId, businessId } },
        update: { rating, comment: "Exceptional service, thoughtful communication, and outstanding craftsmanship." },
        create: {
          userId,
          businessId,
          rating,
          comment: "Exceptional service, thoughtful communication, and outstanding craftsmanship.",
        },
      });
    }
    const aggregate = await prisma.review.aggregate({
      where: { businessId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.listing.update({
      where: { businessId },
      data: {
        avgRating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.rating,
      },
    });
  }

  console.log(
    `[seed] upserted RBAC catalog, ${phase1Mains.length} mains, ${phase1Subs.length} subcategories, ${businesses.length} businesses, and demo reviews`,
  );
}

main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
