import type { Category, Listing } from "./api";

export type MarketplaceKind = "supplier" | "service";

export function categoryKind(category?: Pick<Category, "kind"> | null): MarketplaceKind {
  return category?.kind === "service" ? "service" : "supplier";
}

export function listingKind(listing?: Pick<Listing, "listingKind" | "category"> | null): MarketplaceKind {
  if (listing?.listingKind === "service" || listing?.listingKind === "supplier") return listing.listingKind;
  return categoryKind(listing?.category);
}

export function isSupplierListing(listing?: Pick<Listing, "listingKind" | "category"> | null) {
  return listingKind(listing) === "supplier";
}

export function hasKind(category: Category, kind: MarketplaceKind): boolean {
  if (category.kind === kind) return true;
  return (category.children ?? []).some((child) => hasKind(child, kind));
}

export function mainsForKind(tree: Category[], kind: MarketplaceKind) {
  return tree.filter((main) => hasKind(main, kind));
}

export function sortSupplierFirst<T extends { kind?: MarketplaceKind | null; sortOrder?: number }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const aKind = a.kind === "service" ? 1 : 0;
    const bKind = b.kind === "service" ? 1 : 0;
    return aKind - bKind || (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export function mixedKindChildren(category?: Category | null) {
  const children = category?.children ?? [];
  if (!children.length) return false;
  return children.some((child) => categoryKind(child) !== categoryKind(children[0]));
}
