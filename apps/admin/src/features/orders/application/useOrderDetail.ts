import type { OrderStatusUpdateResult } from "@warungmeng/data";
import type { Order, OrderStatus } from "@warungmeng/domain";
import { useCallback, useEffect, useState } from "react";
import type { CancelOrderOutcome } from "./commands/cancelOrderCommand";
import type { OrdersManageCapability, OrdersReadCapability } from "./ordersCapabilities";

export function useOrderDetail(
  orders: OrdersReadCapability,
  orderId: string,
  manage: OrdersManageCapability,
) {
  const [updating, setUpdating] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const requestKey = `${orderId}:${reloadToken}`;
  const [loadResult, setLoadResult] = useState<{
    readonly requestKey: string;
    readonly order: Order | null;
    readonly error: boolean;
  }>({ requestKey: "", order: null, error: false });

  useEffect(() => {
    let active = true;

    void orders
      .getOrderById(orderId)
      .then((result) => {
        if (!active) return;
        setLoadResult({ requestKey, order: result, error: false });
      })
      .catch(() => {
        if (active) setLoadResult({ requestKey, order: null, error: true });
      });

    return () => {
      active = false;
    };
  }, [orderId, orders, requestKey]);

  const updateStatus = useCallback(
    async (nextStatus: OrderStatus): Promise<OrderStatusUpdateResult> => {
      setUpdating(true);
      try {
        const result = await manage.updateStatus(orderId, nextStatus);
        if (result.status === "updated") {
          setLoadResult((current) => ({ ...current, order: result.order }));
        }
        return result;
      } finally {
        setUpdating(false);
      }
    },
    [manage, orderId],
  );

  const cancelOrder = useCallback(async (): Promise<CancelOrderOutcome> => {
    setUpdating(true);
    try {
      const outcome = await manage.cancel(orderId);
      if (outcome.status === "cancelled") {
        const nextOrder = outcome.order;
        setLoadResult((current) => ({ ...current, order: nextOrder }));
      }
      return outcome;
    } finally {
      setUpdating(false);
    }
  }, [manage, orderId]);

  const loading = loadResult.requestKey !== requestKey;
  const error = !loading && loadResult.error;
  const order = loading ? null : loadResult.order;
  const notFound = !loading && !error && order === null;

  return {
    order,
    loading,
    notFound,
    error,
    updating,
    updateStatus,
    cancelOrder,
    retry: () => setReloadToken((current) => current + 1),
  };
}
