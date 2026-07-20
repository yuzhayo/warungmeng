import {
  buildCategoryPerformance,
  buildDailySalesTrend,
  buildInventoryUsage,
  buildMenuPerformance,
  buildOrderChannelBreakdown,
  buildPaymentMethodBreakdown,
  buildPeakSalesHours,
  type CategoryPerformanceRow,
  type DailySalesTrendPoint,
  type InventoryUsageRow,
  type MenuPerformanceRow,
  type OrderChannelBreakdownItem,
  type PaymentMethodBreakdownItem,
  type PeakSalesHourRow,
  type ReportingSnapshot,
} from "@warungmeng/domain";

export interface DashboardReportsModel {
  readonly dailySalesTrend: readonly DailySalesTrendPoint[];
  readonly paymentMethods: readonly PaymentMethodBreakdownItem[];
  readonly orderChannels: readonly OrderChannelBreakdownItem[];
  readonly peakSalesHours: readonly PeakSalesHourRow[];
  readonly menuPerformance: readonly MenuPerformanceRow[];
  readonly categoryPerformance: readonly CategoryPerformanceRow[];
  readonly inventoryUsage: readonly InventoryUsageRow[];
  readonly dailyNetRevenueTotal: number;
  readonly isSalesEmpty: boolean;
  readonly isMenuEmpty: boolean;
  readonly isInventoryEmpty: boolean;
}

function compareText(left: string | null, right: string | null): number {
  return (left ?? "").localeCompare(right ?? "");
}

/** Composes the established reporting selectors without recalculating metrics in the UI. */
export function createDashboardReportsModel(snapshot: ReportingSnapshot): DashboardReportsModel {
  const dailySalesTrend = buildDailySalesTrend(snapshot);
  const paymentMethods = buildPaymentMethodBreakdown(snapshot);
  const orderChannels = buildOrderChannelBreakdown(snapshot);
  const peakSalesHours = buildPeakSalesHours(snapshot);
  const menuPerformance = buildMenuPerformance(snapshot);
  const categoryPerformance = buildCategoryPerformance(snapshot);
  const inventoryUsage = buildInventoryUsage(snapshot);

  return {
    dailySalesTrend,
    paymentMethods,
    orderChannels,
    peakSalesHours,
    menuPerformance,
    categoryPerformance,
    inventoryUsage,
    dailyNetRevenueTotal: dailySalesTrend.reduce(
      (total, point) => total + point.netRevenue.amount,
      0,
    ),
    isSalesEmpty:
      dailySalesTrend.every(
        (point) =>
          point.grossSales.amount === 0 && point.refunds.amount === 0 && point.paidOrderCount === 0,
      ) &&
      paymentMethods.length === 0 &&
      orderChannels.length === 0 &&
      peakSalesHours.length === 0,
    isMenuEmpty: menuPerformance.length === 0 && categoryPerformance.length === 0,
    isInventoryEmpty: inventoryUsage.length === 0,
  };
}

export function compareDailySalesByDate(
  left: DailySalesTrendPoint,
  right: DailySalesTrendPoint,
): number {
  return left.date.localeCompare(right.date);
}

export function compareMenuPerformanceByQuantity(
  left: MenuPerformanceRow,
  right: MenuPerformanceRow,
): number {
  return (
    left.quantitySold - right.quantitySold ||
    compareText(left.menuName, right.menuName) ||
    left.menuItemId.localeCompare(right.menuItemId)
  );
}

export function compareCategoryPerformanceByNetSales(
  left: CategoryPerformanceRow,
  right: CategoryPerformanceRow,
): number {
  return (
    left.netSales.amount - right.netSales.amount ||
    compareText(left.categoryName, right.categoryName) ||
    compareText(left.categoryId, right.categoryId)
  );
}

export function compareInventoryUsageByQuantity(
  left: InventoryUsageRow,
  right: InventoryUsageRow,
): number {
  return (
    left.quantityUsed - right.quantityUsed ||
    compareText(left.ingredientName, right.ingredientName) ||
    left.ingredientId.localeCompare(right.ingredientId)
  );
}
