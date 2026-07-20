import {
  filterFinanceTransactions,
  groupFinanceOutflowsByCategory,
  groupFinanceTransactionsByPaymentMethod,
  summarizeFinanceTransactions,
  type FinanceCategorySummary,
  type FinancePaymentMethodSummary,
  type FinanceSummary,
  type FinanceTransaction,
  type FinanceTransactionQuery,
} from "@warungmeng/domain";
import { useMemo } from "react";

export interface FinanceOverviewViewModel {
  readonly transactions: readonly FinanceTransaction[];
  readonly recentTransactions: readonly FinanceTransaction[];
  readonly summary: FinanceSummary;
  readonly paymentMethods: readonly FinancePaymentMethodSummary[];
  readonly expenseCategories: readonly FinanceCategorySummary[];
}

export function buildFinanceOverviewViewModel(
  transactions: readonly FinanceTransaction[],
  query: FinanceTransactionQuery = {},
): FinanceOverviewViewModel {
  const filteredTransactions = filterFinanceTransactions(transactions, query);
  return {
    transactions: filteredTransactions,
    recentTransactions: filteredTransactions.slice(0, 5),
    summary: summarizeFinanceTransactions(filteredTransactions),
    paymentMethods: groupFinanceTransactionsByPaymentMethod(filteredTransactions),
    expenseCategories: groupFinanceOutflowsByCategory(filteredTransactions),
  };
}

export function useFinanceOverview(
  transactions: readonly FinanceTransaction[],
  query: FinanceTransactionQuery = {},
): FinanceOverviewViewModel {
  return useMemo(() => buildFinanceOverviewViewModel(transactions, query), [query, transactions]);
}
