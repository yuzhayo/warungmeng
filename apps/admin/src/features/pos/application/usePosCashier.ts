import {
  addPosCartItem,
  calculateExpectedPosCash,
  calculatePosChange,
  calculatePosTotals,
  closePosSession,
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
  type PosReceipt,
  type PosSessionCloseRecord,
} from "@warungmeng/domain";
import { useMemo, useSyncExternalStore } from "react";
import { DEFAULT_POS_CHECKOUT, createPosOrderNumber } from "./posCashierModel";
import type { PosCheckoutPort } from "./ports/posCheckoutPort";
import type { PosSessionStore } from "./posSessionStore";

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
  checkoutPort: PosCheckoutPort,
  store: PosSessionStore,
  runtime: PosCashierRuntime = DEFAULT_RUNTIME,
) {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const { session, selectedOutlet, openingBalance, items, checkout, receipt } = state;
  const totals = useMemo(
    () => calculatePosTotals(items, checkout.pricing),
    [checkout.pricing, items],
  );

  function startSession(): void {
    const openedAt = runtime.now().toISOString();
    store.update((current) => ({
      ...current,
      session: openPosSession(current.selectedOutlet, current.openingBalance, openedAt),
      cashSales: 0,
      lastCloseRecord: null,
    }));
  }

  function endSession(actualCash: number): PosSessionCloseRecord | null {
    let record: PosSessionCloseRecord | null = null;
    const closedAt = runtime.now().toISOString();
    store.update((current) => {
      if (current.session.status !== "open") return current;
      const outcome = closePosSession(current.session, {
        actualCash,
        cashSales: current.cashSales,
        closedAt,
      });
      record = outcome.record;
      return {
        ...current,
        session: outcome.session,
        openingBalance: 0,
        items: [],
        checkout: DEFAULT_POS_CHECKOUT,
        receipt: null,
        cashSales: 0,
        lastCloseRecord: outcome.record,
      };
    });
    return record;
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
    store.update((current) => ({ ...current, items: addPosCartItem(current.items, item) }));
  }

  function updateCheckout(patch: Partial<PosCheckoutDraft>): void {
    store.update((current) => ({ ...current, checkout: { ...current.checkout, ...patch } }));
  }

  function updatePricing(patch: Partial<PosCheckoutDraft["pricing"]>): void {
    store.update((current) => ({
      ...current,
      checkout: {
        ...current.checkout,
        pricing: { ...current.checkout.pricing, ...patch },
      },
    }));
  }

  async function completeCheckout(): Promise<PosCheckoutResult | null> {
    const current = store.getState();
    if (current.session.status !== "open" || current.items.length === 0) return null;
    const currentTotals = calculatePosTotals(current.items, current.checkout.pricing);
    if (
      current.checkout.paymentMethod === "cash" &&
      !isPosPaymentSufficient(currentTotals.total.amount, current.checkout.cashReceived)
    ) {
      return null;
    }

    store.update((state) => ({ ...state, processing: true }));
    try {
      const now = runtime.now();
      const orderNumber = createPosOrderNumber(now, current.sequence);
      const input = createPosOrder({
        orderNumber,
        session: current.session,
        items: current.items,
        checkout: current.checkout,
        totals: currentTotals,
        occurredAt: now.toISOString(),
        eventId: `order-event-${runtime.id()}`,
      });
      const order = await checkoutPort.createOrder(input);
      let inventorySyncFailed = false;
      try {
        await checkoutPort.consumeOrder(order);
      } catch {
        inventorySyncFailed = true;
        store.update((state) => ({
          ...state,
          pendingInventorySyncs: state.pendingInventorySyncs.some(
            (pending) => pending.orderId === order.id,
          )
            ? state.pendingInventorySyncs
            : [
                ...state.pendingInventorySyncs,
                { orderId: order.id, orderNumber: order.orderNumber },
              ],
        }));
      }
      const cashReceived =
        current.checkout.paymentMethod === "cash"
          ? current.checkout.cashReceived
          : currentTotals.total.amount;
      const nextReceipt: PosReceipt = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: current.checkout.paymentMethod,
        totals: order.totals,
        cashReceived: { amount: cashReceived, currency: "IDR" },
        change: {
          amount: calculatePosChange(order.totals.total.amount, cashReceived),
          currency: "IDR",
        },
        issuedAt: now.toISOString(),
      };
      store.update((state) => ({
        ...state,
        sequence: state.sequence + 1,
        cashSales:
          current.checkout.paymentMethod === "cash"
            ? state.cashSales + order.totals.total.amount
            : state.cashSales,
        receipt: nextReceipt,
        items: [],
        checkout: DEFAULT_POS_CHECKOUT,
      }));
      return { receipt: nextReceipt, inventorySyncError: inventorySyncFailed };
    } finally {
      store.update((state) => ({ ...state, processing: false }));
    }
  }

  async function retryInventorySync(orderId: string): Promise<boolean> {
    const pending = store
      .getState()
      .pendingInventorySyncs.find((candidate) => candidate.orderId === orderId);
    if (!pending) return false;
    const order = await checkoutPort.getOrderById(orderId);
    if (!order) return false;
    try {
      await checkoutPort.consumeOrder(order);
    } catch {
      return false;
    }
    store.update((current) => ({
      ...current,
      pendingInventorySyncs: current.pendingInventorySyncs.filter(
        (candidate) => candidate.orderId !== orderId,
      ),
    }));
    return true;
  }

  return {
    session,
    selectedOutlet,
    openingBalance,
    items,
    checkout,
    totals,
    processing: state.processing,
    receipt,
    pendingInventorySyncs: state.pendingInventorySyncs,
    retryInventorySync,
    cashSales: state.cashSales,
    expectedCash:
      session.status === "open"
        ? calculateExpectedPosCash(session.openingBalance.amount, state.cashSales)
        : 0,
    lastCloseRecord: state.lastCloseRecord,
    setOpeningBalance: (value: number) =>
      store.update((current) =>
        current.session.status === "closed" ? { ...current, openingBalance: value } : current,
      ),
    startSession,
    endSession,
    addMenu,
    setItemQuantity: (itemId: string, quantity: number) =>
      store.update((current) => ({
        ...current,
        items: setPosCartItemQuantity(current.items, itemId, quantity),
      })),
    removeItem: (itemId: string) =>
      store.update((current) => ({
        ...current,
        items: removePosCartItem(current.items, itemId),
      })),
    updateItem: (
      itemId: string,
      variantSelections: readonly OrderVariantSelection[],
      note: string,
    ) =>
      store.update((current) => ({
        ...current,
        items: updatePosCartItemConfiguration(current.items, itemId, variantSelections, note),
      })),
    updateCheckout,
    updatePricing,
    completeCheckout,
    dismissReceipt: () => store.update((current) => ({ ...current, receipt: null })),
  };
}
