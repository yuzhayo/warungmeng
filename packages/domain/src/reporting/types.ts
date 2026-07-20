import type { Money, MenuCategory, MenuItem } from "../catalog/types";
import type { FinancePaymentMethod, FinanceTransaction } from "../finance/types";
import type {
  InventoryIngredient,
  InventoryMovement,
  InventoryStockBalance,
  InventoryUnit,
  MenuHppBreakdown,
} from "../inventory/types";
import type { Order, OrderChannel } from "../orders/types";

export const DEFAULT_REPORTING_TIME_ZONE = "Asia/Jakarta";

export interface ReportingPeriod {
  readonly startDate: string;
  readonly endDate: string;
  readonly timeZone: string;
}

export interface ReportingSnapshot {
  readonly period: ReportingPeriod;
  readonly orders: readonly Order[];
  readonly financeTransactions: readonly FinanceTransaction[];
  readonly menuItems: readonly MenuItem[];
  readonly categories: readonly MenuCategory[];
  readonly menuHpp: readonly MenuHppBreakdown[];
  readonly ingredients: readonly InventoryIngredient[];
  readonly stockBalances: readonly InventoryStockBalance[];
  readonly inventoryMovements: readonly InventoryMovement[];
}

export interface DashboardSummary {
  readonly grossSales: Money;
  readonly refunds: Money;
  readonly netRevenue: Money;
  readonly expenses: Money;
  readonly netCashflow: Money;
  readonly paidOrderCount: number;
  readonly averageOrderValue: Money;
  readonly cancellationRate: number;
  readonly estimatedCogs: Money;
  readonly estimatedGrossProfit: Money;
  readonly estimatedGrossMarginPercentage: number;
  readonly missingCostItemCount: number;
  readonly lowStockIngredientCount: number;
}

export interface DailySalesTrendPoint {
  readonly date: string;
  readonly grossSales: Money;
  readonly refunds: Money;
  readonly netRevenue: Money;
  readonly paidOrderCount: number;
}

export interface PaymentMethodBreakdownItem {
  readonly paymentMethod: FinancePaymentMethod;
  readonly totalInflow: Money;
  readonly totalOutflow: Money;
  readonly netCashflow: Money;
  readonly transactionCount: number;
}

export interface OrderChannelBreakdownItem {
  readonly channel: OrderChannel;
  readonly paidOrderCount: number;
  readonly grossSales: Money;
  readonly refunds: Money;
  readonly netRevenue: Money;
}

export interface LowStockIngredientItem {
  readonly ingredientId: string;
  readonly ingredientName: string;
  readonly unit: InventoryUnit;
  readonly currentStock: number;
  readonly minimumStock: number;
}

export interface MenuPerformanceRow {
  readonly menuItemId: string;
  readonly menuName: string;
  readonly categoryId: string | null;
  readonly categoryName: string | null;
  readonly quantitySold: number;
  readonly netSales: Money;
  readonly estimatedCogs: Money;
  readonly estimatedGrossProfit: Money;
  readonly estimatedGrossMarginPercentage: number;
  readonly missingCost: boolean;
}

export interface CategoryPerformanceRow {
  readonly categoryId: string | null;
  readonly categoryName: string | null;
  readonly quantitySold: number;
  readonly netSales: Money;
  readonly estimatedCogs: Money;
  readonly estimatedGrossProfit: Money;
  readonly estimatedGrossMarginPercentage: number;
  readonly missingCostItemCount: number;
}

export interface PeakSalesHourRow {
  readonly hour: number;
  readonly paidOrderCount: number;
  readonly grossSales: Money;
}

export interface InventoryUsageRow {
  readonly ingredientId: string;
  readonly ingredientName: string;
  readonly unit: InventoryUnit;
  readonly quantityUsed: number;
  readonly estimatedUsageValue: Money;
  readonly currentStock: number;
  readonly minimumStock: number;
  readonly lowStock: boolean;
}
