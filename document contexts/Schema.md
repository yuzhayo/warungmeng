# Warung Meng — Schema and Domain Logic Context

> Sumber: live checkout `packages/domain/src/**` dan
> `packages/data/src/repositories/*.ts`, diaudit 24 Juli 2026.
> Ini ringkasan kontrak, bukan pengganti TypeScript source. Domain/data contract tidak
> boleh diubah selama refactor modular tanpa approval eksplisit.

## 1. Catalog (`packages/domain/src/catalog`)

```ts
type CurrencyCode = "IDR";
interface Money {
  amount: number;
  currency: CurrencyCode;
}

type MenuVisibility = "visible" | "hidden";
type MenuAvailability =
  { status: "available" } | { status: "unavailable"; unavailableUntil: string | null };

type InventoryPolicy = { mode: "untracked" } | { mode: "tracked"; quantity: number };

type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
interface SalesInterval {
  id: string;
  start: string;
  end: string;
}
type SalesSchedule =
  | { mode: "always" }
  | { mode: "scheduled"; activeDays: Weekday[]; allDay: boolean; intervals: SalesInterval[] };

interface MenuCategory {
  id;
  name;
  slug;
  visibility;
  sortOrder;
}

interface MenuItem {
  id;
  name;
  slug;
  categoryId;
  description;
  image: { url; alt } | null;
  price: Money;
  compareAtPrice: Money | null;
  availability: MenuAvailability;
  inventory: InventoryPolicy;
  visibility: MenuVisibility;
  salesSchedule: SalesSchedule;
  variantGroupIds: string[];
  sortOrder: number;
}

interface MenuVariantGroup {
  id;
  name;
  description;
  visibility;
  selection: { minSelections: number; maxSelections: number | null };
  options: MenuVariantOption[];
  sortOrder: number;
}
interface MenuVariantOption {
  id;
  name;
  priceAdjustment: Money;
  availability: MenuAvailability;
  inventory: InventoryPolicy;
  sortOrder: number;
}
```

## 2. Orders (`packages/domain/src/orders`)

```ts
ORDER_STATUSES = ["new", "accepted", "preparing", "ready", "completed", "cancelled"];
type OrderChannel = "pos" | "storefront" | "manual";
type OrderFulfillment = "dine-in" | "takeaway" | "delivery";
type OrderPaymentStatus = "unpaid" | "paid" | "refunded";
type OrderPaymentMethod = "cash" | "qris" | "card" | "unknown";

interface Order {
  id;
  orderNumber;
  outletId;
  outletName;
  channel: OrderChannel;
  fulfillment: OrderFulfillment;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: OrderPaymentMethod;
  status: OrderStatus;
  customer: { name; phone } | null;
  items: OrderItem[];
  totals: OrderTotals;
  customerNote;
  internalNote;
  createdAt;
  updatedAt;
  events: OrderStatusEvent[]; // { id; status; occurredAt; note }
}
interface OrderItem {
  id;
  menuItemId;
  name;
  quantity;
  unitPrice: Money;
  variantSelections: OrderVariantSelection[];
  note;
  lineTotal: Money;
}
interface OrderTotals {
  subtotal;
  discount;
  tax;
  serviceCharge;
  rounding;
  total; // semua Money
}
```

**Protected behavior**: transisi status order (valid/invalid), efek cancel
paid→refund+reversal (atomik, idempotent), cancel unpaid→tanpa efek.

## 3. Inventory (`packages/domain/src/inventory`)

```ts
type InventoryUnit = "g" | "kg" | "ml" | "l" | "piece" | "portion";
type InventoryMovementType =
  "purchase" | "consumption" | "adjustment-in" | "adjustment-out" | "waste";

interface InventoryIngredient {
  id;
  name;
  baseUnit;
  supplierId: string | null;
  status: "active" | "archived";
  minimumStock;
  lastPurchaseUnitCost: Money;
  averageUnitCost: Money;
}
interface InventorySupplier {
  id;
  name;
  phone;
}
interface InventoryStockBalance {
  ingredientId;
  outletId;
  quantity;
  updatedAt;
}
interface InventoryMovement {
  id;
  ingredientId;
  outletId;
  type;
  quantity;
  unit;
  baseQuantityDelta;
  unitCost: Money | null;
  referenceId;
  note;
  occurredAt;
}
interface MenuRecipe {
  menuItemId;
  components: RecipeComponent[];
  packagingCost: Money;
  additionalCost: Money;
  updatedAt;
}
interface RecipeComponent {
  id;
  ingredientId;
  quantity;
  unit;
  wastePercentage;
}
interface MenuHppBreakdown {
  menuItemId;
  ingredientCosts: RecipeIngredientCost[];
  ingredientTotal;
  packagingCost;
  additionalCost;
  total; // Money
}
```

