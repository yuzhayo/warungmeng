import type {
  InventoryIngredient,
  InventoryMovement,
  InventoryStockBalance,
  InventorySupplier,
  MenuRecipe,
} from "@warungmeng/domain";
import {
  InMemoryInventoryRepository,
  type InMemoryInventorySeed,
} from "./InMemoryInventoryRepository";

const CREATED_AT = "2026-07-19T08:00:00.000Z";

export const warungMengSuppliers: readonly InventorySupplier[] = [
  { id: "supplier-market", name: "Pasar Pagi Meng", phone: "0812-0000-1001" },
  { id: "supplier-drinks", name: "Distributor Minuman Meng", phone: "0812-0000-1002" },
  { id: "supplier-packaging", name: "Kemasan Bersama", phone: "0812-0000-1003" },
];

export const warungMengIngredients: readonly InventoryIngredient[] = [
  ["ingredient-lontong", "Lontong", "piece", "supplier-market", 20, 2500],
  ["ingredient-kikil", "Kikil sapi", "g", "supplier-market", 2000, 82],
  ["ingredient-tauge", "Tauge", "g", "supplier-market", 1500, 18],
  ["ingredient-kol", "Kol", "g", "supplier-market", 1000, 16],
  ["ingredient-telur", "Telur", "piece", "supplier-market", 24, 2200],
  ["ingredient-kacang", "Kacang tanah", "g", "supplier-market", 1000, 48],
  ["ingredient-kerupuk", "Kerupuk", "piece", "supplier-market", 30, 450],
  ["ingredient-teh", "Teh", "g", "supplier-drinks", 500, 115],
  ["ingredient-gula", "Gula", "g", "supplier-drinks", 3000, 19],
  ["ingredient-es", "Es batu", "g", "supplier-drinks", 5000, 2],
  ["ingredient-cup", "Cup 22 oz", "piece", "supplier-packaging", 50, 720],
].map(([id, name, baseUnit, supplierId, minimumStock, cost]) => ({
  id: id as string,
  name: name as string,
  baseUnit: baseUnit as InventoryIngredient["baseUnit"],
  supplierId: supplierId as string,
  status: "active",
  minimumStock: minimumStock as number,
  lastPurchaseUnitCost: { amount: cost as number, currency: "IDR" },
  averageUnitCost: { amount: cost as number, currency: "IDR" },
}));

const STOCK_WM_1: Record<string, number> = {
  "ingredient-lontong": 38,
  "ingredient-kikil": 8500,
  "ingredient-tauge": 1200,
  "ingredient-kol": 2400,
  "ingredient-telur": 18,
  "ingredient-kacang": 3500,
  "ingredient-kerupuk": 65,
  "ingredient-teh": 1200,
  "ingredient-gula": 8500,
  "ingredient-es": 18_000,
  "ingredient-cup": 120,
};

export const warungMengStockBalances: readonly InventoryStockBalance[] = [
  ...Object.entries(STOCK_WM_1).map(([ingredientId, quantity]) => ({
    ingredientId,
    outletId: "wm-1",
    quantity,
    updatedAt: CREATED_AT,
  })),
  ...Object.entries(STOCK_WM_1).map(([ingredientId, quantity]) => ({
    ingredientId,
    outletId: "wm-2",
    quantity: Math.round(quantity * 0.6),
    updatedAt: CREATED_AT,
  })),
];

