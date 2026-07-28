import type { AtomicDataTransaction } from "../repositories/AtomicDataTransaction";
import { InMemoryAtomicDataTransaction } from "../mocks/InMemoryAtomicDataTransaction";
import type { InMemoryFinanceRepository } from "../mocks/InMemoryFinanceRepository";
import type { InMemoryInventoryRepository } from "../mocks/InMemoryInventoryRepository";
import type { InMemoryMenuCatalogRepository } from "../mocks/InMemoryMenuCatalogRepository";
import type { InMemoryOrderRepository } from "../mocks/InMemoryOrderRepository";
import { createWarungMengFinanceRepository } from "../mocks/WarungMengFinanceMockData";
import { createWarungMengInventoryRepository } from "../mocks/WarungMengInventoryMockData";
import { createWarungMengMockRepository } from "../mocks/WarungMengMockData";
import { createWarungMengOrderRepository } from "../mocks/WarungMengOrderMockData";

export interface WarungMengOperationalDataRuntime {
  readonly orders: InMemoryOrderRepository;
  readonly inventory: InMemoryInventoryRepository;
  readonly finance: InMemoryFinanceRepository;
  readonly menuCatalog: InMemoryMenuCatalogRepository;
  readonly atomicTransaction: AtomicDataTransaction;
}

/**
 * One operational data runtime per application runtime: fresh repository
 * instances plus the single atomic transaction that owns the exact Order and
 * Inventory resources. Consumers must not construct a second transaction over
 * the same repositories — rollback only covers resources this runtime owns.
 */
export function createWarungMengOperationalDataRuntime(): WarungMengOperationalDataRuntime {
  const orders = createWarungMengOrderRepository();
  const inventory = createWarungMengInventoryRepository();
  const finance = createWarungMengFinanceRepository();
  const menuCatalog = createWarungMengMockRepository();

  return {
    orders,
    inventory,
    finance,
    menuCatalog,
    atomicTransaction: new InMemoryAtomicDataTransaction({ orders, inventory }),
  };
}
