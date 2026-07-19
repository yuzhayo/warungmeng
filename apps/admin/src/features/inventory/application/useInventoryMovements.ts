import type { CreateInventoryMovementInput, InventoryRepository } from "@warungmeng/data";
import type { InventoryMovementType } from "@warungmeng/domain";
import { useCallback, useEffect, useState } from "react";

export interface InventoryMovementFilters {
  readonly outletId: string;
  readonly ingredientId: string | null;
  readonly type: InventoryMovementType | null;
}

const DEFAULT_FILTERS: InventoryMovementFilters = {
  outletId: "wm-1",
  ingredientId: null,
  type: null,
};

export function useInventoryMovements(repository: InventoryRepository) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [movements, setMovements] = useState<Awaited<ReturnType<typeof repository.listMovements>>>(
    [],
  );
  const [ingredients, setIngredients] = useState<
    Awaited<ReturnType<typeof repository.listIngredients>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(
    () =>
      Promise.all([
        repository.listMovements({
          outletId: filters.outletId,
          ingredientId: filters.ingredientId ?? undefined,
          type: filters.type ?? undefined,
        }),
        repository.listIngredients({ status: "active" }),
      ]),
    [filters, repository],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [nextMovements, nextIngredients] = await fetchData();
      setMovements(nextMovements);
      setIngredients(nextIngredients);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    void fetchData().then(
      ([nextMovements, nextIngredients]) => {
        if (cancelled) return;
        setMovements(nextMovements);
        setIngredients(nextIngredients);
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

  async function recordMovement(input: CreateInventoryMovementInput): Promise<void> {
    await repository.recordMovement(input);
    await load();
  }

  return {
    filters,
    movements,
    ingredients,
    loading,
    error,
    updateFilters: (patch: Partial<InventoryMovementFilters>) =>
      setFilters((current) => ({ ...current, ...patch })),
    resetFilters: () => setFilters(DEFAULT_FILTERS),
    retry: load,
    recordMovement,
  };
}