## 4. Finance (`packages/domain/src/finance`)

```ts
FINANCE_DIRECTIONS = ["inflow", "outflow"];
FINANCE_TRANSACTION_TYPES = [
  "sale",
  "manual-income",
  "expense",
  "refund",
  "cash-in",
  "cash-out",
  "adjustment",
];
FINANCE_SOURCES = ["automatic", "manual"];
FINANCE_STATUSES = ["pending", "posted", "voided"];
FINANCE_PAYMENT_METHODS = ["cash", "qris", "card", "bank-transfer", "other"];

// 13 kategori tetap, contoh:
FINANCE_CATEGORIES: inflow: (sales, other - income, capital - deposit, inflow - adjustment);
outflow: (ingredients,
  packaging,
  utilities,
  transportation,
  salary,
  maintenance,
  refund,
  other - expense,
  outflow - adjustment);

interface FinanceTransaction {
  id;
  occurredAt;
  direction;
  type;
  source;
  status;
  categoryId;
  categoryLabel;
  amount: Money;
  paymentMethod;
  description;
  referenceNumber;
  sourceReference: string | null;
  attachment: FinanceAttachmentMetadata | null;
  createdAt;
  updatedAt;
}
interface FinanceSummary {
  totalInflow;
  totalOutflow;
  netCashflow;
  cashBalance: Money;
  postedCount;
  pendingCount;
  voidedCount;
}
```

## 5. POS (`packages/domain/src/pos`)

```ts
interface PosOutlet {
  id;
  name;
}
type PosSession =
  | { status: "closed"; outlet; openingBalance: Money; openedAt: null }
  | { status: "open"; outlet; openingBalance: Money; openedAt: string };

interface PosSessionCloseInput {
  actualCash;
  cashSales;
  closedAt;
}
interface PosSessionCloseRecord {
  outlet;
  openedAt;
  closedAt;
  openingBalance;
  cashSales;
  expectedCash;
  actualCash;
  variance; // semua Money kecuali openedAt/closedAt
}
interface PosCartItem {
  id;
  menuItemId;
  name;
  unitPrice: Money;
  variantSelections;
  quantity;
  note;
}
interface PosCheckoutDraft {
  fulfillment: "dine-in" | "takeaway";
  paymentMethod: Exclude<OrderPaymentMethod, "unknown">;
  cashReceived: number;
  pricing: { discountAmount; serviceChargeAmount; taxRate; roundingStep };
}
interface PosReceipt {
  orderId;
  orderNumber;
  paymentMethod;
  totals;
  cashReceived;
  change;
  issuedAt;
}
```

## 6. Reporting (`packages/domain/src/reporting`)

```ts
DEFAULT_REPORTING_TIME_ZONE = "Asia/Jakarta";
interface ReportingPeriod {
  startDate;
  endDate;
  timeZone;
}
interface ReportingSnapshot {
  period;
  orders: Order[];
  financeTransactions: FinanceTransaction[];
  menuItems: MenuItem[];
  categories: MenuCategory[];
  menuHpp: MenuHppBreakdown[];
  ingredients: InventoryIngredient[];
  stockBalances;
  inventoryMovements;
}
interface DashboardSummary {
  grossSales;
  refunds;
  netRevenue;
  expenses;
  netCashflow: Money;
  paidOrderCount;
  averageOrderValue: Money;
  cancellationRate: number;
  estimatedCogs;
  estimatedGrossProfit: Money;
  estimatedGrossMarginPercentage: number;
  missingCostItemCount;
  lowStockIngredientCount;
}
// + DailySalesTrendPoint, PaymentMethodBreakdownItem, OrderChannelBreakdownItem,
//   LowStockIngredientItem, MenuPerformanceRow, CategoryPerformanceRow,
//   PeakSalesHourRow, InventoryUsageRow
```

