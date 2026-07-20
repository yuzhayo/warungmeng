import type { Money } from "../catalog/types";
import type { FinanceTransaction } from "../finance/types";
import { getReportingHour, isTimestampInReportingPeriod } from "./dashboard";
import type {
  CategoryPerformanceRow,
  InventoryUsageRow,
  MenuPerformanceRow,
  PeakSalesHourRow,
  ReportingSnapshot,
} from "./types";

function money(amount: number): Money {
  return { amount, currency: "IDR" };
}

function marginPercentage(netSales: number, grossProfit: number): number {
  return netSales > 0 ? Math.round((grossProfit / netSales) * 10_000) / 100 : 0;
}

function periodOrderTransactions(snapshot: ReportingSnapshot): readonly FinanceTransaction[] {
  return snapshot.financeTransactions.filter(
    (transaction) =>
      transaction.status === "posted" &&
      transaction.sourceReference !== null &&
      (transaction.type === "sale" || transaction.type === "refund") &&
      isTimestampInReportingPeriod(transaction.occurredAt, snapshot.period),
  );
}

export function buildMenuPerformance(snapshot: ReportingSnapshot): readonly MenuPerformanceRow[] {
  const orderById = new Map(snapshot.orders.map((order) => [order.id, order]));
  const menuById = new Map(snapshot.menuItems.map((menu) => [menu.id, menu]));
  const categoryById = new Map(snapshot.categories.map((category) => [category.id, category]));
  const hppByMenuId = new Map(snapshot.menuHpp.map((item) => [item.menuItemId, item.total.amount]));
  const groups = new Map<
    string,
    {
      name: string;
      categoryId: string | null;
      categoryName: string | null;
      quantity: number;
      netSales: number;
      cogs: number;
      missingCost: boolean;
    }
  >();

  periodOrderTransactions(snapshot).forEach((transaction) => {
    const order = orderById.get(transaction.sourceReference ?? "");
    if (!order) return;
    const factor = transaction.type === "refund" ? -1 : 1;
    order.items.forEach((item) => {
      const menu = menuById.get(item.menuItemId);
      const category = menu ? categoryById.get(menu.categoryId) : undefined;
      const current = groups.get(item.menuItemId) ?? {
        name: menu?.name ?? item.name,
        categoryId: category?.id ?? null,
        categoryName: category?.name ?? null,
        quantity: 0,
        netSales: 0,
        cogs: 0,
        missingCost: false,
      };
      current.quantity += item.quantity * factor;
      current.netSales += item.lineTotal.amount * factor;
      const hpp = hppByMenuId.get(item.menuItemId);
      if (hpp === undefined) current.missingCost = true;
      else current.cogs += hpp * item.quantity * factor;
      groups.set(item.menuItemId, current);
    });
  });

  return Array.from(groups, ([menuItemId, group]) => {
    const grossProfit = group.netSales - group.cogs;
    return {
      menuItemId,
      menuName: group.name,
      categoryId: group.categoryId,
      categoryName: group.categoryName,
      quantitySold: group.quantity,
      netSales: money(group.netSales),
      estimatedCogs: money(group.cogs),
      estimatedGrossProfit: money(grossProfit),
      estimatedGrossMarginPercentage: marginPercentage(group.netSales, grossProfit),
      missingCost: group.missingCost,
    };
  }).sort(
    (left, right) =>
      right.quantitySold - left.quantitySold ||
      right.netSales.amount - left.netSales.amount ||
      left.menuName.localeCompare(right.menuName) ||
      left.menuItemId.localeCompare(right.menuItemId),
  );
}

