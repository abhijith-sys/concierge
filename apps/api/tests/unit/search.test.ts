import { describe, expect, it, vi } from "vitest";
import { searchRepository } from "../../src/modules/search/search.repository";
import { searchService } from "../../src/modules/search/search.service";
import { suggestQuerySchema } from "../../src/modules/search/search.schemas";
import type { SearchQuery } from "../../src/modules/search/search.schemas";

function query(partial: Partial<SearchQuery> = {}): SearchQuery {
  return { page: 1, pageSize: 12, ...partial };
}

describe("search filters", () => {
  it("prefers subcategory over category when both are present", () => {
    const where = searchRepository.buildWhere(
      query({ category: "home-property", subcategory: "electricians" }),
    );
    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          OR: [
            {
              listing: {
                is: {
                  category: {
                    OR: [
                      { slug: "electricians" },
                      { parent: { slug: "electricians" } },
                      { parent: { parent: { slug: "electricians" } } },
                    ],
                  },
                },
              },
            },
            {
              services: {
                some: {
                  isActive: true,
                  approvalStatus: "approved",
                  category: {
                    OR: [
                      { slug: "electricians" },
                      { parent: { slug: "electricians" } },
                      { parent: { parent: { slug: "electricians" } } },
                    ],
                  },
                },
              },
            },
          ],
        }),
      ]),
    );
  });

  it("matches a main category slug against itself, children, grandchildren, or offerings", () => {
    const where = searchRepository.buildWhere(query({ category: "automotive" }));
    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          OR: expect.arrayContaining([
            {
              listing: {
                is: {
                  category: {
                    OR: [
                      { slug: "automotive" },
                      { parent: { slug: "automotive" } },
                      { parent: { parent: { slug: "automotive" } } },
                    ],
                  },
                },
              },
            },
          ]),
        }),
      ]),
    );
  });

  it("filters shops vs service professionals by listingKind", () => {
    const shops = searchRepository.buildWhere(query({ kind: "supplier" }));
    expect(shops.AND).toEqual(expect.arrayContaining([{ listing: { listingKind: "supplier" } }]));
    const trades = searchRepository.buildWhere(query({ kind: "service" }));
    expect(trades.AND).toEqual(expect.arrayContaining([{ listing: { listingKind: "service" } }]));
  });

  it("only returns active providers", () => {
    const where = searchRepository.buildWhere(query());
    expect(where.AND).toEqual(expect.arrayContaining([{ status: "active" }]));
  });
});

describe("search suggest", () => {
  it("parses suggest query params", () => {
    expect(suggestQuerySchema.parse({ q: "plumber", city: "Kochi", limit: "5" })).toEqual({
      q: "plumber",
      city: "Kochi",
      limit: 5,
    });
  });

  it("always includes a query suggestion with listings href", async () => {
    vi.spyOn(searchRepository, "suggestBusinesses").mockResolvedValue([]);
    vi.spyOn(searchRepository, "suggestListingTitles").mockResolvedValue([]);
    vi.spyOn(searchRepository, "suggestCategories").mockResolvedValue([]);

    const result = await searchService.suggest({ q: "plumber", city: "Kochi", limit: 8 });
    expect(result.suggestions).toEqual([
      {
        type: "query",
        label: 'Search "plumber"',
        href: "/listings?q=plumber&city=Kochi",
      },
    ]);

    vi.restoreAllMocks();
  });

  it("returns typed suggestion objects", async () => {
    vi.spyOn(searchRepository, "suggestBusinesses").mockResolvedValue([
      { id: "b1", name: "Ace Plumbing", slug: "ace-plumbing" },
    ]);
    vi.spyOn(searchRepository, "suggestListingTitles").mockResolvedValue([]);
    vi.spyOn(searchRepository, "suggestCategories").mockResolvedValue([
      { id: "c1", name: "Plumbers", slug: "plumbers" },
    ]);

    const result = await searchService.suggest({ q: "plumb", limit: 8 });
    for (const item of result.suggestions) {
      expect(["business", "category", "query"]).toContain(item.type);
      expect(typeof item.label).toBe("string");
      if (item.type !== "query") {
        expect(item.href).toMatch(/^\//);
      }
    }

    vi.restoreAllMocks();
  });
});
