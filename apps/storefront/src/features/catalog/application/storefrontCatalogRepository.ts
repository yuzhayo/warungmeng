import { createWarungMengMockRepository } from "@warungmeng/data";
import type { MenuCatalogRepository } from "@warungmeng/data";

export type StorefrontCatalogRepository = Pick<
  MenuCatalogRepository,
  "listMenus" | "listCategories"
>;

export const storefrontCatalogRepository: StorefrontCatalogRepository =
  createWarungMengMockRepository();