export function buildCategoryPerformance(
  snapshot: ReportingSnapshot,
): readonly CategoryPerformanceRow[] {
  const groups = new Map<
    string,
    {
      categoryId: string | null;
      name: string | null;
      quantity: number;
      netSales: number;
      cogs: number;
      missingCostCount: number;
    }
  >();
  buildMenuPerformance(snapshot).forEach((menu) => {
    const key = menu.categoryId ?? "__unknown__";
    const current = groups.get(key) ?? {
      categoryId: menu.categoryId,
      name: menu.categoryName,
      quantity: 0,
      netSales: 0,
      cogs: 0,
      missingCostCount: 0,
    };
    current.quantity += menu.quantitySold;
    current.netSales += menu.netSales.amount;
    current.cogs += menu.estimatedCogs.amount;
    if (menu.missingCost) current.missingCostCount += 1;
    groups.set(key, current);
  });

  return Array.from(groups.values(), (group) => {
    const grossProfit = group.netSales - group.cogs;
    return {
      categoryId: group.categoryId,
      categoryName: group.name,
      quantitySold: group.quantity,
      netSales: money(group.netSales),
      estimatedCogs: money(group.cogs),
      estimatedGrossProfit: money(grossProfit),
      estimatedGrossMarginPercentage: marginPercentage(group.netSales, grossProfit),
      missingCostItemCount: group.missingCostCount,
    };
  }).sort(
    (left, right) =>
      right.netSales.amount - left.netSales.amount ||
      (left.categoryName ?? "").localeCompare(right.categoryName ?? "") ||
      (left.categoryId ?? "").localeCompare(right.categoryId ?? ""),
  );
}

export function buildPeakSalesHours(snapshot: ReportingSnapshot): readonly PeakSalesHourRow[] {
  const groups = new Map<number, { total: number; orderIds: Set<string> }>();
  periodOrderTransactions(snapshot).forEach((transaction) => {
    if (transaction.type !== "sale" || transaction.direction !== "inflow") return;
    const hour = getReportingHour(transaction.occurredAt, snapshot.period.timeZone);
    if (hour === null) return;
    const current = groups.get(hour) ?? { total: 0, orderIds: new Set() };
    current.total += transaction.amount.amount;
    current.orderIds.add(transaction.sourceReference ?? transaction.id);
    groups.set(hour, current);
  });

  return Array.from(groups, ([hour, group]) => ({
    hour,
    paidOrderCount: group.orderIds.size,
    grossSales: money(group.total),
  })).sort(
    (left, right) =>
      right.paidOrderCount - left.paidOrderCount ||
      right.grossSales.amount - left.grossSales.amount ||
      left.hour - right.hour,
  );
}

export function buildInventoryUsage(snapshot: ReportingSnapshot): readonly InventoryUsageRow[] {
  const ingredientById = new Map(
    snapshot.ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );
  const currentStock = new Map<string, number>();
  snapshot.stockBalances.forEach((balance) => {
    currentStock.set(
      balance.ingredientId,
      (currentStock.get(balance.ingredientId) ?? 0) + balance.quantity,
    );
  });
  const usage = new Map<string, number>();
  snapshot.inventoryMovements.forEach((movement) => {
    if (
      movement.type !== "consumption" ||
      !isTimestampInReportingPeriod(movement.occurredAt, snapshot.period)
    ) {
      return;
    }
    usage.set(
      movement.ingredientId,
      (usage.get(movement.ingredientId) ?? 0) + Math.abs(movement.baseQuantityDelta),
    );
  });

  return Array.from(usage, ([ingredientId, quantityUsed]) => {
    const ingredient = ingredientById.get(ingredientId);
    if (!ingredient) return null;
    const stock = currentStock.get(ingredientId) ?? 0;
    return {
      ingredientId,
      ingredientName: ingredient.name,
      unit: ingredient.baseUnit,
      quantityUsed,
      estimatedUsageValue: money(quantityUsed * ingredient.averageUnitCost.amount),
      currentStock: stock,
      minimumStock: ingredient.minimumStock,
      lowStock: ingredient.status === "active" && stock <= ingredient.minimumStock,
    };
  })
    .filter((row): row is InventoryUsageRow => row !== null)
    .sort(
      (left, right) =>
        right.quantityUsed - left.quantityUsed ||
        left.ingredientName.localeCompare(right.ingredientName) ||
        left.ingredientId.localeCompare(right.ingredientId),
    );
}
