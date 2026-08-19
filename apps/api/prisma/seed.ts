import { BusinessStatus, Prisma, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
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

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Concierge123!";

const listingImages = {
  electrical: "/assets/listings/electrical-shop.jpg",
  plumbing: "/assets/listings/plumbing.jpg",
  furniture: "/assets/listings/furniture.jpg",
  garments: "/assets/listings/garments.jpg",
  electrician: "/assets/listings/electrician.jpg",
  home: "/assets/categories/home-property.jpg",
  fashion: "/assets/categories/fashion-apparel.jpg",
  electronics: "/assets/categories/electronics-technology.jpg",
  logistics: "/assets/categories/logistics-other.jpg",
} as const;

type DemoCatalogItem = {
  name: string;
  description: string;
  price: number;
  pricingType?: string;
  images: string[];
  fields?: Record<string, string | number | boolean>;
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
  whatsapp?: string;
  orderModes?: string[];
  minOrderQty?: number;
  sellsSinglePiece?: boolean;
  wholesale?: boolean;
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
      "Architectural materials for luxury homes and commercial envelopes. Bulk slab reservations, made-to-order panels, and single-piece samples.",
    lat: 40.7458,
    lng: -73.9847,
    images: [listingImages.logistics, listingImages.home],
    years: 30,
    whatsapp: "+1 212 555 0100",
    orderModes: ["Bulk", "By order", "Single piece"],
    minOrderQty: 1,
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "Calacatta Borghini Selection",
        description: "Imported from Carrara, Italy",
        price: 0,
        pricingType: "contact",
        images: [listingImages.home],
        fields: {
          availability_qty: "42 Slabs",
          thickness: "20mm / 30mm",
          finish: "Polished",
          unit: "slab",
          moq: 1,
          custom_order: true,
        },
      },
      {
        name: "Engineered Timber",
        description: "Sustainable European Oak & Walnut",
        price: 0,
        pricingType: "contact",
        images: [listingImages.furniture],
        fields: { selection_note: "12 Variants", unit: "sqm", moq: 20 },
      },
      {
        name: "Architectural Steel",
        description: "Custom Beams & Facade Panels",
        price: 0,
        pricingType: "contact",
        images: [listingImages.logistics],
        fields: { selection_note: "4 Finishes", unit: "piece", custom_order: true },
      },
      {
        name: "Structural Glass",
        description: "High-Performance Thermal Glazing",
        price: 0,
        pricingType: "contact",
        images: [listingImages.electronics],
        fields: { selection_note: "Ultra-Clear", unit: "panel" },
      },
    ],
  },
  {
    name: "Volt & Wire Electrical",
    slug: "volt-wire-electrical",
    category: "electrical",
    city: "New York",
    address: "410 Queens Boulevard, New York, NY",
    headline: "Best-rate electrical supplies, any quantity.",
    description:
      "Wholesale electrical shop for contractors and homeowners. Cables, switchgear, lighting, and panels — bulk coils, project orders, or a single piece at trade rates.",
    lat: 40.735,
    lng: -73.877,
    images: [listingImages.electrical, listingImages.electronics],
    years: 18,
    whatsapp: "+1 718 555 0142",
    orderModes: ["Bulk", "By order", "Single piece"],
    minOrderQty: 1,
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "Copper building wire 2.5mm",
        description: "ISI copper conductor, 90m coil or cut length.",
        price: 42,
        pricingType: "starting_from",
        images: [listingImages.electrical],
        fields: { unit: "coil", moq: 1, price_bulk: 38, price_piece: 42, lead_time_days: 0 },
      },
      {
        name: "Modular switch range",
        description: "16A switches and sockets. Box or single piece.",
        price: 2.4,
        pricingType: "starting_from",
        images: [listingImages.electronics],
        fields: { unit: "piece", moq: 10, price_bulk: 1.9, price_piece: 2.4, lead_time_days: 2 },
      },
      {
        name: "LED panel lights 18W",
        description: "Trade packs of 20 or single replacements.",
        price: 9.5,
        pricingType: "starting_from",
        images: [listingImages.electrical],
        fields: { unit: "piece", moq: 4, price_bulk: 7.8, price_piece: 9.5 },
      },
    ],
  },
  {
    name: "AquaFlow Plumbing Supplies",
    slug: "terra-stone-collective",
    category: "plumbing-items",
    city: "New York",
    address: "210 West 18th Street, New York, NY",
    headline: "Pipes, fittings, and sanitary ware at trade rates.",
    description:
      "Plumbing wholesaler for fit-outs and repairs. CPVC, PVC, valves, and bathroom fittings in bulk, on-order, or as single replacements.",
    lat: 40.7411,
    lng: -74.0002,
    images: [listingImages.plumbing, listingImages.home],
    years: 14,
    whatsapp: "+1 212 555 0188",
    orderModes: ["Bulk", "By order", "Single piece"],
    minOrderQty: 1,
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "CPVC pipe 3/4 inch",
        description: "3m lengths. Bundle of 10 or single stick.",
        price: 6.2,
        pricingType: "starting_from",
        images: [listingImages.plumbing],
        fields: { unit: "length", moq: 1, price_bulk: 5.4, price_piece: 6.2 },
      },
      {
        name: "Brass ball valves",
        description: "Quarter-turn valves, 1/2 to 2 inch.",
        price: 4.8,
        pricingType: "starting_from",
        images: [listingImages.plumbing],
        fields: { unit: "piece", moq: 5, price_bulk: 3.9, price_piece: 4.8 },
      },
    ],
  },
  {
    name: "Aura Interior & Furniture",
    slug: "aura-interior-furniture",
    category: "home-decor",
    city: "New York",
    address: "88 Wooster Street, New York, NY",
    headline: "Home décor wholesale for living and hospitality.",
    description:
      "A curated sanctuary of artisanal décor, lighting, and furniture. Project lots for interiors houses, or a single statement piece.",
    lat: 40.723,
    lng: -74.0017,
    images: [listingImages.furniture, listingImages.home],
    years: 12,
    whatsapp: "+1 212 555 0164",
    orderModes: ["Bulk", "By order", "Single piece"],
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "Artisan lounge chair",
        description: "Hand-finished oak frame with linen upholstery.",
        price: 420,
        pricingType: "starting_from",
        images: [listingImages.furniture],
        fields: { unit: "piece", moq: 1, price_bulk: 360, price_piece: 420, custom_order: true, lead_time_days: 21 },
      },
      {
        name: "Ceramic table lamp set",
        description: "Trade carton of 6, or single showroom piece.",
        price: 85,
        pricingType: "starting_from",
        images: [listingImages.furniture],
        fields: { unit: "piece", moq: 1, price_bulk: 68, price_piece: 85 },
      },
    ],
  },
  {
    name: "Loom & Thread Garments",
    slug: "brett-architects-builders",
    category: "clothing",
    city: "Brooklyn",
    address: "45 Main Street, Brooklyn, NY",
    headline: "Apparel wholesale, uniforms, and fabrics.",
    description:
      "Garment supplier for retailers, hotels, and workwear buyers. Full lots, made-to-order uniforms, or sample pieces at published rates.",
    lat: 40.7033,
    lng: -73.9903,
    images: [listingImages.garments, listingImages.fashion],
    years: 9,
    whatsapp: "+1 347 555 0119",
    orderModes: ["Bulk", "By order", "Single piece"],
    minOrderQty: 12,
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "Cotton work shirts",
        description: "Sizes S–XXL. Dozen packs or sample.",
        price: 14,
        pricingType: "starting_from",
        images: [listingImages.garments],
        fields: { unit: "piece", moq: 12, price_bulk: 11, price_piece: 16, lead_time_days: 7 },
      },
      {
        name: "Hotel linen uniforms",
        description: "Made-to-order sets with embroidery.",
        price: 0,
        pricingType: "contact",
        images: [listingImages.fashion],
        fields: { unit: "set", custom_order: true, lead_time_days: 18 },
      },
    ],
  },
  {
    name: "Stride Wholesale Footwear",
    slug: "arcadian-structures",
    category: "shoes",
    city: "Scottsdale",
    address: "7200 East Camelback Road, Scottsdale, AZ",
    headline: "Footwear lots for retailers and job sites.",
    description:
      "Shoes and safety footwear at trade rates. Case packs for stores, or a single pair when you need a replacement fast.",
    lat: 33.5021,
    lng: -111.9261,
    images: [listingImages.fashion, listingImages.garments],
    years: 11,
    whatsapp: "+1 480 555 0177",
    orderModes: ["Bulk", "Single piece"],
    minOrderQty: 1,
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "Safety boots S3",
        description: "Steel toe, oil-resistant sole. Pair or carton of 8.",
        price: 48,
        pricingType: "starting_from",
        images: [listingImages.fashion],
        fields: { unit: "pair", moq: 1, price_bulk: 39, price_piece: 48 },
      },
      {
        name: "Everyday canvas sneakers",
        description: "Assorted sizes, mixed carton or sample pair.",
        price: 18,
        pricingType: "starting_from",
        images: [listingImages.garments],
        fields: { unit: "pair", moq: 6, price_bulk: 14, price_piece: 18 },
      },
    ],
  },
  {
    name: "Metro Line Electricians",
    slug: "heritage-artisan-group",
    category: "electricians",
    city: "New York",
    address: "12 East 74th Street, New York, NY",
    headline: "Licensed electricians for install and repair.",
    description:
      "Residential and commercial electrical work — wiring, lighting, and switchboards. Second-priority trade listing when you need a technician, not a shop.",
    lat: 40.7731,
    lng: -73.9652,
    images: [listingImages.electrician],
    years: 16,
    supportTurnaround: "24h",
    catalog: [
      {
        name: "Site visit & wiring repair",
        description: "Licensed electrician callout for diagnostics and repair.",
        price: 120,
        pricingType: "starting_from",
        images: [listingImages.electrician],
      },
    ],
  },
];

