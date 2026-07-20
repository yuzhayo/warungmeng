import type { FinanceRepository, OrderRepository } from "@warungmeng/data";
import {
  buildFinanceLedger,
  sortFinanceTransactionsNewestFirst,
  type FinanceTransaction,
} from "@warungmeng/domain";
import { useCallback, useEffect, useState } from "react";
import {
  ACTIVE_FINANCE_OUTLET_ID,
  financeOrderRepository,
  financeRepository,
} from "./financeRepository";

export interface FinanceLedgerState {
  readonly transactions: readonly FinanceTransaction[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly retry: () => void;
}

interface FinanceLedgerLoadResult {
  readonly requestId: number;
  readonly transactions: readonly FinanceTransaction[];
  readonly error: boolean;
}

export function useFinanceLedger(
  orders: OrderRepository = financeOrderRepository,
  manualFinance: FinanceRepository = financeRepository,
): FinanceLedgerState {
  const [requestId, setRequestId] = useState(0);
  const [loadResult, setLoadResult] = useState<FinanceLedgerLoadResult>({
    requestId: -1,
    transactions: [],
    error: false,
  });

  useEffect(() => {
    let active = true;

    void Promise.all([
      orders.listOrders({ outletId: ACTIVE_FINANCE_OUTLET_ID }),
      manualFinance.listManualTransactions(),
    ])
      .then(([orderRecords, manualTransactions]) => {
        if (!active) return;
        setLoadResult({
          requestId,
          transactions: sortFinanceTransactionsNewestFirst(
            buildFinanceLedger(orderRecords, manualTransactions),
          ),
          error: false,
        });
      })
      .catch(() => {
        if (active) setLoadResult({ requestId, transactions: [], error: true });
      });

    return () => {
      active = false;
    };
  }, [manualFinance, orders, requestId]);

  const retry = useCallback(() => setRequestId((current) => current + 1), []);
  const loading = loadResult.requestId !== requestId;

  return {
    transactions: loading ? [] : loadResult.transactions,
    loading,
    error: !loading && loadResult.error,
    retry,
  };
}
