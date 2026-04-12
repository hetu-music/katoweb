import type { ImageryCategory } from "@/lib/types";
import type { CategoryNode } from "./types";

export function buildTree(categories: ImageryCategory[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  categories.forEach((category) => {
    map.set(category.id, { ...category, children: [] });
  });

  const roots: CategoryNode[] = [];
  map.forEach((node) => {
    if (node.parent_id) {
      const parent = map.get(node.parent_id);
      if (parent) {
        parent.children.push(node);
        return;
      }
    }
    roots.push(node);
  });

  return roots;
}

export function getCategoryPath(
  categoryId: number,
  categories: ImageryCategory[],
): string {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return `分类 #${categoryId}`;

  const parts = [category.name];
  let currentParentId = category.parent_id;

  while (currentParentId) {
    const parent = categories.find((item) => item.id === currentParentId);
    if (!parent) break;
    parts.unshift(parent.name);
    currentParentId = parent.parent_id;
  }

  return parts.join(" / ");
}
