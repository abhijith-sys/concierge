import type { Category } from "./api";

export function locateInTree(tree: Category[], id?: string | null) {
  if (!id) return { main: undefined as Category | undefined, sub: undefined as Category | undefined };
  for (const main of tree) {
    if (main.id === id) return { main, sub: undefined };
    const sub = main.children?.find((child) => child.id === id);
    if (sub) return { main, sub };
  }
  return { main: undefined, sub: undefined };
}

export function assignedCategoryId(mainId: string, subId: string, tree: Category[]) {
  if (subId) return subId;
  const main = tree.find((category) => category.id === mainId);
  if (!main) return "";
  if (main.children?.length) return "";
  return main.id;
}

export function childrenOf(tree: Category[], mainId: string) {
  return tree.find((category) => category.id === mainId)?.children ?? [];
}

export function popularSubcategories(tree: Category[], limit = 5) {
  const children = tree.flatMap((main, mainIndex) =>
    (main.children ?? []).map((child, childIndex) => ({
      child,
      score: child._count?.listings ?? child._count?.services ?? 0,
      order: mainIndex * 100 + childIndex,
    })),
  );
  if (!children.length) return tree.slice(0, limit);
  return children
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((entry) => entry.child);
}
