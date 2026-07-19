import {
  applyStockDelta,
  calculateMenuHpp,
  calculateMovementBaseDelta,
  convertInventoryQuantity,
  type InventoryIngredient,
  type InventoryMovement,
  type InventoryStockBalance,
  type InventorySupplier,
  type MenuRecipe,
  type Order,
} from "@warungmeng/domain";
import type {
  CreateInventoryIngredientInput,
  CreateInventoryMovementInput,
  InventoryIngredientQuery,
  InventoryMovementQuery,
  InventoryRepository,
  UpdateInventoryIngredientInput,
} from "../repositories/InventoryRepository";

export interface InMemoryInventorySeed {
  readonly ingredients?: readonly InventoryIngredient[];
  readonly suppliers?: readonly InventorySupplier[];
  readonly stockBalances?: readonly InventoryStockBalance[];
  readonly movements?: readonly InventoryMovement[];
  readonly recipes?: readonly MenuRecipe[];
}

export type InventoryEntityKind = "ingredient" | "movement";
export type InventoryIdFactory = (kind: InventoryEntityKind) => string;

function defaultIdFactory(kind: InventoryEntityKind): string {
  return `${kind}-${crypto.randomUUID()}`;
}

function clone<TEntity>(value: TEntity): TEntity {
  return structuredClone(value);
}

export class InMemoryInventoryRepository implements InventoryRepository {
  readonly #idFactory: InventoryIdFactory;
  #ingredients: InventoryIngredient[];
  readonly #suppliers: InventorySupplier[];
  #stockBalances: InventoryStockBalance[];
  #movements: InventoryMovement[];
  #recipes: MenuRecipe[];

  constructor(seed: InMemoryInventorySeed = {}, idFactory: InventoryIdFactory = defaultIdFactory) {
    this.#idFactory = idFactory;
    this.#ingredients = (seed.ingredients ?? []).map((item) => clone(item));
    this.#suppliers = (seed.suppliers ?? []).map((item) => clone(item));
    this.#stockBalances = (seed.stockBalances ?? []).map((item) => clone(item));
    this.#movements = (seed.movements ?? []).map((item) => clone(item));
    this.#recipes = (seed.recipes ?? []).map((item) => clone(item));
  }

  async listIngredients(query: InventoryIngredientQuery = {}) {
    const normalizedSearch = query.search?.trim().toLocaleLowerCase();
    const lowStockIds = query.lowStockOnly
      ? new Set(
          this.#stockBalances
            .filter((balance) => !query.outletId || balance.outletId === query.outletId)
            .filter((balance) => {
              const ingredient = this.#ingredients.find((item) => item.id === balance.ingredientId);
              return ingredient && balance.quantity <= ingredient.minimumStock;
            })
            .map((balance) => balance.ingredientId),
        )
      : null;

    return clone(
      this.#ingredients
        .filter(
          (ingredient) =>
            !normalizedSearch || ingredient.name.toLocaleLowerCase().includes(normalizedSearch),
        )
        .filter((ingredient) => !query.status || ingredient.status === query.status)
        .filter((ingredient) => !lowStockIds || lowStockIds.has(ingredient.id))
        .sort((left, right) => left.name.localeCompare(right.name)),
    );
  }

  async getIngredientById(id: string) {
    const ingredient = this.#ingredients.find((item) => item.id === id);
    return ingredient ? clone(ingredient) : null;
  }

  async createIngredient(input: CreateInventoryIngredientInput) {
    const ingredient: InventoryIngredient = {
      ...clone(input),
      id: this.#idFactory("ingredient"),
    };
    this.#ingredients.push(ingredient);
    return clone(ingredient);
  }

  async updateIngredient(id: string, patch: UpdateInventoryIngredientInput) {
    const index = this.#ingredients.findIndex((ingredient) => ingredient.id === id);
    const current = this.#ingredients[index];
    if (!current) return null;
    const updated: InventoryIngredient = { ...current, ...clone(patch), id };
    this.#ingredients[index] = updated;
    return clone(updated);
  }

  async archiveIngredient(id: string) {
    const index = this.#ingredients.findIndex((ingredient) => ingredient.id === id);
    const current = this.#ingredients[index];
    if (!current) return null;
    const updated: InventoryIngredient = { ...current, status: "archived" };
    this.#ingredients[index] = updated;
    return clone(updated);
  }

  async listSuppliers() {
    return clone([...this.#suppliers].sort((left, right) => left.name.localeCompare(right.name)));
  }

  async listStockBalances(outletId?: string) {
    return clone(
      this.#stockBalances.filter((balance) => !outletId || balance.outletId === outletId),
    );
  }

  async listMovements(query: InventoryMovementQuery = {}) {
    return clone(
      this.#movements
        .filter((movement) => !query.ingredientId || movement.ingredientId === query.ingredientId)
        .filter((movement) => !query.outletId || movement.outletId === query.outletId)
        .filter((movement) => !query.type || movement.type === query.type)
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)),
    );
  }

