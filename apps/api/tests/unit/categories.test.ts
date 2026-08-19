import { describe, expect, it } from "vitest";
import { phase1Mains, phase1Subs } from "../../prisma/taxonomy";
import { categoryUpsertSchema } from "../../src/modules/categories/categories.repository";

describe("category upsert schema", () => {
  it("accepts create payload with catalog media", () => {
    const parsed = categoryUpsertSchema.parse({
      name: "Home",
      slug: "home",
      description: "Desc",
      kind: "service",
      imageUrl: "/assets/categories/home-property.jpg",
      bannerUrl: "/uploads/public/banner.jpg",
    });
    expect(parsed.kind).toBe("service");
    expect(parsed.imageUrl).toBe("/assets/categories/home-property.jpg");
    expect(parsed.bannerUrl).toBe("/uploads/public/banner.jpg");
  });

  it("treats empty media strings as null", () => {
    const parsed = categoryUpsertSchema.parse({
      name: "Home",
      imageUrl: "",
      bannerUrl: "",
    });
    expect(parsed.imageUrl).toBeNull();
    expect(parsed.bannerUrl).toBeNull();
  });

  it("allows patching only isActive without touching media", () => {
    const parsed = categoryUpsertSchema.partial().parse({ isActive: false });
    expect(parsed).toEqual({ isActive: false });
    expect(parsed.imageUrl).toBeUndefined();
    expect(parsed.bannerUrl).toBeUndefined();
  });
});

describe("taxonomy seed catalog", () => {
  it("seeds twelve unique main categories with their own card and banner images", () => {
    expect(phase1Mains).toHaveLength(12);
    const slugs = phase1Mains.map((item) => item.slug);
    expect(new Set(slugs).size).toBe(12);
    expect(new Set(phase1Mains.map((item) => item.imageUrl)).size).toBe(12);
    expect(new Set(phase1Mains.map((item) => item.bannerUrl)).size).toBe(12);
    for (const category of phase1Mains) {
      expect(category.imageUrl).toBe(`/assets/categories/${category.slug}.jpg`);
      expect(category.bannerUrl).toBe(`/assets/categories/${category.slug}-banner.jpg`);
    }
  });

  it("adds the new mains without duplicating slugs", () => {
    const slugs = [...phase1Mains, ...phase1Subs].map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(phase1Mains.map((item) => item.slug)).toEqual(
      expect.arrayContaining(["hotels-resorts-stays", "rental-hire", "travel-taxi-transport"]),
    );
    expect(phase1Mains.map((item) => item.slug)).toEqual(
      expect.arrayContaining(["fashion-apparel", "home-property", "automotive"]),
    );
  });

  it("nests rental item types under rental groups", () => {
    expect(phase1Subs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: "vehicle-rental", parentSlug: "rental-hire" }),
        expect.objectContaining({ slug: "car-rental", parentSlug: "vehicle-rental" }),
        expect.objectContaining({ slug: "camera-rental", parentSlug: "electronics-rental" }),
        expect.objectContaining({ slug: "taxi-services", parentSlug: "travel-taxi-transport" }),
        expect.objectContaining({ slug: "hotels", parentSlug: "hotels-resorts-stays" }),
        expect.objectContaining({ slug: "electrical", parentSlug: "home-property" }),
        expect.objectContaining({ slug: "clothing", parentSlug: "fashion-apparel" }),
      ]),
    );
  });
});