function jsonField(value: Prisma.InputJsonValue | object | undefined) {
  return value === undefined ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

function isAdminMedia(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/public/")) return false;
  const uploadRoot = process.env.UPLOAD_ROOT ?? path.resolve("uploads");
  return existsSync(path.join(uploadRoot, "public", url.slice("/uploads/public/".length)));
}

function keepImages(existing: unknown, fallback: string[]) {
  if (!Array.isArray(existing)) return fallback;
  const urls = existing.filter((item): item is string => typeof item === "string" && item.length > 0);
  return urls.some((url) => url.startsWith("/uploads/")) ? urls : fallback;
}

function seedFieldData(value: string | number | boolean | string[]) {
  if (typeof value === "boolean") return { valueBool: value, valueNumber: null, valueText: null, valueJson: Prisma.DbNull };
  if (typeof value === "number") return { valueNumber: value, valueBool: null, valueText: null, valueJson: Prisma.DbNull };
  if (Array.isArray(value)) {
    return { valueJson: value as Prisma.InputJsonValue, valueText: null, valueNumber: null, valueBool: null };
  }
  return { valueText: value, valueNumber: null, valueBool: null, valueJson: Prisma.DbNull };
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
  const categoryKinds = new Map<string, "supplier" | "service">();

  const platform = await prisma.category.upsert({
    where: { slug: PLATFORM_CATEGORY_SLUG },
    update: { name: "Platform common fields", isActive: true, sortOrder: 0 },
    create: { name: "Platform common fields", slug: PLATFORM_CATEGORY_SLUG, isActive: true, sortOrder: 0 },
  });
  categoryIds.set(PLATFORM_CATEGORY_SLUG, platform.id);

  for (const category of phase1Mains) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
      select: { imageUrl: true, bannerUrl: true },
    });
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        ...category,
        parentId: null,
        isActive: true,
        imageUrl: isAdminMedia(existing?.imageUrl) ? existing.imageUrl : category.imageUrl,
        bannerUrl: isAdminMedia(existing?.bannerUrl) ? existing.bannerUrl : category.bannerUrl,
      },
      create: { ...category, isActive: true },
    });
    categoryIds.set(category.slug, saved.id);
    categoryKinds.set(category.slug, category.kind);
  }

  for (const category of phase1Subs) {
    const { parentSlug, ...data } = category;
    const parentId = categoryIds.get(parentSlug);
    if (!parentId) throw new Error(`Missing parent category ${parentSlug}`);
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
      select: { imageUrl: true, bannerUrl: true },
    });
    const saved = await prisma.category.upsert({
      where: { slug: data.slug },
      update: {
        ...data,
        parentId,
        isActive: true,
        imageUrl: isAdminMedia(existing?.imageUrl) ? existing.imageUrl : data.imageUrl,
        bannerUrl: isAdminMedia(existing?.bannerUrl) ? existing.bannerUrl : data.bannerUrl,
      },
      create: { ...data, parentId, isActive: true },
    });
    categoryIds.set(data.slug, saved.id);
    categoryKinds.set(data.slug, data.kind);
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
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: item.slug },
      select: { coverUrl: true, listing: { select: { images: true } } },
    });
    const coverUrl = isAdminMedia(existingBusiness?.coverUrl) ? existingBusiness.coverUrl : item.images[0];
    const listingImagesKept = keepImages(existingBusiness?.listing?.images, item.images);
    const business = await prisma.business.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        email: `hello@${item.slug}.example`,
        verified: true,
        status: BusinessStatus.active,
        coverUrl,
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
        coverUrl,
        socialLinks: {
          instagram: `https://instagram.com/${item.slug}`,
        },
      },
    });
    businessIds.push(business.id);
    const categoryId = categoryIds.get(item.category);
    if (!categoryId) throw new Error(`Missing seeded category ${item.category}`);
    const categoryKind = categoryKinds.get(item.category) ?? "supplier";
    const listing = await prisma.listing.upsert({
      where: { businessId: business.id },
      update: {
        categoryId,
        listingKind: categoryKind,
        title: item.headline ?? item.name,
        description: item.description,
        address: item.address,
        city: item.city,
        lat: item.lat,
        lng: item.lng,
        images: listingImagesKept,
        featured: index < 2,
      },
      create: {
        businessId: business.id,
        categoryId,
        listingKind: categoryKind,
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
        images: listingImagesKept,
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

    const listingShopFields: Array<[string, string | number | boolean | string[]]> = [];
    if (item.orderModes?.length) listingShopFields.push(["order_modes", item.orderModes]);
    if (item.minOrderQty != null) listingShopFields.push(["min_order_qty", item.minOrderQty]);
    if (item.sellsSinglePiece != null) listingShopFields.push(["sells_single_piece", item.sellsSinglePiece]);
    if (item.wholesale != null) listingShopFields.push(["wholesale_available", item.wholesale]);
    if (item.whatsapp) listingShopFields.push(["whatsapp", item.whatsapp]);
    for (const [key, value] of listingShopFields) {
      const fieldId = platformFields.get(key);
      if (!fieldId) continue;
      await prisma.listingFieldValue.upsert({
        where: { listingId_fieldId: { listingId: listing.id, fieldId } },
        update: seedFieldData(value),
        create: { listingId: listing.id, fieldId, ...seedFieldData(value) },
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
          where: {
            key: { in: Object.keys(entry.fields) },
            categoryId: { in: [categoryId, platform.id] },
          },
          select: { id: true, key: true, categoryId: true },
        });
        const preferred = new Map<string, { id: string; key: string }>();
        for (const field of categoryFields) {
          if (field.categoryId === platform.id && preferred.has(field.key)) continue;
          preferred.set(field.key, field);
        }
        for (const field of preferred.values()) {
          const value = entry.fields[field.key];
          if (value === undefined) continue;
          await prisma.serviceFieldValue.upsert({
            where: { serviceId_fieldId: { serviceId: service.id, fieldId: field.id } },
            update: seedFieldData(value),
            create: { serviceId: service.id, fieldId: field.id, ...seedFieldData(value) },
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
    [5, 5, 5, 5, 5, 5, 4, 4, 4, 4],
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
