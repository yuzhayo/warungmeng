import type { CreateOrderInput, OrderListQuery } from "@warungmeng/data";
import type { FinanceTransactionQuery, Order, OrderStatus } from "@warungmeng/domain";
import { projectOrderRefund } from "../../features/finance";
import type {
  FinanceReadCapability,
  FinanceRecordCapability,
  FinanceRefundCapability,
} from "../../features/finance";
import type {
  InventoryAdjustCapability,
  InventoryConsumeCapability,
  InventoryReadCapability,
  InventoryReverseCapability,
} from "../../features/inventory";
import type { CatalogReadCapability } from "../../features/menu";
import { cancelOrderAtomically } from "../../features/orders";
import type { OrdersManageCapability, OrdersReadCapability } from "../../features/orders";
import { POS_OUTLETS, PosSessionStore } from "../../features/pos";
import type {
  PosCartCapability,
  PosCheckoutCapability,
  PosSessionCapability,
} from "../../features/pos";
import type { AdminRepositories } from "./createAdminRepositories";
import type { AdminStorageAdapters } from "./createAdminStorageAdapters";

export interface AdminOrdersCapabilities {
  readonly read: OrdersReadCapability;
  readonly manage: OrdersManageCapability;
}

export interface AdminInventoryCapabilities {
  readonly read: InventoryReadCapability;
  readonly adjust: InventoryAdjustCapability;
  readonly consume: InventoryConsumeCapability;
  readonly reverse: InventoryReverseCapability;
}

export interface AdminFinanceCapabilities {
  readonly read: FinanceReadCapability;
  readonly record: FinanceRecordCapability;
  readonly refund: FinanceRefundCapability;
}

export interface AdminPosCapabilities {
  readonly session: PosSessionCapability;
  readonly cart: PosCartCapability;
  readonly checkout: PosCheckoutCapability;
}

export interface AdminCapabilities {
  readonly catalog: CatalogReadCapability;
  readonly orders: AdminOrdersCapabilities;
  readonly inventory: AdminInventoryCapabilities;
  readonly finance: AdminFinanceCapabilities;
  readonly pos: AdminPosCapabilities;
}

export interface CreateAdminCapabilitiesOptions {
  readonly repositories: AdminRepositories;
  readonly storage: AdminStorageAdapters;
}

/**
 * Builds every capability implementation exactly once from the same
 * composition-owned repositories, atomic transaction, and storage adapter.
 * Extensions publish these exact objects; feature hooks and screens receive
 * them injected and never assemble cross-feature dependencies themselves.
 * Assembly is topological: catalog feeds inventory (HPP) and POS; inventory
 * reversal and the finance refund projection feed the atomic Orders
 * cancellation; POS checkout keeps persisted-order + pending-sync semantics
 * and is deliberately not wrapped in the transaction.
 */
export function createAdminCapabilities(
  options: CreateAdminCapabilitiesOptions,
): AdminCapabilities {
  const { repositories, storage } = options;
  const { orders, inventory, finance, menuCatalog, atomicTransaction } = repositories;

  const catalog: CatalogReadCapability = menuCatalog;

  const inventoryCapabilities: AdminInventoryCapabilities = {
    read: inventory,
    adjust: inventory,
    consume: inventory,
    reverse: inventory,
  };

  const financeCapabilities: AdminFinanceCapabilities = {
    read: {
      listOrders: (query?: OrderListQuery) => orders.listOrders(query),
      listManualTransactions: (query?: FinanceTransactionQuery) =>
        finance.listManualTransactions(query),
    },
    record: finance,
    refund: { projectRefund: projectOrderRefund },
  };

  const ordersCapabilities: AdminOrdersCapabilities = {
    read: orders,
    manage: {
      updateStatus: (orderId: string, status: OrderStatus) =>
        orders.updateOrderStatus(orderId, status),
      cancel: (orderId: string) =>
        cancelOrderAtomically(
          {
            orders,
            inventory: inventoryCapabilities.reverse,
            finance: financeCapabilities.refund,
            transaction: atomicTransaction,
          },
          orderId,
        ),
    },
  };

  const posCapabilities: AdminPosCapabilities = {
    session: { store: new PosSessionStore(POS_OUTLETS[0]!, storage.posSessionStorage) },
    cart: { catalog },
    checkout: {
      createOrder: (input: CreateOrderInput) => orders.createOrder(input),
      getOrderById: (id: string) => orders.getOrderById(id),
      consumeOrder: (order: Order) => inventory.consumeOrder(order),
    },
  };

  return {
    catalog,
    orders: ordersCapabilities,
    inventory: inventoryCapabilities,
    finance: financeCapabilities,
    pos: posCapabilities,
  };
}
