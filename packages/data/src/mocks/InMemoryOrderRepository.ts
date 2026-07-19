import { transitionOrderStatus, type Order, type OrderStatus } from "@warungmeng/domain";
import type {
  OrderListQuery,
  OrderRepository,
  OrderStatusUpdateResult,
} from "../repositories/OrderRepository";

export type OrderEventIdFactory = () => string;
export type OrderClock = () => string;

function clone<TEntity>(value: TEntity): TEntity {
  return structuredClone(value);
}

function defaultEventIdFactory(): string {
  return `order-event-${crypto.randomUUID()}`;
}

function defaultClock(): string {
  return new Date().toISOString();
}

export class InMemoryOrderRepository implements OrderRepository {
  #orders: Order[];
  readonly #clock: OrderClock;
  readonly #eventIdFactory: OrderEventIdFactory;

  constructor(
    seed: readonly Order[] = [],
    clock: OrderClock = defaultClock,
    eventIdFactory: OrderEventIdFactory = defaultEventIdFactory,
  ) {
    this.#orders = seed.map((order) => clone(order));
    this.#clock = clock;
    this.#eventIdFactory = eventIdFactory;
  }

  async listOrders(query: OrderListQuery = {}): Promise<readonly Order[]> {
    const normalizedSearch = query.search?.trim().toLocaleLowerCase();
    const endExclusive = query.dateTo ? `${query.dateTo}T23:59:59.999Z` : undefined;

    const orders = this.#orders
      .filter((order) => {
        if (!normalizedSearch) return true;
        return (
          order.orderNumber.toLocaleLowerCase().includes(normalizedSearch) ||
          order.customer?.name.toLocaleLowerCase().includes(normalizedSearch) ||
          order.customer?.phone.toLocaleLowerCase().includes(normalizedSearch) ||
          order.items.some((item) => item.name.toLocaleLowerCase().includes(normalizedSearch))
        );
      })
      .filter((order) => !query.status || order.status === query.status)
      .filter((order) => !query.outletId || order.outletId === query.outletId)
      .filter((order) => !query.channel || order.channel === query.channel)
      .filter((order) => !query.dateFrom || order.createdAt >= `${query.dateFrom}T00:00:00.000Z`)
      .filter((order) => !endExclusive || order.createdAt <= endExclusive)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return clone(orders);
  }

  async getOrderById(id: string): Promise<Order | null> {
    const order = this.#orders.find((candidate) => candidate.id === id);
    return order ? clone(order) : null;
  }

  async updateOrderStatus(id: string, nextStatus: OrderStatus): Promise<OrderStatusUpdateResult> {
    const index = this.#orders.findIndex((candidate) => candidate.id === id);
    const current = this.#orders[index];
    if (index === -1 || !current) return { status: "not-found" };

    const updated = transitionOrderStatus(
      current,
      nextStatus,
      this.#clock(),
      this.#eventIdFactory(),
    );
    if (!updated) return { status: "invalid-transition", order: clone(current) };

    this.#orders[index] = updated;
    return { status: "updated", order: clone(updated) };
  }
}
