import { createWarungMengMockRepository } from "@warungmeng/data";

export type MenuCatalogRepositoryInstance = ReturnType<typeof createWarungMengMockRepository>;

export function createMenuCatalogRepository(): MenuCatalogRepositoryInstance {
  return createWarungMengMockRepository();
}

interface MenuCatalogRepositoryBinding {
  readonly instance: MenuCatalogRepositoryInstance;
  readonly token: symbol;
}

const defaultInstance = createMenuCatalogRepository();
const bindings: MenuCatalogRepositoryBinding[] = [];

function activeMenuCatalogRepository(): MenuCatalogRepositoryInstance {
  return bindings.at(-1)?.instance ?? defaultInstance;
}

/**
 * Compatibility export. Delegates to the newest composition-owned menu catalog
 * repository while an Admin runtime is bound, and to a stable default instance
 * when nothing is bound so existing screens/tests keep working.
 */
export const menuCatalogRepository = new Proxy({} as MenuCatalogRepositoryInstance, {
  get(_target, property) {
    const instance = activeMenuCatalogRepository();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
}) as MenuCatalogRepositoryInstance;

export function bindMenuCatalogRepository(instance: MenuCatalogRepositoryInstance): () => void {
  const token = Symbol("menu-catalog-repository-binding");
  bindings.push({ instance, token });
  let active = true;

  return () => {
    if (!active) return;
    active = false;
    const index = bindings.findIndex((binding) => binding.token === token);
    if (index >= 0) bindings.splice(index, 1);
  };
}
