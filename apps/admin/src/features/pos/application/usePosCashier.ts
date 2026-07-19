import type { InventoryRepository, OrderRepository } from "@warungmeng/data";
import {
  addPosCartItem,
  calculatePosChange,
  calculatePosTotals,
  closePosSession,
  createClosedPosSession,
  createPosOrder,
  isPosPaymentSufficient,
  openPosSession,
  removePosCartItem,
  setPosCartItemQuantity,
  updatePosCartItemConfiguration,
  type MenuItem,
  type OrderVariantSelection,
  type PosCartItem,
  type PosCheckoutDraft,
  type PosOutlet,
  type PosReceipt,
} from "@warungmeng/domain";
import { useMemo, useRef, useState } from "react";
import { DEFAULT_POS_CHECKOUT, createPosOrderNumber } from "./posCashierModel";

export interface PosCashierRuntime {
  readonly now: () => Date;
  readonly id: () => string;
}

export interface PosCheckoutResult {
  readonly receipt: PosReceipt;
  readonly inventorySyncError: boolean;
}

const DEFAULT_RUNTIME: PosCashierRuntime = {
  now: () => new Date(),
  id: () => crypto.randomUUID(),
};

export function usePosCashier(
  repository: OrderRepository,
  initialOutlet: PosOutlet,
  runtime: PosCashierRuntime = DEFAULT_RUNTIME,
  inventory?: InventoryRepository,
) {
  const [session, setSession] = useState(() => createClosedPosSession(initialOutlet));
  const [selectedOutlet, setSelectedOutlet] = useState(initialOutlet);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [items, setItems] = useState<readonly PosCartItem[]>([]);
  const [checkout, setCheckout] = useState<PosCheckoutDraft>(DEFAULT_POS_CHECKOUT);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<PosReceipt | null>(null);
  const [inventorySyncError, setInventorySyncError] = useState(false);
  const sequenceRef = useRef(1);
  const totals = useMemo(
    () => calculatePosTotals(items, checkout.pricing),
    [checkout.pricing, items],
  );

  function selectOutlet(outlet: PosOutlet): void {
    if (session.status === "closed") {
      setSelectedOutlet(outlet);
      setSession(createClosedPosSession(outlet));
    }
  }

  function startSession(): void {
    setSession(openPosSession(selectedOutlet, openingBalance, runtime.now().toISOString()));
  }

  function endSession(): void {
    setSession((current) => closePosSession(current));
    setItems([]);
    setCheckout(DEFAULT_POS_CHECKOUT);
    setReceipt(null);
  }

  function addMenu(
    menu: MenuItem,
    variantSelections: readonly OrderVariantSelection[],
    note: string,
  ): void {
    const item: PosCartItem = {
      id: `pos-item-${runtime.id()}`,
      menuItemId: menu.id,
      name: menu.name,
      unitPrice: { ...menu.price },
      variantSelections,
      quantity: 1,
      note,
    };
    setItems((current) => addPosCartItem(current, item));
  }

  function updateCheckout(patch: Partial<PosCheckoutDraft>): void {
    setCheckout((current) => ({ ...current, ...patch }));
  }

  function updatePricing(patch: Partial<PosCheckoutDraft["pricing"]>): void {
    setCheckout((current) => ({
      ...current,
      pricing: { ...current.pricing, ...patch },
    }));
  }

  async function completeCheckout(): Promise<PosCheckoutResult | null> {
    if (session.status !== "open" || items.length === 0) return null;
    if (
      checkout.paymentMethod === "cash" &&
      !isPosPaymentSufficient(totals.total.amount, checkout.cashReceived)
    ) {
      return null;
    }

    setProcessing(true);
    setInventorySyncError(false);
    try {
      const now = runtime.now();
      const orderNumber = createPosOrderNumber(now, sequenceRef.current);
      const input = createPosOrder({
        orderNumber,
        session,
        items,
        checkout,
        totals,
        occurredAt: now.toISOString(),
        eventId: `order-event-${runtime.id()}`,
      });
      const order = await repository.createOrder(input);
      let inventorySyncFailed = false;
      try {
        await inventory?.consumeOrder(order);
      } catch {
        inventorySyncFailed = true;
        setInventorySyncError(true);
      }
      sequenceRef.current += 1;
      const cashReceived =
        checkout.paymentMethod === "cash" ? checkout.cashReceived : totals.total.amount;
      const nextReceipt: PosReceipt = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: checkout.paymentMethod,
        totals: order.totals,
        cashReceived: { amount: cashReceived, currency: "IDR" },
        change: {
          amount: calculatePosChange(order.totals.total.amount, cashReceived),
          currency: "IDR",
        },
        issuedAt: now.toISOString(),
      };
      setReceipt(nextReceipt);
      setItems([]);
      setCheckout(DEFAULT_POS_CHECKOUT);
      return { receipt: nextReceipt, inventorySyncError: inventorySyncFailed };
    } finally {
      setProcessing(false);
    }
  }

  return {
    session,
    selectedOutlet,
    openingBalance,
    items,
    checkout,
    totals,
    processing,
    receipt,
    inventorySyncError,
    setOpeningBalance,
    selectOutlet,
    startSession,
    endSession,
    addMenu,
    setItemQuantity: (itemId: string, quantity: number) =>
      setItems((current) => setPosCartItemQuantity(current, itemId, quantity)),
    removeItem: (itemId: string) => setItems((current) => removePosCartItem(current, itemId)),
    updateItem: (
      itemId: string,
      variantSelections: readonly OrderVariantSelection[],
      note: string,
    ) =>
      setItems((current) =>
        updatePosCartItemConfiguration(current, itemId, variantSelections, note),
      ),
    updateCheckout,
    updatePricing,
    completeCheckout,
    dismissReceipt: () => setReceipt(null),
  };
}
