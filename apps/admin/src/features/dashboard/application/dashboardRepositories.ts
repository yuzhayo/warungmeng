import type { DashboardRepositoriesPort } from "./ports/dashboardRepositoriesPort";

interface DashboardRepositoryBinding {
  readonly repositories: DashboardRepositoriesPort;
  readonly token: symbol;
}

const bindings: DashboardRepositoryBinding[] = [];

function getDashboardRepositories(): DashboardRepositoriesPort {
  const binding = bindings.at(-1);
  if (!binding) {
    throw new Error("Dashboard repositories are not bound to an active Admin runtime.");
  }
  return binding.repositories;
}

/** Stable compatibility adapter configured by the Admin composition root. */
export const dashboardRepositories: DashboardRepositoriesPort = {
  get orders() {
    return getDashboardRepositories().orders;
  },
  get finance() {
    return getDashboardRepositories().finance;
  },
  get inventory() {
    return getDashboardRepositories().inventory;
  },
  get catalog() {
    return getDashboardRepositories().catalog;
  },
};

export function bindDashboardRepositories(repositories: DashboardRepositoriesPort): () => void {
  const token = Symbol("dashboard-repositories-binding");
  bindings.push({ repositories, token });
  let active = true;

  return () => {
    if (!active) return;
    active = false;
    const index = bindings.findIndex((binding) => binding.token === token);
    if (index >= 0) bindings.splice(index, 1);
  };
}

export function bindUnavailableDashboardRepositories(message: string): () => void {
  async function unavailable(): Promise<never> {
    throw new Error(message);
  }

  return bindDashboardRepositories({
    orders: { listOrders: unavailable },
    finance: { listManualTransactions: unavailable },
    inventory: {
      listIngredients: unavailable,
      listStockBalances: unavailable,
      listMovements: unavailable,
      listRecipes: unavailable,
      calculateHpp: unavailable,
    },
    catalog: {
      listMenus: unavailable,
      listCategories: unavailable,
    },
  });
}
