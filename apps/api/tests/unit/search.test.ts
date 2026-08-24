import { describe, expect, it } from "vitest";
import { searchRepository } from "../../src/modules/search/search.repository";
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
