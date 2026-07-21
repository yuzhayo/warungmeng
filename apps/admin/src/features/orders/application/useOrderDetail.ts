import type {
  InventoryRepository,
  OrderRepository,
  OrderStatusUpdateResult,
} from "@warungmeng/data";
import type { Order, OrderStatus } from "@warungmeng/domain";
import { useCallback, useEffect, useState } from "react";
import { cancelOrderWithSettlement, type CancelOrderOutcome } from "./cancelOrderCommand";

export function useOrderDetail(
  repository: OrderRepository,
  orderId: string,
  inventory?: InventoryRepository,
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

    void repository
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
  }, [orderId, repository, requestKey]);

  const updateStatus = useCallback(
    async (nextStatus: OrderStatus): Promise<OrderStatusUpdateResult> => {
      setUpdating(true);
      try {
        const result = await repository.updateOrderStatus(orderId, nextStatus);
        if (result.status === "updated") {
          setLoadResult((current) => ({ ...current, order: result.order }));
        }
        return result;
      } finally {
        setUpdating(false);
      }
    },
    [orderId, repository],
  );

  const cancelOrder = useCallback(async (): Promise<CancelOrderOutcome> => {
    if (!inventory) {
      const result = await updateStatus("cancelled");
      return {
        result,
        refunded: result.status === "updated" && result.order.paymentStatus === "refunded",
        stockReversalFailed: false,
      };
    }
    setUpdating(true);
    try {
      const outcome = await cancelOrderWithSettlement(repository, inventory, orderId);
      if (outcome.result.status === "updated") {
        const nextOrder = outcome.result.order;
        setLoadResult((current) => ({ ...current, order: nextOrder }));
      }
      return outcome;
    } finally {
      setUpdating(false);
    }
  }, [inventory, orderId, repository, updateStatus]);

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
