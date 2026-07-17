import { BusinessStatus, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

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
  { name: "Home Decor", slug: "home-decor", icon: "chair", sortOrder: 8 },
  { name: "Contractors", slug: "contractors", icon: "construction", sortOrder: 9 },
  { name: "Events", slug: "events", icon: "celebration", sortOrder: 10 },
  { name: "Lifestyle", slug: "lifestyle", icon: "local_activity", sortOrder: 11 },
];

const childCategories = [
  { name: "Architects & Builders", slug: "architects-builders", parentSlug: "contractors", icon: "architecture", sortOrder: 1 },
  { name: "Banquet Halls", slug: "banquet-halls", parentSlug: "events", icon: "festival", sortOrder: 1 },
  { name: "Bridal Wear", slug: "bridal-wear", parentSlug: "events", icon: "checkroom", sortOrder: 2 },
  { name: "Caterers", slug: "caterers", parentSlug: "events", icon: "room_service", sortOrder: 3 },
  { name: "Luxury Spas", slug: "luxury-spas", parentSlug: "beauty-spa", icon: "spa", sortOrder: 1 },
  { name: "Top Salons", slug: "top-salons", parentSlug: "beauty-spa", icon: "content_cut", sortOrder: 2 },
  { name: "Elite Gyms", slug: "elite-gyms", parentSlug: "beauty-spa", icon: "fitness_center", sortOrder: 3 },
  { name: "Grocery", slug: "grocery", parentSlug: "lifestyle", icon: "local_grocery_store", sortOrder: 1 },
  { name: "Movies", slug: "movies", parentSlug: "lifestyle", icon: "movie", sortOrder: 2 },
  { name: "Tech Repair", slug: "tech-repair", parentSlug: "home-repairs", icon: "devices", sortOrder: 1 },
];

const listingImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCkPy83L2hYccue0GMpC-PfWkDhGsx49ISAAHx8cmQQaOdpi3q7kIlXGClcyX13qcuuR7chykg2b0xFZ_LJfs1Ye0zJWg9pwFqCw6eZBCYhnAa0Q37v-0AVYtUewZzGUdEjOM7GVKJGXlYQkv5isD5pH_nl8-Cn3Prairvy_-V2bKamGn2Po44Pg1yK8y5Mc6GFJ8NLjU4AV7CcBd_6OkV4b1toO8wlszJ6__x2wugmu1RXHDppcH1ZAIpGEk-VERIlzBp9oSEEeZA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjXDKmj_R_ynVXSZYiNeU6rfaINfe0Yrekjpc0ipoKWjkE39235nfnmLKrxVtNbrxD2_RXwif5EVod6HAbY9sNo_W0AVFpFWDyq_YYhDl3rmHqxiQ7VLUqoYOsi17Zb_Mh1wMUsPk5XHj3fqNw6J9ho2Dxj4Q9H_PG65Ux_xZvRbO2TMKnTghIQW7YvMW5hCv_GoBtm5Z-cPi95db8C7JAq7VASJhGFG9AWFo9DQDgmcdoH0KeEkhS_A6IlVEKjr6y12pTpczglMY",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBgz_ll44-BGxZNamhqx5YD4s6VET4o9oBSMg2-8mh58YNEEtZQ-GpiFgmS6e1W9xg4MizWNx93wQXFDfwpEqVrCK7Y8YWPoC-w_H60Xqw0dhzw660QCyjCixqpCW6CapXZG5w-gfpoByn949vctDBQv463d-9JQJed8N7d05p05FkOL0dy_bGYFxM6rWplms6VbFKJL4v4EZnWbfHJvzb--vMn4IM91A30cqMgbHfCCpdw2DykgiGvx_g7-zuBUPXfLR3BbJMfkIE",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAAL8Xt-eBV9IrY2wqXeEm7QM2B0ySUXMtgZe6FuXe-1gVQL1uCgM92Q-V65IFlfdI-tG18hSVoAeAatM-Bo3aUVwA8Z63ohO6tUaOuURcfZCmXeujZSj87ilXKOQJlNAM_VP1yNWXaMAtWeR3UiQheHacE29MLci1SbzNjuZAi4l0XoJWszE4un-1Er9QlqdnF9I1dR5yZR_2eHN63fuJ4aE1NT1OKA8uK1MmK7Xu5ppvmOntus5rkIKDtSBUXRjaS3lom4gPN8xA",
];

const businesses = [
  {
    name: "Elite Build & Masonry",
    slug: "elite-build-masonry",
    category: "architects-builders",
    city: "New York",
    address: "150 Madison Avenue, New York, NY",
    description: "Curating exquisite architectural materials and engineering luxury custom homes for more than three decades.",
    lat: 40.7458,
    lng: -73.9847,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOZEZhlHZbzI0QOBTz342yHWvc1Ib7Le5AfjUDhmgu0dOVcKFloSalCa9lC6cEs1bVXSYBfAsOztdpWlsT_VgOp1STGPoqwLfUT10gQdrGjaWyTkXgWXjgweEv95r7hinRddWjjMcCTyp1bPpFH3wNOXLdTNgxcgO7ZpqGAkzKSICu_VPiDCWBfruPZTsKTgsiQU6wCVzILVR2LTva8HZPILrX2BZZmCnjkWG144qqvcaWAiAKVu1H9p6bDuvLp5Lu0034E2vGb3s",
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
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBZmhD-rbyVF3ft0H9nzyrEWzzHD2LKpuhJyy2qAGNONKOcBv44SN6_SFmxo0MCeqyn7mUqAcJyd3kVvnVfxhW1mcZXzhpr7Bs4y9UcAv0cKIVzcYbmGvblbrl25KP1Jmy33rmGxF7kXGjDVCAMGBKT-eiQ0fUPtltkYBan1OW0DSwRsa8zdkiul45LLLE4VtB5ytlpVvQ35SF8Hc6Loqto8aIuDGADLT2dFVuCD45Dn-V4qyq_3_iW6zRjk_HI8J6Yq7AiSZ8HdKE",
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
    image: listingImages[0],
  },
  {
    name: "Terra & Stone Collective",
    slug: "terra-stone-collective",
    category: "architects-builders",
    city: "New York",
    address: "210 West 18th Street, New York, NY",
    description: "Premium stone sourcing and architectural material consultancy for exceptional residential projects.",
    lat: 40.7411,
    lng: -74.0002,
    image: listingImages[1],
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
    image: listingImages[2],
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
    image: listingImages[3],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
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
      update: { name: user.name, role: user.role, passwordHash },
      create: { ...user, passwordHash },
      select: { id: true },
    });
    users.set(user.email, saved);
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

  const businessIds: string[] = [];
  for (const [index, item] of businesses.entries()) {
    const business = await prisma.business.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        email: `hello@${item.slug}.example`,
        verified: true,
        status: BusinessStatus.active,
      },
      create: {
        ownerId: users.get("business@demo.com")!.id,
        name: item.name,
        slug: item.slug,
        email: `hello@${item.slug}.example`,
        phone: "+1 212 555 0100",
        verified: true,
        status: BusinessStatus.active,
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
        images: [item.image],
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
        images: [item.image],
        website: `https://${item.slug}.example`,
        featured: index < 2,
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

  console.log(`[seed] upserted ${categories.length + childCategories.length} categories, ${businesses.length} businesses, and demo reviews`);
}

main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
