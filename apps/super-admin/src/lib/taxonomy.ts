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
  function walk(nodes: Category[], prefix: string) {
    for (const node of nodes) {
      if (!prefix && node.slug.startsWith("_")) continue;
      const name = prefix ? `${prefix} / ${node.name}` : node.name;
      rows.push({ id: node.id, name });
      if (node.children?.length) walk(node.children, name);
    }
  }
  walk(tree, "");
  return rows;
}

export function findCategory(roots: Category[], id?: string): Category | undefined {
  if (!id) return undefined;
  for (const node of roots) {
    if (node.id === id) return node;
    const nested = findCategory(node.children ?? [], id);
    if (nested) return { ...nested, parentId: nested.parentId ?? node.id };
  }
  return undefined;
}
