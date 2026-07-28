import type {
  CreateInventoryIngredientInput,
  UpdateInventoryIngredientInput,
} from "@warungmeng/data";
import type { InventoryIngredientStatus } from "@warungmeng/domain";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { InventoryAdjustCapability, InventoryReadCapability } from "./inventoryCapabilities";

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

export function useInventoryMaterials(
  read: InventoryReadCapability,
  adjust: InventoryAdjustCapability,
) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [ingredients, setIngredients] = useState<Awaited<ReturnType<typeof read.listIngredients>>>(
    [],
  );
  const [balances, setBalances] = useState<Awaited<ReturnType<typeof read.listStockBalances>>>([]);
  const [suppliers, setSuppliers] = useState<Awaited<ReturnType<typeof read.listSuppliers>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(
    () =>
      Promise.all([
        read.listIngredients({
          search: filters.search,
          status: filters.status ?? undefined,
          outletId: filters.outletId,
          lowStockOnly: filters.lowStockOnly,
        }),
        read.listStockBalances(filters.outletId),
        read.listSuppliers(),
      ]),
    [filters, read],
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
      await adjust.updateIngredient(id, patch);
    } else {
      await adjust.createIngredient(input);
    }
    await load();
  }

  async function archiveIngredient(id: string): Promise<void> {
    await adjust.archiveIngredient(id);
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
