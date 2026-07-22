import { createWarungMengMockRepository } from "@warungmeng/data";
import type { MenuCatalogRepository } from "@warungmeng/data";

export type StorefrontCatalogRepository = Pick<
  MenuCatalogRepository,
  "listMenus" | "listCategories"
>;

export type StorefrontMenuDetailRepository = Pick<
  MenuCatalogRepository,
  "listMenus" | "listCategories" | "listVariantGroups"
>;

// One shared mock instance keeps catalog and detail reads consistent in-process.
const mockRepository = createWarungMengMockRepository();

export const storefrontCatalogRepository: StorefrontCatalogRepository = mockRepository;

export const storefrontMenuDetailRepository: StorefrontMenuDetailRepository = mockRepository;
