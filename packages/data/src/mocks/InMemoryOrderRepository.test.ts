import { describe, expect, it } from "vitest";
import { InMemoryOrderRepository } from "./InMemoryOrderRepository";
import { WARUNG_MENG_ORDER_FIXTURES } from "./WarungMengOrderMockData";

function createRepository(): InMemoryOrderRepository {
  return new InMemoryOrderRepository(
    WARUNG_MENG_ORDER_FIXTURES,
    () => "2026-07-19T14:00:00.000Z",
    () => "event-generated",
    () => "order-generated",
  );
}

describe("InMemoryOrderRepository", () => {
  it("sorts newest first and filters by status, outlet, channel, date, and search", async () => {
    const repository = createRepository();

    const allOrders = await repository.listOrders();
    expect(allOrders.slice(0, 3).map((order) => order.id)).toEqual([
      "order-1008",
      "order-1007",
      "order-1006",
    ]);
    await expect(repository.listOrders({ status: "ready" })).resolves.toMatchObject([
      { id: "order-1005" },
    ]);
    await expect(
      repository.listOrders({ outletId: "wm-1", channel: "manual" }),
    ).resolves.toMatchObject([{ id: "order-1006" }]);
    await expect(repository.listOrders({ search: "rina" })).resolves.toMatchObject([
      { id: "order-1008" },
    ]);
    await expect(
      repository.listOrders({ dateFrom: "2026-07-19", dateTo: "2026-07-19" }),
    ).resolves.toHaveLength(4);
  });

  it("returns defensive copies", async () => {
    const repository = createRepository();
    const order = await repository.getOrderById("order-1008");
    expect(order).not.toBeNull();

    (order as { customerNote: string }).customerNote = "Changed externally";

    await expect(repository.getOrderById("order-1008")).resolves.not.toMatchObject({
      customerNote: "Changed externally",
    });
  });

  it("creates a new order and makes it available to subsequent queries", async () => {
    const repository = createRepository();
    const source = WARUNG_MENG_ORDER_FIXTURES[0];
    expect(source).toBeDefined();
    const { id: _ignored, ...input } = source!;

    await expect(
      repository.createOrder({ ...input, orderNumber: "POS-0001" }),
    ).resolves.toMatchObject({
      id: "order-generated",
      orderNumber: "POS-0001",
    });
    await expect(repository.getOrderById("order-generated")).resolves.toMatchObject({
      orderNumber: "POS-0001",
    });
  });

  it("updates a valid status and appends a deterministic event", async () => {
    const repository = createRepository();

    await expect(repository.updateOrderStatus("order-1008", "accepted")).resolves.toMatchObject({
      status: "updated",
      order: {
        status: "accepted",
        updatedAt: "2026-07-19T14:00:00.000Z",
        events: expect.arrayContaining([expect.objectContaining({ id: "event-generated" })]),
      },
    });
  });

  it("distinguishes invalid transitions and missing orders", async () => {
    const repository = createRepository();

    await expect(repository.updateOrderStatus("order-1008", "completed")).resolves.toMatchObject({
      status: "invalid-transition",
    });
    await expect(repository.updateOrderStatus("missing", "accepted")).resolves.toEqual({
      status: "not-found",
    });
  });

  it("refunds a paid order when it is cancelled and keeps unpaid orders unpaid (QA-ADM-005)", async () => {
    const repository = createRepository();

    await expect(repository.updateOrderStatus("order-1008", "cancelled")).resolves.toMatchObject({
      status: "updated",
      order: { status: "cancelled", paymentStatus: "refunded" },
    });
    await expect(repository.updateOrderStatus("order-1006", "cancelled")).resolves.toMatchObject({
      status: "updated",
      order: { status: "cancelled", paymentStatus: "unpaid" },
    });
  });

  it("restores the exact pre-snapshot state, including created orders", async () => {
    const repository = createRepository();
    const snapshot = repository.captureSnapshot();

    const source = WARUNG_MENG_ORDER_FIXTURES[0];
    expect(source).toBeDefined();
    const { id: _ignored, ...input } = source!;
    await repository.createOrder({ ...input, orderNumber: "POS-0002" });
    await repository.updateOrderStatus("order-1008", "cancelled");

    repository.restoreSnapshot(snapshot);

    await expect(repository.getOrderById("order-generated")).resolves.toBeNull();
    await expect(repository.getOrderById("order-1008")).resolves.toMatchObject({
      status: "new",
      paymentStatus: "paid",
    });
  });
});
