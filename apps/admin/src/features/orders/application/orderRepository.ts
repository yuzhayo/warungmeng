import { createWarungMengOrderRepository } from "@warungmeng/data";

export type OrderRepositoryInstance = ReturnType<typeof createWarungMengOrderRepository>;

export function createOrderRepository(): OrderRepositoryInstance {
  return createWarungMengOrderRepository();
}

interface OrderRepositoryBinding {
  readonly instance: OrderRepositoryInstance;
  readonly token: symbol;
}

const defaultInstance = createOrderRepository();
const bindings: OrderRepositoryBinding[] = [];

function activeOrderRepository(): OrderRepositoryInstance {
  return bindings.at(-1)?.instance ?? defaultInstance;
}

/**
 * Compatibility export. Delegates to the newest composition-owned Order
 * repository while an Admin runtime is bound, and to a stable default instance
 * when nothing is bound so existing screens/tests keep working.
 */
export const orderRepository = new Proxy({} as OrderRepositoryInstance, {
  get(_target, property) {
    const instance = activeOrderRepository();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
}) as OrderRepositoryInstance;

export function bindOrderRepository(instance: OrderRepositoryInstance): () => void {
  const token = Symbol("order-repository-binding");
  bindings.push({ instance, token });
  let active = true;

  return () => {
    if (!active) return;
    active = false;
    const index = bindings.findIndex((binding) => binding.token === token);
    if (index >= 0) bindings.splice(index, 1);
  };
}
