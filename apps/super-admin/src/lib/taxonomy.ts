import type { Category } from "./api";

export const PLATFORM_SLUG = "_platform";

export function slugifyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export function keyFromLabel(label: string) {
  const key = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  if (!key) return "";
  return /^[a-z]/.test(key) ? key : `f_${key}`;
}

export function isPlatform(category: { slug: string }) {
  return category.slug === PLATFORM_SLUG;
}

export function flattenCategories(tree: Category[]) {
  const rows: Array<{ id: string; name: string }> = [];
  for (const main of tree) {
    if (main.slug.startsWith("_")) continue;
    rows.push({ id: main.id, name: main.name });
    for (const child of main.children ?? []) {
      rows.push({ id: child.id, name: `${main.name} / ${child.name}` });
    }
  }
  return rows;
}
