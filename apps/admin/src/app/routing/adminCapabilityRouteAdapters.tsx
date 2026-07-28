import type { TranslationKey } from "@warungmeng/i18n";
import { Alert, Spin } from "antd";
import { lazy } from "react";
import { useTranslation } from "react-i18next";
import { useAdminRuntime, useAdminRuntimeSnapshot } from "../composition/AdminRuntimeProvider";
import type { AdminRuntimeCapabilities, AdminRuntimeStatus } from "../composition/adminRuntime";

const OrderListScreen = lazy(() =>
  import("../../features/orders/screens/OrderListScreen").then((module) => ({
    default: module.OrderListScreen,
  })),
);
const OrderDetailScreen = lazy(() =>
  import("../../features/orders/screens/OrderDetailScreen").then((module) => ({
    default: module.OrderDetailScreen,
  })),
);
const PosCashierScreen = lazy(() =>
  import("../../features/pos/screens/PosCashierScreen").then((module) => ({
    default: module.PosCashierScreen,
  })),
);
const InventoryMaterialsScreen = lazy(() =>
  import("../../features/inventory/screens/InventoryMaterialsScreen").then((module) => ({
    default: module.InventoryMaterialsScreen,
  })),
);
const InventoryMovementsScreen = lazy(() =>
  import("../../features/inventory/screens/InventoryMovementsScreen").then((module) => ({
    default: module.InventoryMovementsScreen,
  })),
);
const InventoryHppScreen = lazy(() =>
  import("../../features/inventory/screens/InventoryHppScreen").then((module) => ({
    default: module.InventoryHppScreen,
  })),
);
const FinanceOverviewScreen = lazy(() =>
  import("../../features/finance/screens/FinanceOverviewScreen").then((module) => ({
    default: module.FinanceOverviewScreen,
  })),
);
const FinanceTransactionListScreen = lazy(() =>
  import("../../features/finance/screens/FinanceTransactionListScreen").then((module) => ({
    default: module.FinanceTransactionListScreen,
  })),
);
const FinanceExpenseScreen = lazy(() =>
  import("../../features/finance/screens/FinanceExpenseScreen").then((module) => ({
    default: module.FinanceExpenseScreen,
  })),
);

function CapabilityPendingState() {
  return (
    <div aria-label="Memuat halaman" aria-live="polite" role="status">
      <Spin size="small" />
    </div>
  );
}

function CapabilityUnavailableState({ messageKey }: { readonly messageKey: TranslationKey }) {
  const { t } = useTranslation();
  return <Alert showIcon title={t(messageKey)} type="error" />;
}

interface CapabilityGateState {
  readonly capabilities: AdminRuntimeCapabilities;
  readonly status: AdminRuntimeStatus;
}

function useCapabilityGate(): CapabilityGateState {
  const runtime = useAdminRuntime();
  const { status } = useAdminRuntimeSnapshot();
  return { capabilities: runtime.capabilities, status };
}

/**
 * A missing slice while the runtime is still starting renders the same
 * loading state routes already use; once the runtime settled it is an
 * explicit unavailable state — never a silent fallback to another instance.
 */
function settled(status: AdminRuntimeStatus): boolean {
  return status === "ready" || status === "degraded";
}

export function OrderListRouteAdapter() {
  const { capabilities, status } = useCapabilityGate();
  if (!capabilities.orders) {
    return settled(status) ? (
      <CapabilityUnavailableState messageKey="orders.error.load" />
    ) : (
      <CapabilityPendingState />
    );
  }
  return <OrderListScreen orders={capabilities.orders.read} />;
}

export function OrderDetailRouteAdapter() {
  const { capabilities, status } = useCapabilityGate();
  if (!capabilities.orders) {
    return settled(status) ? (
      <CapabilityUnavailableState messageKey="orders.error.loadDetail" />
    ) : (
      <CapabilityPendingState />
    );
  }
  return (
    <OrderDetailScreen manage={capabilities.orders.manage} orders={capabilities.orders.read} />
  );
}

export function PosCashierRouteAdapter() {
  const { capabilities, status } = useCapabilityGate();
  if (!capabilities.pos) {
    return settled(status) ? (
      <CapabilityUnavailableState messageKey="pos.catalog.error" />
    ) : (
      <CapabilityPendingState />
    );
  }
  return (
    <PosCashierScreen
      catalog={capabilities.pos.cart.catalog}
      checkout={capabilities.pos.checkout}
      sessionStore={capabilities.pos.session.store}
    />
  );
}

export function InventoryMaterialsRouteAdapter() {
  const { capabilities, status } = useCapabilityGate();
  if (!capabilities.inventory) {
    return settled(status) ? (
      <CapabilityUnavailableState messageKey="inventory.materials.loadError" />
    ) : (
      <CapabilityPendingState />
    );
  }
  return (
    <InventoryMaterialsScreen
      adjust={capabilities.inventory.adjust}
      read={capabilities.inventory.read}
    />
  );
}

export function InventoryMovementsRouteAdapter() {
  const { capabilities, status } = useCapabilityGate();
  if (!capabilities.inventory) {
    return settled(status) ? (
      <CapabilityUnavailableState messageKey="inventory.movements.loadError" />
    ) : (
      <CapabilityPendingState />
    );
  }
  return (
    <InventoryMovementsScreen
      adjust={capabilities.inventory.adjust}
      read={capabilities.inventory.read}
    />
  );
}

export function InventoryHppRouteAdapter() {
  const { capabilities, status } = useCapabilityGate();
  if (!capabilities.inventory || !capabilities.catalog) {
    return settled(status) ? (
      <CapabilityUnavailableState messageKey="inventory.hpp.loadError" />
    ) : (
      <CapabilityPendingState />
    );
  }
  return (
    <InventoryHppScreen
      adjust={capabilities.inventory.adjust}
      catalog={capabilities.catalog}
      read={capabilities.inventory.read}
    />
  );
}

export function FinanceOverviewRouteAdapter() {
  const { capabilities, status } = useCapabilityGate();
  if (!capabilities.finance) {
    return settled(status) ? (
      <CapabilityUnavailableState messageKey="finance.transactions.loadError" />
    ) : (
      <CapabilityPendingState />
    );
  }
  return (
    <FinanceOverviewScreen
      finance={capabilities.finance.read}
      record={capabilities.finance.record}
    />
  );
}

export function FinanceTransactionListRouteAdapter() {
  const { capabilities, status } = useCapabilityGate();
  if (!capabilities.finance) {
    return settled(status) ? (
      <CapabilityUnavailableState messageKey="finance.transactions.loadError" />
    ) : (
      <CapabilityPendingState />
    );
  }
  return (
    <FinanceTransactionListScreen
      finance={capabilities.finance.read}
      record={capabilities.finance.record}
    />
  );
}

export function FinanceExpenseRouteAdapter() {
  const { capabilities, status } = useCapabilityGate();
  if (!capabilities.finance) {
    return settled(status) ? (
      <CapabilityUnavailableState messageKey="finance.transactions.loadError" />
    ) : (
      <CapabilityPendingState />
    );
  }
  return (
    <FinanceExpenseScreen
      finance={capabilities.finance.read}
      record={capabilities.finance.record}
    />
  );
}
