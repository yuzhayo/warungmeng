import type { OrderListQuery, OrderRepository } from "@warungmeng/data";
import type { Order, OrderChannel, OrderStatus } from "@warungmeng/domain";
import { useCallback, useEffect, useState } from "react";

export interface OrderListFilters {
  readonly search: string;
  readonly status: OrderStatus | null;
  readonly outletId: string | null;
  readonly channel: OrderChannel | null;
  readonly dateFrom: string;
  readonly dateTo: string;
}

const INITIAL_FILTERS: OrderListFilters = {
  search: "",
  status: null,
  outletId: null,
  channel: null,
  dateFrom: "",
  dateTo: "",
};

function toQuery(filters: OrderListFilters): OrderListQuery {
  return {
    search: filters.search || undefined,
    status: filters.status ?? undefined,
    outletId: filters.outletId ?? undefined,
    channel: filters.channel ?? undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };
}

export function useOrderList(repository: OrderRepository) {
  const [filters, setFilters] = useState<OrderListFilters>(INITIAL_FILTERS);
  const [reloadToken, setReloadToken] = useState(0);
  const requestKey = `${JSON.stringify(filters)}:${reloadToken}`;
  const [loadResult, setLoadResult] = useState<{
    readonly requestKey: string;
    readonly orders: readonly Order[];
    readonly error: boolean;
  }>({ requestKey: "", orders: [], error: false });

  useEffect(() => {
    let active = true;

    void repository
      .listOrders(toQuery(filters))
      .then((result) => {
        if (active) setLoadResult({ requestKey, orders: result, error: false });
      })
      .catch(() => {
        if (active) setLoadResult({ requestKey, orders: [], error: true });
      });

    return () => {
      active = false;
    };
  }, [filters, repository, requestKey]);

  const updateFilters = useCallback((patch: Partial<OrderListFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const loading = loadResult.requestKey !== requestKey;
  const error = !loading && loadResult.error;
  const orders = loading ? [] : loadResult.orders;

  return {
    orders,
    filters,
    loading,
    error,
    updateFilters,
    resetFilters: () => setFilters(INITIAL_FILTERS),
    retry: () => setReloadToken((current) => current + 1),
  };
}
