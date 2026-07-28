import { createWarungMengInventoryRepository } from "@warungmeng/data";

export type InventoryRepositoryInstance = ReturnType<typeof createWarungMengInventoryRepository>;

export function createInventoryRepository(): InventoryRepositoryInstance {
  return createWarungMengInventoryRepository();
}

interface InventoryRepositoryBinding {
  readonly instance: InventoryRepositoryInstance;
  readonly token: symbol;
}

const defaultInstance = createInventoryRepository();
const bindings: InventoryRepositoryBinding[] = [];

function activeInventoryRepository(): InventoryRepositoryInstance {
  return bindings.at(-1)?.instance ?? defaultInstance;
}

/**
 * Compatibility export. Delegates to the newest composition-owned Inventory
 * repository while an Admin runtime is bound, and to a stable default instance
 * when nothing is bound so existing screens/tests keep working.
 */
export const inventoryRepository = new Proxy({} as InventoryRepositoryInstance, {
  get(_target, property) {
    const instance = activeInventoryRepository();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
}) as InventoryRepositoryInstance;

export function bindInventoryRepository(instance: InventoryRepositoryInstance): () => void {
  const token = Symbol("inventory-repository-binding");
  bindings.push({ instance, token });
  let active = true;

  return () => {
    if (!active) return;
    active = false;
    const index = bindings.findIndex((binding) => binding.token === token);
    if (index >= 0) bindings.splice(index, 1);
  };
}