export const warungMengRecipes: readonly MenuRecipe[] = [
  {
    menuItemId: "2661748529823232",
    components: [
      ["recipe-gado-lontong", "ingredient-lontong", 1, "piece", 0],
      ["recipe-gado-tauge", "ingredient-tauge", 80, "g", 5],
      ["recipe-gado-kol", "ingredient-kol", 50, "g", 5],
      ["recipe-gado-telur", "ingredient-telur", 1, "piece", 0],
      ["recipe-gado-kacang", "ingredient-kacang", 45, "g", 3],
      ["recipe-gado-kerupuk", "ingredient-kerupuk", 2, "piece", 0],
    ].map(([id, ingredientId, quantity, unit, wastePercentage]) => ({
      id: id as string,
      ingredientId: ingredientId as string,
      quantity: quantity as number,
      unit: unit as MenuRecipe["components"][number]["unit"],
      wastePercentage: wastePercentage as number,
    })),
    packagingCost: { amount: 700, currency: "IDR" },
    additionalCost: { amount: 1000, currency: "IDR" },
    updatedAt: CREATED_AT,
  },
  {
    menuItemId: "2661748526267392",
    components: [
      {
        id: "recipe-kikil-lontong",
        ingredientId: "ingredient-lontong",
        quantity: 1,
        unit: "piece",
        wastePercentage: 0,
      },
      {
        id: "recipe-kikil-meat",
        ingredientId: "ingredient-kikil",
        quantity: 90,
        unit: "g",
        wastePercentage: 5,
      },
      {
        id: "recipe-kikil-tauge",
        ingredientId: "ingredient-tauge",
        quantity: 40,
        unit: "g",
        wastePercentage: 5,
      },
    ],
    packagingCost: { amount: 700, currency: "IDR" },
    additionalCost: { amount: 1500, currency: "IDR" },
    updatedAt: CREATED_AT,
  },
  {
    menuItemId: "3076562510181376",
    components: [
      {
        id: "recipe-balap-lontong",
        ingredientId: "ingredient-lontong",
        quantity: 1,
        unit: "piece",
        wastePercentage: 0,
      },
      {
        id: "recipe-balap-tauge",
        ingredientId: "ingredient-tauge",
        quantity: 100,
        unit: "g",
        wastePercentage: 5,
      },
      {
        id: "recipe-balap-kerupuk",
        ingredientId: "ingredient-kerupuk",
        quantity: 2,
        unit: "piece",
        wastePercentage: 0,
      },
    ],
    packagingCost: { amount: 700, currency: "IDR" },
    additionalCost: { amount: 900, currency: "IDR" },
    updatedAt: CREATED_AT,
  },
  {
    menuItemId: "2665311315655680",
    components: [
      {
        id: "recipe-tea",
        ingredientId: "ingredient-teh",
        quantity: 8,
        unit: "g",
        wastePercentage: 2,
      },
      {
        id: "recipe-sugar",
        ingredientId: "ingredient-gula",
        quantity: 35,
        unit: "g",
        wastePercentage: 0,
      },
      {
        id: "recipe-ice",
        ingredientId: "ingredient-es",
        quantity: 250,
        unit: "g",
        wastePercentage: 5,
      },
      {
        id: "recipe-cup",
        ingredientId: "ingredient-cup",
        quantity: 1,
        unit: "piece",
        wastePercentage: 0,
      },
    ],
    packagingCost: { amount: 0, currency: "IDR" },
    additionalCost: { amount: 300, currency: "IDR" },
    updatedAt: CREATED_AT,
  },
];

export const warungMengInventoryMovements: readonly InventoryMovement[] = [
  {
    id: "movement-opening-tea",
    ingredientId: "ingredient-teh",
    outletId: "wm-1",
    type: "purchase",
    quantity: 1.2,
    unit: "kg",
    baseQuantityDelta: 1200,
    unitCost: { amount: 115_000, currency: "IDR" },
    referenceId: "opening-stock",
    note: "Saldo awal mock inventory",
    occurredAt: CREATED_AT,
  },
];

export function createWarungMengInventorySeed(): InMemoryInventorySeed {
  return {
    ingredients: warungMengIngredients,
    suppliers: warungMengSuppliers,
    stockBalances: warungMengStockBalances,
    movements: warungMengInventoryMovements,
    recipes: warungMengRecipes,
  };
}

export function createWarungMengInventoryRepository(): InMemoryInventoryRepository {
  return new InMemoryInventoryRepository(createWarungMengInventorySeed());
}
