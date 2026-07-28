import { createWarungMengFinanceRepository } from "@warungmeng/data";
import { orderRepository } from "../../orders/application/orderRepository";

export const ACTIVE_FINANCE_OUTLET_ID = "wm-1";

export type FinanceRepositoryInstance = ReturnType<typeof createWarungMengFinanceRepository>;

export function createFinanceRepository(): FinanceRepositoryInstance {
  return createWarungMengFinanceRepository();
}

interface FinanceRepositoryBinding {
  readonly instance: FinanceRepositoryInstance;
  readonly token: symbol;
}

const defaultInstance = createFinanceRepository();
const bindings: FinanceRepositoryBinding[] = [];

function activeFinanceRepository(): FinanceRepositoryInstance {
  return bindings.at(-1)?.instance ?? defaultInstance;
}

/**
 * Compatibility export. Delegates to the newest composition-owned Finance
 * repository while an Admin runtime is bound, and to a stable default instance
 * when nothing is bound so existing screens/tests keep working.
 */
export const financeRepository = new Proxy({} as FinanceRepositoryInstance, {
  get(_target, property) {
    const instance = activeFinanceRepository();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
}) as FinanceRepositoryInstance;

export function bindFinanceRepository(instance: FinanceRepositoryInstance): () => void {
  const token = Symbol("finance-repository-binding");
  bindings.push({ instance, token });
  let active = true;

  return () => {
    if (!active) return;
    active = false;
    const index = bindings.findIndex((binding) => binding.token === token);
    if (index >= 0) bindings.splice(index, 1);
  };
}

/**
 * Finance reads order-derived data through the same Order repository the Admin
 * composition root owns. The Order compatibility proxy already resolves to the
 * bound instance, so sharing its reference keeps finance and orders aligned.
 */
export const financeOrderRepository = orderRepository;
