import type { Category } from "./api";

export function walkCategories(tree: Category[], visit: (category: Category, path: Category[]) => void) {
  function walk(nodes: Category[], path: Category[]) {
    for (const node of nodes) {
      const next = [...path, node];
      visit(node, next);
      if (node.children?.length) walk(node.children, next);
    }
  }
  walk(tree, []);
}

export function locateInTree(tree: Category[], id?: string | null) {
  if (!id) return { main: undefined as Category | undefined, sub: undefined as Category | undefined };
  let found: Category[] | undefined;
  walkCategories(tree, (_category, path) => {
    if (path[path.length - 1]?.id === id) found = path;
  });
  if (!found?.length) return { main: undefined, sub: undefined };
  return { main: found[0], sub: found.length > 1 ? found[found.length - 1] : undefined };
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

export function flattenDescendants(category: Category): Array<{ category: Category; label: string }> {
  const rows: Array<{ category: Category; label: string }> = [];
  function walk(nodes: Category[], prefix: string) {
    for (const node of nodes) {
      const label = prefix ? `${prefix} / ${node.name}` : node.name;
      rows.push({ category: node, label });
      if (node.children?.length) walk(node.children, label);
    }
  }
  walk(category.children ?? [], "");
  return rows;
}

export function popularSubcategories(tree: Category[], limit = 5) {
  const children: Array<{ child: Category; score: number; order: number }> = [];
  tree.forEach((main, mainIndex) => {
    flattenDescendants(main).forEach((entry, childIndex) => {
      const supplierBoost = entry.category.kind === "service" ? 0 : 1000;
      children.push({
        child: entry.category,
        score: supplierBoost + (entry.category._count?.listings ?? entry.category._count?.services ?? 0),
        order: mainIndex * 100 + childIndex,
      });
    });
  });
  if (!children.length) return tree.slice(0, limit);
  return children
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((entry) => entry.child);
}
