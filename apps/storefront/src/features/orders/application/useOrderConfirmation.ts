import { useCallback, useEffect, useState } from "react";
import type { OrderRepository } from "@warungmeng/data";
import {
  loadRecentOrderReceipt,
  type ReceiptStorageLike,
} from "../../checkout/application/recentOrderReceiptStorage";
import {
  createOrderConfirmationView,
  createReceiptConfirmationView,
  isValidStorefrontOrderId,
  type OrderConfirmationView,
} from "./orderConfirmationModel";

export type OrderConfirmationState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly order: OrderConfirmationView }
  | { readonly status: "not-found" }
  | { readonly status: "error"; readonly retry: () => void };

function matchingReceipt(storage: ReceiptStorageLike | null, orderId: string) {
  const receipt = loadRecentOrderReceipt(storage);
  return receipt?.orderId === orderId ? createReceiptConfirmationView(receipt) : null;
}

export function useOrderConfirmation(
  orderId: string | undefined,
  repository: OrderRepository,
  storage: ReceiptStorageLike | null,
): OrderConfirmationState {
  const [requestVersion, setRequestVersion] = useState(0);
  const requestKey = `${orderId ?? ""}:${requestVersion}`;
  const [resolved, setResolved] = useState<{
    readonly requestKey: string;
    readonly state: OrderConfirmationState;
  }>({ requestKey: "", state: { status: "loading" } });
  const retry = useCallback(() => setRequestVersion((version) => version + 1), []);

  useEffect(() => {
    let active = true;
    if (!isValidStorefrontOrderId(orderId)) {
      return () => {
        active = false;
      };
    }

    void repository
      .getOrderById(orderId)
      .then((order) => {
        if (!active) return;
        const confirmation =
          order?.id === orderId
            ? createOrderConfirmationView(order)
            : matchingReceipt(storage, orderId);
        setResolved({
          requestKey,
          state: confirmation ? { status: "ready", order: confirmation } : { status: "not-found" },
        });
      })
      .catch(() => {
        if (!active) return;
        const confirmation = matchingReceipt(storage, orderId);
        setResolved({
          requestKey,
          state: confirmation
            ? { status: "ready", order: confirmation }
            : { status: "error", retry },
        });
      });

    return () => {
      active = false;
    };
  }, [orderId, repository, requestKey, retry, storage]);

  if (!isValidStorefrontOrderId(orderId)) return { status: "not-found" };
  return resolved.requestKey === requestKey ? resolved.state : { status: "loading" };
}
