export type CurrencyCode = "IDR";

export interface Money {
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export type MenuVisibility = "visible" | "hidden";

export type MenuAvailability =
  | {
      readonly status: "available";
    }
  | {
      readonly status: "unavailable";
      readonly unavailableUntil: string | null;
    };

export type InventoryPolicy =
  | {
      readonly mode: "untracked";
    }
  | {
      readonly mode: "tracked";
      readonly quantity: number;
    };

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface SalesInterval {
  readonly id: string;
  readonly start: string;
  readonly end: string;
}

export type SalesSchedule =
  | {
      readonly mode: "always";
    }
  | {
      readonly mode: "scheduled";
      readonly activeDays: readonly Weekday[];
      readonly allDay: boolean;
      readonly intervals: readonly SalesInterval[];
    };

export interface MenuImage {
  readonly url: string;
  readonly alt: string;
}

export interface MenuCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly visibility: MenuVisibility;
  readonly sortOrder: number;
}

export interface MenuItem {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly categoryId: string;
  readonly description: string;
  readonly image: MenuImage | null;
  readonly price: Money;
  readonly compareAtPrice: Money | null;
  readonly availability: MenuAvailability;
  readonly inventory: InventoryPolicy;
  readonly visibility: MenuVisibility;
  readonly salesSchedule: SalesSchedule;
  readonly variantGroupIds: readonly string[];
  readonly sortOrder: number;
}

export interface VariantSelectionRule {
  readonly minSelections: number;
  readonly maxSelections: number | null;
}

export interface MenuVariantOption {
  readonly id: string;
  readonly name: string;
  readonly priceAdjustment: Money;
  readonly availability: MenuAvailability;
  readonly inventory: InventoryPolicy;
  readonly sortOrder: number;
}

export interface MenuVariantGroup {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly visibility: MenuVisibility;
  readonly selection: VariantSelectionRule;
  readonly options: readonly MenuVariantOption[];
  readonly sortOrder: number;
}
