import type { InventoryRepository, MenuCatalogRepository } from "@warungmeng/data";
import {
  calculateGrossMarginPercentage,
  calculateRecommendedSellingPrice,
  type MenuHppBreakdown,
  type MenuRecipe,
} from "@warungmeng/domain";
import { useCallback, useEffect, useState } from "react";

export interface InventoryHppRow {
  readonly menu: Awaited<ReturnType<MenuCatalogRepository["listMenus"]>>[number];
  readonly recipe: MenuRecipe | null;
  readonly hpp: MenuHppBreakdown | null;
  readonly marginPercentage: number | null;
  readonly recommendedPrice: number | null;
}

export function useInventoryHpp(
  repository: InventoryRepository,
  catalogRepository: MenuCatalogRepository,
) {
  const [rows, setRows] = useState<readonly InventoryHppRow[]>([]);
  const [ingredients, setIngredients] = useState<
    Awaited<ReturnType<typeof repository.listIngredients>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    const [menus, recipes, nextIngredients] = await Promise.all([
      catalogRepository.listMenus(),
      repository.listRecipes(),
      repository.listIngredients({ status: "active" }),
    ]);
    const recipeByMenuId = new Map(recipes.map((recipe) => [recipe.menuItemId, recipe]));
    const nextRows = await Promise.all(
      menus.map(async (menu) => {
        const recipe = recipeByMenuId.get(menu.id) ?? null;
        const hpp = recipe ? await repository.calculateHpp(menu.id) : null;
        return {
          menu,
          recipe,
          hpp,
          marginPercentage: hpp
            ? calculateGrossMarginPercentage(menu.price.amount, hpp.total.amount)
            : null,
          recommendedPrice: hpp ? calculateRecommendedSellingPrice(hpp.total.amount) : null,
        };
      }),
    );
    return { rows: nextRows, ingredients: nextIngredients };
  }, [catalogRepository, repository]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const next = await fetchData();
      setRows(next.rows);
      setIngredients(next.ingredients);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    void fetchData().then(
      (next) => {
        if (cancelled) return;
        setRows(next.rows);
        setIngredients(next.ingredients);
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

  async function saveRecipe(recipe: MenuRecipe): Promise<void> {
    await repository.saveRecipe(recipe);
    await load();
  }

  return { rows, ingredients, loading, error, retry: load, saveRecipe };
}
