import type {
  CreateInventoryIngredientInput,
  InventoryRepository,
  UpdateInventoryIngredientInput,
} from "@warungmeng/data";
import type { InventoryIngredientStatus } from "@warungmeng/domain";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface InventoryMaterialFilters {
  readonly search: string;
  readonly status: InventoryIngredientStatus | null;
  readonly outletId: string;
  readonly lowStockOnly: boolean;
}

const DEFAULT_FILTERS: InventoryMaterialFilters = {
  search: "",
  status: "active",
  outletId: "wm-1",
  lowStockOnly: false,
};

export function useInventoryMaterials(repository: InventoryRepository) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [ingredients, setIngredients] = useState<
    Awaited<ReturnType<typeof repository.listIngredients>>
  >([]);
  const [balances, setBalances] = useState<
    Awaited<ReturnType<typeof repository.listStockBalances>>
  >([]);
  const [suppliers, setSuppliers] = useState<Awaited<ReturnType<typeof repository.listSuppliers>>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(
    () =>
      Promise.all([
        repository.listIngredients({
          search: filters.search,
          status: filters.status ?? undefined,
          outletId: filters.outletId,
          lowStockOnly: filters.lowStockOnly,
        }),
        repository.listStockBalances(filters.outletId),
        repository.listSuppliers(),
      ]),
    [filters, repository],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [nextIngredients, nextBalances, nextSuppliers] = await fetchData();
      setIngredients(nextIngredients);
      setBalances(nextBalances);
      setSuppliers(nextSuppliers);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    void fetchData().then(
      ([nextIngredients, nextBalances, nextSuppliers]) => {
        if (cancelled) return;
        setIngredients(nextIngredients);
        setBalances(nextBalances);
        setSuppliers(nextSuppliers);
        setError(false);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  const balanceByIngredientId = useMemo(
    () => new Map(balances.map((balance) => [balance.ingredientId, balance])),
    [balances],
  );

  async function saveIngredient(
    id: string | null,
    input: CreateInventoryIngredientInput,
  ): Promise<void> {
    if (id) {
      const patch: UpdateInventoryIngredientInput = {
        name: input.name,
        baseUnit: input.baseUnit,
        supplierId: input.supplierId,
        status: input.status,
        minimumStock: input.minimumStock,
      };
      await repository.updateIngredient(id, patch);
    } else {
      await repository.createIngredient(input);
    }
    await load();
  }

  async function archiveIngredient(id: string): Promise<void> {
    await repository.archiveIngredient(id);
    await load();
  }

  return {
    filters,
    ingredients,
    suppliers,
    balanceByIngredientId,
    loading,
    error,
    updateFilters: (patch: Partial<InventoryMaterialFilters>) =>
      setFilters((current) => ({ ...current, ...patch })),
    resetFilters: () => setFilters(DEFAULT_FILTERS),
    retry: load,
    saveIngredient,
    archiveIngredient,
  };
}
