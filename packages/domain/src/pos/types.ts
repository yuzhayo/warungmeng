import type { Money } from "../catalog/types";
import type {
  OrderFulfillment,
  OrderPaymentMethod,
  OrderTotals,
  OrderVariantSelection,
} from "../orders/types";

export interface PosOutlet {
  readonly id: string;
  readonly name: string;
}

export type PosSession =
  | {
      readonly status: "closed";
      readonly outlet: PosOutlet;
      readonly openingBalance: Money;
      readonly openedAt: null;
    }
  | {
      readonly status: "open";
      readonly outlet: PosOutlet;
      readonly openingBalance: Money;
      readonly openedAt: string;
    };

export interface PosCartItem {
  readonly id: string;
  readonly menuItemId: string;
  readonly name: string;
  readonly unitPrice: Money;
  readonly variantSelections: readonly OrderVariantSelection[];
  readonly quantity: number;
  readonly note: string;
}

export interface PosPricingOptions {
  readonly discountAmount: number;
  readonly serviceChargeAmount: number;
  readonly taxRate: number;
  readonly roundingStep: number;
}

export interface PosCheckoutDraft {
  readonly fulfillment: Extract<OrderFulfillment, "dine-in" | "takeaway">;
  readonly paymentMethod: Exclude<OrderPaymentMethod, "unknown">;
  readonly cashReceived: number;
  readonly pricing: PosPricingOptions;
}

export interface PosReceipt {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly paymentMethod: Exclude<OrderPaymentMethod, "unknown">;
  readonly totals: OrderTotals;
  readonly cashReceived: Money;
  readonly change: Money;
  readonly issuedAt: string;
}