  async recordMovement(input: CreateInventoryMovementInput) {
    const ingredientIndex = this.#ingredients.findIndex(
      (ingredient) => ingredient.id === input.ingredientId,
    );
    const ingredient = this.#ingredients[ingredientIndex];
    if (!ingredient) throw new RangeError(`Ingredient ${input.ingredientId} was not found`);
    if (ingredient.status !== "active") throw new RangeError("Archived ingredients cannot move");

    const baseQuantityDelta = calculateMovementBaseDelta(ingredient, input);
    let balanceIndex = this.#stockBalances.findIndex(
      (item) => item.ingredientId === input.ingredientId && item.outletId === input.outletId,
    );
    if (balanceIndex === -1) {
      this.#stockBalances.push({
        ingredientId: input.ingredientId,
        outletId: input.outletId,
        quantity: 0,
        updatedAt: input.occurredAt,
      });
      balanceIndex = this.#stockBalances.length - 1;
    }
    const balance = this.#stockBalances[balanceIndex];
    if (!balance) throw new Error("Inventory balance could not be initialized");
    this.#stockBalances[balanceIndex] = {
      ...applyStockDelta(balance, baseQuantityDelta),
      updatedAt: input.occurredAt,
    };

    if (input.type === "purchase" && input.unitCost) {
      const baseUnitsPerPurchaseUnit = convertInventoryQuantity(1, input.unit, ingredient.baseUnit);
      const baseUnitCost = input.unitCost.amount / baseUnitsPerPurchaseUnit;
      const purchasedBaseQuantity = Math.abs(baseQuantityDelta);
      const previousQuantity = Math.max(0, balance.quantity);
      const nextAverage =
        previousQuantity + purchasedBaseQuantity === 0
          ? baseUnitCost
          : (previousQuantity * ingredient.averageUnitCost.amount +
              purchasedBaseQuantity * baseUnitCost) /
            (previousQuantity + purchasedBaseQuantity);
      this.#ingredients[ingredientIndex] = {
        ...ingredient,
        lastPurchaseUnitCost: { amount: baseUnitCost, currency: "IDR" },
        averageUnitCost: { amount: nextAverage, currency: "IDR" },
      };
    }

    const movement: InventoryMovement = {
      ...clone(input),
      id: this.#idFactory("movement"),
      baseQuantityDelta,
    };
    this.#movements.push(movement);
    return clone(movement);
  }

  async listRecipes() {
    return clone(this.#recipes);
  }

  async getRecipeByMenuItemId(menuItemId: string) {
    const recipe = this.#recipes.find((item) => item.menuItemId === menuItemId);
    return recipe ? clone(recipe) : null;
  }

  async saveRecipe(recipe: MenuRecipe) {
    const index = this.#recipes.findIndex((item) => item.menuItemId === recipe.menuItemId);
    if (index === -1) this.#recipes.push(clone(recipe));
    else this.#recipes[index] = clone(recipe);
    return clone(recipe);
  }

  async calculateHpp(menuItemId: string) {
    const recipe = this.#recipes.find((item) => item.menuItemId === menuItemId);
    return recipe ? calculateMenuHpp(recipe, this.#ingredients) : null;
  }

  async consumeOrder(order: Order) {
    const planned: CreateInventoryMovementInput[] = [];
    for (const item of order.items) {
      const recipe = this.#recipes.find((candidate) => candidate.menuItemId === item.menuItemId);
      if (!recipe) continue;
      for (const component of recipe.components) {
        planned.push({
          ingredientId: component.ingredientId,
          outletId: order.outletId,
          type: "consumption",
          quantity: component.quantity * item.quantity * (1 + component.wastePercentage / 100),
          unit: component.unit,
          unitCost: null,
          referenceId: order.id,
          note: `POS ${order.orderNumber}`,
          occurredAt: order.createdAt,
        });
      }
    }

    const projectedBalances = clone(this.#stockBalances);
    for (const movement of planned) {
      const ingredient = this.#ingredients.find((item) => item.id === movement.ingredientId);
      if (!ingredient) throw new RangeError(`Ingredient ${movement.ingredientId} was not found`);
      const index = projectedBalances.findIndex(
        (item) =>
          item.ingredientId === movement.ingredientId && item.outletId === movement.outletId,
      );
      const current = projectedBalances[index] ?? {
        ingredientId: movement.ingredientId,
        outletId: movement.outletId,
        quantity: 0,
        updatedAt: movement.occurredAt,
      };
      const next = applyStockDelta(current, calculateMovementBaseDelta(ingredient, movement));
      if (index === -1) projectedBalances.push(next);
      else projectedBalances[index] = next;
    }

    const recorded: InventoryMovement[] = [];
    for (const movement of planned) recorded.push(await this.recordMovement(movement));
    return recorded;
  }
}
