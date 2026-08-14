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
    const listing = where.listing as { category?: { OR?: Array<{ slug?: string; parent?: { slug?: string } }> } };
    expect(listing.category?.OR).toEqual([
      { slug: "electricians" },
      { parent: { slug: "electricians" } },
    ]);
  });

  it("matches a main category slug against itself or its children", () => {
    const where = searchRepository.buildWhere(query({ category: "automotive" }));
    const listing = where.listing as { category?: { OR?: Array<{ slug?: string }> } };
    expect(listing.category?.OR?.[0]).toEqual({ slug: "automotive" });
    expect(listing.category?.OR?.[1]).toEqual({ parent: { slug: "automotive" } });
  });

  it("only returns active providers", () => {
    const where = searchRepository.buildWhere(query());
    expect(where.status).toBe("active");
  });
});
