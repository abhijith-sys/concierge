import { BusinessStatus, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assignDefaultRoleForLegacy, ensureRbacCatalog } from "../src/shared/auth/rbac.service.js";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Concierge123!";

const categories = [
  { name: "B2B Services", slug: "b2b", icon: "business_center", sortOrder: 1 },
  { name: "Home & Repairs", slug: "home-repairs", icon: "home_repair_service", sortOrder: 2 },
  { name: "Real Estate", slug: "real-estate", icon: "apartment", sortOrder: 3 },
  { name: "Medical", slug: "medical", icon: "medical_services", sortOrder: 4 },
  { name: "Restaurants", slug: "restaurants", icon: "restaurant", sortOrder: 5 },
  { name: "Hotels", slug: "hotels", icon: "hotel", sortOrder: 6 },
  { name: "Beauty & Spa", slug: "beauty-spa", icon: "spa", sortOrder: 7 },
  { name: "Contractors", slug: "contractors", icon: "construction", sortOrder: 8 },
  { name: "Events", slug: "events", icon: "celebration", sortOrder: 9 },
  { name: "Lifestyle", slug: "lifestyle", icon: "local_activity", sortOrder: 10 },
];

const childCategories = [
  // Keep nav pillars populated: /listings/b2b, /listings/real-estate, /listings/home-repairs
  { name: "Material Suppliers", slug: "material-suppliers", parentSlug: "b2b", icon: "inventory_2", sortOrder: 1 },
  { name: "Architects & Builders", slug: "architects-builders", parentSlug: "real-estate", icon: "architecture", sortOrder: 1 },
  { name: "Home Decor", slug: "home-decor", parentSlug: "home-repairs", icon: "chair", sortOrder: 1 },
  { name: "Tech Repair", slug: "tech-repair", parentSlug: "home-repairs", icon: "devices", sortOrder: 2 },
  { name: "Banquet Halls", slug: "banquet-halls", parentSlug: "events", icon: "festival", sortOrder: 1 },
  { name: "Bridal Wear", slug: "bridal-wear", parentSlug: "events", icon: "checkroom", sortOrder: 2 },
  { name: "Caterers", slug: "caterers", parentSlug: "events", icon: "room_service", sortOrder: 3 },
  { name: "Luxury Spas", slug: "luxury-spas", parentSlug: "beauty-spa", icon: "spa", sortOrder: 1 },
  { name: "Top Salons", slug: "top-salons", parentSlug: "beauty-spa", icon: "content_cut", sortOrder: 2 },
  { name: "Elite Gyms", slug: "elite-gyms", parentSlug: "beauty-spa", icon: "fitness_center", sortOrder: 3 },
  { name: "Grocery", slug: "grocery", parentSlug: "lifestyle", icon: "local_grocery_store", sortOrder: 1 },
  { name: "Movies", slug: "movies", parentSlug: "lifestyle", icon: "movie", sortOrder: 2 },
]

const listingImages = [
  "/assets/brett-villa.jpg",
  "/assets/terra-stone.jpg",
  "/assets/arcadian-desert.jpg",
  "/assets/heritage-estate.jpg",
];

const businesses = [
  {
    name: "Elite Build & Masonry",
    slug: "elite-build-masonry",
    category: "material-suppliers",
    city: "New York",
    address: "150 Madison Avenue, New York, NY",
    description: "Curating exquisite architectural materials and engineering luxury custom homes for more than three decades.",
    lat: 40.7458,
    lng: -73.9847,
    images: ["/assets/concierge-architectural-hero.jpg", "/assets/elite-slab.jpg", "/assets/elite-plans.jpg"],
  },
  {
    name: "Aura Interior & Furniture",
    slug: "aura-interior-furniture",
    category: "home-decor",
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
    category: "architects-builders",
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
    category: "material-suppliers",
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
    category: "architects-builders",
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
    category: "architects-builders",
    city: "New York",
    address: "12 East 74th Street, New York, NY",
    description: "Expert restoration of landmark estates through traditional craft and modern precision.",
    lat: 40.7731,
    lng: -73.9652,
    images: [listingImages[3]],
  },
];

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
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    categoryIds.set(category.slug, saved.id);
  }
  for (const category of childCategories) {
    const { parentSlug, ...data } = category;
    const saved = await prisma.category.upsert({
      where: { slug: data.slug },
      update: { ...data, parentId: categoryIds.get(parentSlug)! },
      create: { ...data, parentId: categoryIds.get(parentSlug)! },
    });
    categoryIds.set(data.slug, saved.id);
  }

  const contractorsId = categoryIds.get("contractors");
  if (contractorsId) {
    const contractorFields = [
      {
        key: "license_number",
        label: "License number",
        helpText: "State contractor license or registration ID",
        fieldType: "text" as const,
        required: false,
        section: "Credentials",
        sortOrder: 1,
        validation: { minLength: 3, maxLength: 64 },
      },
      {
        key: "years_in_business",
        label: "Years in business",
        fieldType: "number" as const,
        required: false,
        section: "Credentials",
        sortOrder: 2,
        validation: { min: 0, max: 200 },
      },
      {
        key: "specialties",
        label: "Specialties",
        fieldType: "multiselect" as const,
        required: false,
        section: "Services",
        sortOrder: 3,
        options: ["Masonry", "Framing", "Roofing", "Remodeling", "New construction"],
      },
      {
        key: "insured",
        label: "Fully insured",
        fieldType: "boolean" as const,
        required: false,
        section: "Credentials",
        sortOrder: 4,
      },
    ];
    for (const field of contractorFields) {
      await prisma.categoryField.upsert({
        where: { categoryId_key: { categoryId: contractorsId, key: field.key } },
        update: {
          label: field.label,
          helpText: field.helpText ?? null,
          fieldType: field.fieldType,
          required: field.required,
          section: field.section,
          sortOrder: field.sortOrder,
          options: field.options,
          validation: field.validation,
          isActive: true,
          scope: "listing",
        },
        create: {
          categoryId: contractorsId,
          key: field.key,
          label: field.label,
          helpText: field.helpText ?? null,
          fieldType: field.fieldType,
          required: field.required,
          section: field.section,
          sortOrder: field.sortOrder,
          options: field.options,
          validation: field.validation,
          scope: "listing",
          isActive: true,
        },
      });
    }
  }

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
    await prisma.listing.upsert({
      where: { businessId: business.id },
      update: {
        categoryId: categoryIds.get(item.category)!,
        title: item.name,
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
        categoryId: categoryIds.get(item.category)!,
        title: item.name,
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
    await prisma.service.deleteMany({ where: { businessId: business.id, name: "Design consultation" } });
    await prisma.service.create({
      data: {
        businessId: business.id,
        name: "Design consultation",
        description: "A one-hour consultation to scope your project and recommend next steps.",
        price: 150,
        currency: "USD",
        durationMinutes: 60,
        isActive: true,
        images: [],
      },
    });
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
    `[seed] upserted RBAC catalog, ${categories.length + childCategories.length} categories, ${businesses.length} businesses, and demo reviews`,
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
