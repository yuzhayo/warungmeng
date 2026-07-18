import type {
  MenuAvailability,
  MenuCategory,
  MenuItem,
  MenuVariantGroup,
  MenuVisibility,
} from "@warungmeng/domain";

export type CreateEntity<TEntity extends { readonly id: string }> = Omit<TEntity, "id">;
export type UpdateEntity<TEntity extends { readonly id: string }> = Partial<Omit<TEntity, "id">>;

export interface MenuListQuery {
  readonly search?: string;
  readonly categoryId?: string;
  readonly visibility?: MenuVisibility;
  readonly availability?: MenuAvailability["status"];
}

export interface MenuRepository {
  listMenus(query?: MenuListQuery): Promise<readonly MenuItem[]>;
  getMenuById(id: string): Promise<MenuItem | null>;
  createMenu(input: CreateEntity<MenuItem>): Promise<MenuItem>;
  updateMenu(id: string, patch: UpdateEntity<MenuItem>): Promise<MenuItem | null>;
  deleteMenu(id: string): Promise<boolean>;
}

export interface MenuCategoryRepository {
  listCategories(): Promise<readonly MenuCategory[]>;
  getCategoryById(id: string): Promise<MenuCategory | null>;
  createCategory(input: CreateEntity<MenuCategory>): Promise<MenuCategory>;
  updateCategory(id: string, patch: UpdateEntity<MenuCategory>): Promise<MenuCategory | null>;
  deleteCategory(id: string): Promise<boolean>;
}

export interface MenuVariantGroupRepository {
  listVariantGroups(): Promise<readonly MenuVariantGroup[]>;
  getVariantGroupById(id: string): Promise<MenuVariantGroup | null>;
  createVariantGroup(input: CreateEntity<MenuVariantGroup>): Promise<MenuVariantGroup>;
  updateVariantGroup(
    id: string,
    patch: UpdateEntity<MenuVariantGroup>,
  ): Promise<MenuVariantGroup | null>;
  deleteVariantGroup(id: string): Promise<boolean>;
}

export interface MenuCatalogRepository
  extends MenuRepository, MenuCategoryRepository, MenuVariantGroupRepository {}
