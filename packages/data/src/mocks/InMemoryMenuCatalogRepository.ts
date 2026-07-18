import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import type {
  CreateEntity,
  MenuCatalogRepository,
  MenuListQuery,
  UpdateEntity,
} from "../repositories/MenuCatalogRepository";

export type CatalogEntityKind = "menu" | "category" | "variant-group";
export type CatalogIdFactory = (kind: CatalogEntityKind) => string;

export interface InMemoryMenuCatalogSeed {
  readonly menus?: readonly MenuItem[];
  readonly categories?: readonly MenuCategory[];
  readonly variantGroups?: readonly MenuVariantGroup[];
}

function defaultIdFactory(kind: CatalogEntityKind): string {
  return `${kind}-${crypto.randomUUID()}`;
}

function clone<TEntity>(value: TEntity): TEntity {
  return structuredClone(value);
}

function bySortOrderThenName<TEntity extends { sortOrder: number; name: string }>(
  left: TEntity,
  right: TEntity,
): number {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
}

export class InMemoryMenuCatalogRepository implements MenuCatalogRepository {
  readonly #idFactory: CatalogIdFactory;
  #menus: MenuItem[];
  #categories: MenuCategory[];
  #variantGroups: MenuVariantGroup[];

  constructor(seed: InMemoryMenuCatalogSeed = {}, idFactory: CatalogIdFactory = defaultIdFactory) {
    this.#idFactory = idFactory;
    this.#menus = (seed.menus ?? []).map((menu) => clone(menu));
    this.#categories = (seed.categories ?? []).map((category) => clone(category));
    this.#variantGroups = (seed.variantGroups ?? []).map((group) => clone(group));
  }

  async listMenus(query: MenuListQuery = {}): Promise<readonly MenuItem[]> {
    const normalizedSearch = query.search?.trim().toLocaleLowerCase();
    const menus = this.#menus
      .filter(
        (menu) =>
          !normalizedSearch ||
          menu.name.toLocaleLowerCase().includes(normalizedSearch) ||
          menu.description.toLocaleLowerCase().includes(normalizedSearch),
      )
      .filter((menu) => !query.categoryId || menu.categoryId === query.categoryId)
      .filter((menu) => !query.visibility || menu.visibility === query.visibility)
      .filter((menu) => !query.availability || menu.availability.status === query.availability)
      .sort(bySortOrderThenName);

    return clone(menus);
  }

  async getMenuById(id: string): Promise<MenuItem | null> {
    const menu = this.#menus.find((item) => item.id === id);
    return menu ? clone(menu) : null;
  }

  async createMenu(input: CreateEntity<MenuItem>): Promise<MenuItem> {
    const menu: MenuItem = { ...clone(input), id: this.#idFactory("menu") };
    this.#menus.push(menu);
    return clone(menu);
  }

  async updateMenu(id: string, patch: UpdateEntity<MenuItem>): Promise<MenuItem | null> {
    const index = this.#menus.findIndex((menu) => menu.id === id);
    const current = this.#menus[index];
    if (index === -1 || !current) return null;

    const updated: MenuItem = { ...current, ...clone(patch), id };
    this.#menus[index] = updated;
    return clone(updated);
  }

  async deleteMenu(id: string): Promise<boolean> {
    const initialLength = this.#menus.length;
    this.#menus = this.#menus.filter((menu) => menu.id !== id);
    return this.#menus.length !== initialLength;
  }

  async listCategories(): Promise<readonly MenuCategory[]> {
    return clone([...this.#categories].sort(bySortOrderThenName));
  }

  async getCategoryById(id: string): Promise<MenuCategory | null> {
    const category = this.#categories.find((item) => item.id === id);
    return category ? clone(category) : null;
  }

  async createCategory(input: CreateEntity<MenuCategory>): Promise<MenuCategory> {
    const category: MenuCategory = {
      ...clone(input),
      id: this.#idFactory("category"),
    };
    this.#categories.push(category);
    return clone(category);
  }

  async updateCategory(
    id: string,
    patch: UpdateEntity<MenuCategory>,
  ): Promise<MenuCategory | null> {
    const index = this.#categories.findIndex((category) => category.id === id);
    const current = this.#categories[index];
    if (index === -1 || !current) return null;

    const updated: MenuCategory = { ...current, ...clone(patch), id };
    this.#categories[index] = updated;
    return clone(updated);
  }

  async deleteCategory(id: string): Promise<boolean> {
    const initialLength = this.#categories.length;
    this.#categories = this.#categories.filter((category) => category.id !== id);
    return this.#categories.length !== initialLength;
  }

  async listVariantGroups(): Promise<readonly MenuVariantGroup[]> {
    return clone([...this.#variantGroups].sort(bySortOrderThenName));
  }

  async getVariantGroupById(id: string): Promise<MenuVariantGroup | null> {
    const group = this.#variantGroups.find((item) => item.id === id);
    return group ? clone(group) : null;
  }

  async createVariantGroup(input: CreateEntity<MenuVariantGroup>): Promise<MenuVariantGroup> {
    const group: MenuVariantGroup = {
      ...clone(input),
      id: this.#idFactory("variant-group"),
    };
    this.#variantGroups.push(group);
    return clone(group);
  }

  async updateVariantGroup(
    id: string,
    patch: UpdateEntity<MenuVariantGroup>,
  ): Promise<MenuVariantGroup | null> {
    const index = this.#variantGroups.findIndex((group) => group.id === id);
    const current = this.#variantGroups[index];
    if (index === -1 || !current) return null;

    const updated: MenuVariantGroup = { ...current, ...clone(patch), id };
    this.#variantGroups[index] = updated;
    return clone(updated);
  }

  async deleteVariantGroup(id: string): Promise<boolean> {
    const initialLength = this.#variantGroups.length;
    this.#variantGroups = this.#variantGroups.filter((group) => group.id !== id);
    return this.#variantGroups.length !== initialLength;
  }
}