## 7. Pure Domain Logic Inventory

Semua module berikut harus memperoleh migration-ledger row dan regression evidence;
type summary saja tidak cukup:

| Domain    | Current logic modules                                | Protected behavior                                                          |
| --------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Catalog   | `validation.ts`, `variantSelectionRule.ts`           | Menu/category/variant validation dan selection bounds                       |
| Orders    | `transitions.ts`                                     | Valid/invalid order status transitions                                      |
| POS       | `session.ts`, `pricing.ts`, `cart.ts`, `checkout.ts` | Session lifecycle, deterministic totals, cart mutation, checkout validation |
| Inventory | `units.ts`, `stock.ts`, `hpp.ts`                     | Unit conversion, stock balance, recipe/HPP calculations                     |
| Finance   | `validation.ts`, `ledger.ts`, `calculations.ts`      | Transaction validation, ledger effects, summaries                           |
| Reporting | `dashboard.ts`, `reports.ts`                         | Period aggregation, menu/category/inventory reporting                       |

Business orchestration yang melintasi domain—terutama cancel paid order → Finance
refund + Inventory reversal—berada di application/repository workflow dan juga wajib
dipetakan terpisah dari pure domain modules.

## 8. Repository Contracts (`packages/data/src/repositories`)

| Repository                   | Method utama                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MenuRepository`             | `listMenus`, `getMenuById`, `createMenu`, `updateMenu`, `deleteMenu`                                                                                   |
| `MenuCategoryRepository`     | `listCategories`, `getCategoryById`, `createCategory`, `updateCategory`, `deleteCategory`                                                              |
| `MenuVariantGroupRepository` | `listVariantGroups`, `getVariantGroupById`, `createVariantGroup`, `updateVariantGroup`, `deleteVariantGroup`                                           |
| `OrderRepository`            | `listOrders`, `getOrderById`, `createOrder`, `updateOrderStatus` → `OrderStatusUpdateResult` (`updated`/`not-found`/`invalid-transition`)              |
| `InventoryRepository`        | Ingredient CRUD/archive; suppliers; stock balances; movements; recipes; `calculateHpp`; idempotent `consumeOrder`; idempotent `revertOrderConsumption` |
| `FinanceRepository`          | `listManualTransactions`, `getManualTransactionById`, `createManualTransaction`, `updateManualTransaction`, `voidManualTransaction`                    |

Semua repository saat ini punya implementasi **mock (in-memory)** di
`packages/data/src/mocks/InMemory*Repository.ts`, di-seed dari `WarungMeng*MockData.ts`.
Backend/persistence sungguhan belum ada — ini scope terpisah (lihat `PRD.md` §6/§7).

## 9. Repository Semantics yang Dilindungi

- `OrderRepository.updateOrderStatus` membedakan `updated`, `not-found`, dan
  `invalid-transition`.
- `InventoryRepository.consumeOrder` idempotent berdasarkan order ID.
- `InventoryRepository.revertOrderConsumption` membuat reversal terhadap recorded
  consumption dan idempotent berdasarkan order ID.
- In-memory repositories adalah current concrete adapters, bukan bagian dari domain.
- Future HTTP/persistence adapter harus mempertahankan repository semantics dan
  characterization tests yang sama.

## 10. Aturan Perubahan Schema

- Domain hanya boleh diimpor oleh `data`, `application` (port), dan tidak boleh
  bergantung balik ke package lain (lihat `Rules.md` §1 Import Contract).
- Menambah/mengubah field domain **butuh approval eksplisit** — bukan bagian dari
  refactor modular (Guardrails: "mengubah domain/data contract tanpa explicit approval"
  dilarang).
- Kebutuhan schema baru yang sudah teridentifikasi tapi belum dieksekusi:
  `idempotencyKey` di `CreateOrderInput` (TD-SF-02) — diblokir oleh boundary rule,
  perlu proses approval domain contract change.
