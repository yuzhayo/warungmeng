import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App as AntdApp } from "antd";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Order, OrderStatus } from "@warungmeng/domain";
import type { OrderRepository } from "@warungmeng/data";
import { useLocaleSettings, WarungMengI18nProvider } from "@warungmeng/i18n";
import {
  RECENT_ORDER_RECEIPT_KEY,
  type ReceiptStorageLike,
} from "../../checkout/application/recentOrderReceiptStorage";
import { OrderConfirmationScreen } from "./OrderConfirmationScreen";

function createOrder(status: OrderStatus = "new"): Order {
  return {
    id: "order-1",
    orderNumber: "WM-WEB-1",
    outletId: "wm-1",
    outletName: "WARUNG MENG",
    channel: "storefront",
    fulfillment: "takeaway",
    paymentStatus: "unpaid",
    paymentMethod: "cash",
    status,
    customer: { name: "Private Name", phone: "081234567890" },
    items: [
      {
        id: "line-1",
        menuItemId: "menu-1",
        name: "GADO-GADO",
        quantity: 1,
        unitPrice: { amount: 22_000, currency: "IDR" },
        variantSelections: [
          {
            groupId: "group-1",
            groupName: "Porsi",
            optionId: "regular",
            optionName: "REGULER",
            priceAdjustment: { amount: 0, currency: "IDR" },
          },
        ],
        note: "private note",
        lineTotal: { amount: 22_000, currency: "IDR" },
      },
    ],
    totals: {
      subtotal: { amount: 22_000, currency: "IDR" },
      discount: { amount: 0, currency: "IDR" },
      tax: { amount: 0, currency: "IDR" },
      serviceCharge: { amount: 0, currency: "IDR" },
      rounding: { amount: 0, currency: "IDR" },
      total: { amount: 22_000, currency: "IDR" },
    },
    customerNote: "private order note",
    internalNote: "private internal note",
    createdAt: "2026-07-22T06:00:00.000Z",
    updatedAt: "2026-07-22T06:00:00.000Z",
    events: [],
  };
}

function createRepository(order: Order | null, error = false): OrderRepository {
  return {
    getOrderById: error
      ? vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(order)
      : vi.fn().mockResolvedValue(order),
    listOrders: vi.fn().mockResolvedValue([]),
    createOrder: vi.fn(),
    updateOrderStatus: vi.fn().mockResolvedValue({ status: "not-found" }),
  };
}

function memoryStorage(order = createOrder()): ReceiptStorageLike {
  const value = JSON.stringify({
    version: 1,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillment: order.fulfillment,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      optionNames: item.variantSelections.map((selection) => selection.optionName),
      lineTotal: item.lineTotal.amount,
    })),
    subtotal: order.totals.subtotal.amount,
    total: order.totals.total.amount,
    createdAt: order.createdAt,
  });
  return {
    getItem: (key) => (key === RECENT_ORDER_RECEIPT_KEY ? value : null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
}

function LanguageToggle() {
  const { language, setLanguage } = useLocaleSettings();
  return <button onClick={() => setLanguage(language === "id" ? "en" : "id")}>toggle</button>;
}

function renderOrder(options: {
  readonly path?: string;
  readonly order?: Order | null;
  readonly storage?: ReceiptStorageLike | null;
  readonly repositoryError?: boolean;
}) {
  const order = options.order === undefined ? createOrder() : options.order;
  return render(
    <WarungMengI18nProvider storage={null}>
      <AntdApp>
        <MemoryRouter initialEntries={[options.path ?? "/orders/order-1"]}>
          <LanguageToggle />
          <Routes>
            <Route
              path="/orders/:orderId"
              element={
                <OrderConfirmationScreen
                  orderRepository={createRepository(order, options.repositoryError)}
                  receiptStorage={options.storage ?? null}
                />
              }
            />
            <Route path="/" element={<div data-testid="catalog-route" />} />
          </Routes>
        </MemoryRouter>
      </AntdApp>
    </WarungMengI18nProvider>,
  );
}

describe("OrderConfirmationScreen", () => {
  it("renders a customer-safe confirmation with Indonesian Rupiah", async () => {
    const { container } = renderOrder({});

    expect((await screen.findAllByText("Pesanan Diterima")).length).toBeGreaterThan(0);
    expect(screen.getByText("GADO-GADO")).toBeInTheDocument();
    expect(screen.getByText("REGULER")).toBeInTheDocument();
    expect(screen.getAllByText(/Rp\s*22\.000/).length).toBeGreaterThan(0);
    expect(container).not.toHaveTextContent("Private Name");
    expect(container).not.toHaveTextContent("081234567890");
    expect(container).not.toHaveTextContent("private note");
  });

  it("keeps business names and Rupiah stable when language changes", async () => {
    const user = userEvent.setup();
    renderOrder({});
    await screen.findAllByText("Pesanan Diterima");
    expect(screen.getAllByText(/Rp\s*22\.000/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "toggle" }));

    expect((await screen.findAllByText("Order Received")).length).toBeGreaterThan(0);
    expect(screen.getByText("GADO-GADO")).toBeInTheDocument();
    expect(screen.getByText("REGULER")).toBeInTheDocument();
    expect(screen.getAllByText(/Rp\s*22\.000/).length).toBeGreaterThan(0);
  });

  it("renders cancelled as an error result rather than success", async () => {
    const { container } = renderOrder({ order: createOrder("cancelled") });
    expect(await screen.findByText("Pesanan Dibatalkan")).toBeInTheDocument();
    expect(container.querySelector(".ant-result-error")).not.toBeNull();
    expect(container.querySelector(".ant-result-success")).toBeNull();
    expect(screen.queryByText("Status Pesanan")).not.toBeInTheDocument();
  });

  it("renders not-found for an unrelated or invalid route ID", async () => {
    renderOrder({ path: "/orders/unrelated", order: null, storage: memoryStorage() });
    expect(await screen.findByText("Pesanan tidak ditemukan")).toBeInTheDocument();
  });

  it("recovers from a matching session receipt after repository reset", async () => {
    renderOrder({ order: null, storage: memoryStorage() });
    expect(await screen.findByText("WM-WEB-1", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("GADO-GADO")).toBeInTheDocument();
  });

  it("retries a transient repository error", async () => {
    const user = userEvent.setup();
    renderOrder({ repositoryError: true });
    expect(await screen.findByText("Pesanan belum dapat dimuat")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Coba Lagi" }));
    await waitFor(() => expect(screen.getAllByText("Pesanan Diterima").length).toBeGreaterThan(0));
    expect(screen.queryByText("Pesanan belum dapat dimuat")).not.toBeInTheDocument();
  });

  it("returns to the catalog to start another order", async () => {
    const user = userEvent.setup();
    renderOrder({});
    await user.click(await screen.findByRole("button", { name: "Pesan Lagi" }));
    expect(await screen.findByTestId("catalog-route")).toBeInTheDocument();
  });
});
