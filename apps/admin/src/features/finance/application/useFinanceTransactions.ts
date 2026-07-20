import {
  filterFinanceTransactions,
  type FinanceTransaction,
  type FinanceTransactionQuery,
} from "@warungmeng/domain";
import { useMemo } from "react";

export function useFinanceTransactions(
  transactions: readonly FinanceTransaction[],
  query: FinanceTransactionQuery,
): readonly FinanceTransaction[] {
  return useMemo(() => filterFinanceTransactions(transactions, query), [query, transactions]);
}
