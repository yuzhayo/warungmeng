import type {
  InventoryIngredient,
  InventoryIngredientStatus,
  InventoryMovement,
  InventoryMovementType,
  InventoryStockBalance,
  InventorySupplier,
  InventoryUnit,
  MenuHppBreakdown,
  MenuRecipe,
  Money,
  Order,
} from "@warungmeng/domain";

export interface InventoryIngredientQuery {
  readonly search?: string;
  readonly status?: InventoryIngredientStatus;
  readonly outletId?: string;
  readonly lowStockOnly?: boolean;
}

export interface InventoryMovementQuery {
  readonly ingredientId?: string;
  readonly outletId?: string;
  readonly type?: InventoryMovementType;
}

export type CreateInventoryIngredientInput = Omit<InventoryIngredient, "id">;
export type UpdateInventoryIngredientInput = Partial<
  Omit<InventoryIngredient, "id" | "lastPurchaseUnitCost" | "averageUnitCost">
>;

export interface CreateInventoryMovementInput {
  readonly ingredientId: string;
  readonly outletId: string;
  readonly type: InventoryMovementType;
  readonly quantity: number;
  readonly unit: InventoryUnit;
  readonly unitCost: Money | null;
  readonly referenceId: string | null;
  readonly note: string;
  readonly occurredAt: string;
}

export interface InventoryRepository {
  listIngredients(query?: InventoryIngredientQuery): Promise<readonly InventoryIngredient[]>;
  getIngredientById(id: string): Promise<InventoryIngredient | null>;
  createIngredient(input: CreateInventoryIngredientInput): Promise<InventoryIngredient>;
  updateIngredient(
    id: string,
    patch: UpdateInventoryIngredientInput,
  ): Promise<InventoryIngredient | null>;
  archiveIngredient(id: string): Promise<InventoryIngredient | null>;
  listSuppliers(): Promise<readonly InventorySupplier[]>;
  listStockBalances(outletId?: string): Promise<readonly InventoryStockBalance[]>;
  listMovements(query?: InventoryMovementQuery): Promise<readonly InventoryMovement[]>;
  recordMovement(input: CreateInventoryMovementInput): Promise<InventoryMovement>;
  listRecipes(): Promise<readonly MenuRecipe[]>;
  getRecipeByMenuItemId(menuItemId: string): Promise<MenuRecipe | null>;
  saveRecipe(recipe: MenuRecipe): Promise<MenuRecipe>;
  calculateHpp(menuItemId: string): Promise<MenuHppBreakdown | null>;
  /** Idempotent by order id: repeated calls never duplicate consumption movements. */
  consumeOrder(order: Order): Promise<readonly InventoryMovement[]>;
  /**
   * Reverses this order's recorded consumption with one adjustment-in per
   * original movement. Idempotent by order id; a no-op when the order never
   * consumed stock.
   */
  revertOrderConsumption(order: Order): Promise<readonly InventoryMovement[]>;
}
