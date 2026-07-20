import {
  buildDailySalesTrend,
  buildOrderChannelBreakdown,
  buildPaymentMethodBreakdown,
  calculateDashboardSummary,
  selectLowStockIngredients,
  type DashboardSummary,
  type DailySalesTrendPoint,
  type LowStockIngredientItem,
  type OrderChannelBreakdownItem,
  type PaymentMethodBreakdownItem,
  type ReportingSnapshot,
} from "@warungmeng/domain";

export interface DashboardOverviewModel {
  readonly summary: DashboardSummary;
  readonly dailySalesTrend: readonly DailySalesTrendPoint[];
  readonly paymentMethods: readonly PaymentMethodBreakdownItem[];
  readonly orderChannels: readonly OrderChannelBreakdownItem[];
  readonly lowStockIngredients: readonly LowStockIngredientItem[];
  readonly isEmpty: boolean;
}

function hasReportActivity(
  summary: DashboardSummary,
  dailySalesTrend: readonly DailySalesTrendPoint[],
  paymentMethods: readonly PaymentMethodBreakdownItem[],
  orderChannels: readonly OrderChannelBreakdownItem[],
  lowStockIngredients: readonly LowStockIngredientItem[],
): boolean {
  return (
    summary.grossSales.amount !== 0 ||
    summary.refunds.amount !== 0 ||
    summary.expenses.amount !== 0 ||
    summary.paidOrderCount !== 0 ||
    dailySalesTrend.some(
      (point) =>
        point.grossSales.amount !== 0 || point.refunds.amount !== 0 || point.paidOrderCount !== 0,
    ) ||
    paymentMethods.length > 0 ||
    orderChannels.length > 0 ||
    lowStockIngredients.length > 0
  );
}

/** Composes existing domain selectors into the render-ready overview contract. */
export function createDashboardOverviewModel(snapshot: ReportingSnapshot): DashboardOverviewModel {
  const summary = calculateDashboardSummary(snapshot);
  const dailySalesTrend = buildDailySalesTrend(snapshot);
  const paymentMethods = buildPaymentMethodBreakdown(snapshot);
  const orderChannels = buildOrderChannelBreakdown(snapshot);
  const lowStockIngredients = selectLowStockIngredients(snapshot);

  return {
    summary,
    dailySalesTrend,
    paymentMethods,
    orderChannels,
    lowStockIngredients,
    isEmpty: !hasReportActivity(
      summary,
      dailySalesTrend,
      paymentMethods,
      orderChannels,
      lowStockIngredients,
    ),
  };
}
