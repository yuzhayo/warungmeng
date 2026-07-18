import type { MenuCatalogRepository } from "@warungmeng/data";

export type DeleteMenuCategoryResult =
  | { readonly status: "deleted" }
  | { readonly status: "in-use"; readonly menuCount: number }
  | { readonly status: "not-found" };

export async function deleteMenuCategoryIfUnused(
  repository: MenuCatalogRepository,
  categoryId: string,
): Promise<DeleteMenuCategoryResult> {
  const menus = await repository.listMenus();
  const menuCount = menus.filter((menu) => menu.categoryId === categoryId).length;

  if (menuCount > 0) {
    return { status: "in-use", menuCount };
  }

  const deleted = await repository.deleteCategory(categoryId);
  return { status: deleted ? "deleted" : "not-found" };
}
