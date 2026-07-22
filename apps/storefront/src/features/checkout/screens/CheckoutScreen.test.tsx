import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App as AntdApp } from "antd";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { MenuCategory, MenuItem, Order } from "@warungmeng/domain";
import type { OrderRepository } from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { CART_STORAGE_KEY, type CartStorageLike } from "../../cart/application/cartStorage";
import { StorefrontCartProvider } from "../../cart/application/StorefrontCartProvider";
import type { StorefrontCartItem } from "../../cart/application/storefrontCartModel";
import type { StorefrontMenuDetailRepository } from "../../catalog/application/storefrontCatalogRepository";
import {
  RECENT_ORDER_RECEIPT_KEY,
  type ReceiptStorageLike,
} from "../application/recentOrderReceiptStorage";
import { CheckoutScreen } from "./CheckoutScreen";

function createMenu(): MenuItem {
  return {
    id: "menu-1",
    name: "GADO-GADO",
    slug: "gado-gado",
    categoryId: "cat-1",
    description: "",
    image: null,
    price: { amount: 22_000, currency: "IDR" },
    compareAtPrice: null,
    availability: { status: "available" },
    inventory: { mode: "untracked" },
    visibility: "visible",
    salesSchedule: { mode: "always" },
    variantGroupIds: [],
    sortOrder: 0,
  };
}

const category: MenuCategory = {
  id: "cat-1",
  name: "Makanan",
  slug: "makanan",
  visibility: "visible",
  sortOrder: 0,
};

const cartItem: StorefrontCartItem = {
  id: "cart-1",
  menuItemId: "menu-1",
  name: "GADO-GADO",
  unitPrice: { amount: 22_000, currency: "IDR" },
  variantSelections: [],
  quantity: 1,
  note: "",
};

function memoryStorage(): CartStorageLike & ReceiptStorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

function createCatalogRepository(): StorefrontMenuDetailRepository {
  return {
    listMenus: vi.fn().mockResolvedValue([createMenu()]),
    listCategories: vi.fn().mockResolvedValue([category]),
    listVariantGroups: vi.fn().mockResolvedValue([]),
  };
}

function createOrderRepository(
  createOrder: OrderRepository["createOrder"] = vi.fn(),
): OrderRepository {
  return {
    listOrders: vi.fn().mockResolvedValue([]),
    getOrderById: vi.fn().mockResolvedValue(null),
    createOrder,
    updateOrderStatus: vi.fn().mockResolvedValue({ status: "not-found" }),
  };
}

function renderCheckout(options: {
  readonly withItem?: boolean;
  readonly createOrder?: OrderRepository["createOrder"];
  readonly catalogRepository?: StorefrontMenuDetailRepository;
}) {
  const cartStorage = memoryStorage();
  const receiptStorage = memoryStorage();
  if (options.withItem !== false) {
    cartStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items: [cartItem] }));
  }
  const createOrder = options.createOrder ?? vi.fn();
  const repository = createOrderRepository(createOrder);

  render(
    <WarungMengI18nProvider storage={null}>
      <AntdApp>
        <StorefrontCartProvider storage={cartStorage}>
          <MemoryRouter initialEntries={["/checkout"]}>
            <Routes>
              <Route
                path="/checkout"
                element={
                  <CheckoutScreen
                    catalogRepository={options.catalogRepository ?? createCatalogRepository()}
                    orderRepository={repository}
                    receiptStorage={receiptStorage}
                    orderDependencies={{
                      now: () => "2026-07-22T06:00:00.000Z",
                      createOrderNumber: () => "WM-WEB-1",
                      createEventId: () => "event-1",
                    }}
                  />
                }
              />
              <Route path="/cart" element={<div data-testid="cart-route" />} />
              <Route path="/orders/:orderId" element={<div data-testid="order-route" />} />
            </Routes>
          </MemoryRouter>
        </StorefrontCartProvider>
      </AntdApp>
    </WarungMengI18nProvider>,
  );

  return { createOrder, cartStorage, receiptStorage };
}

async function completeCustomerForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Nama"), "Budi Santoso");
  await user.type(screen.getByLabelText("Nomor Telepon"), "0812 3456 7890");
}

describe("CheckoutScreen", () => {
  it("redirects an empty cart back to /cart", async () => {
    renderCheckout({ withItem: false });
    expect(await screen.findByTestId("cart-route")).toBeInTheDocument();
  });

  it("creates one sanitized order, clears the cart, and navigates", async () => {
    const user = userEvent.setup();
    const createOrder = vi.fn(async (input) => ({ ...input, id: "order-1" }) as Order);
    const result = renderCheckout({ createOrder });
    await completeCustomerForm(user);

    await user.dblClick(screen.getByRole("button", { name: "Buat Pesanan" }));

    expect(await screen.findByTestId("order-route")).toBeInTheDocument();
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(result.cartStorage.getItem(CART_STORAGE_KEY)).toBeNull();
    const receipt = result.receiptStorage.getItem(RECENT_ORDER_RECEIPT_KEY) ?? "";
    expect(receipt).toContain("WM-WEB-1");
    expect(receipt).not.toContain("Budi Santoso");
    expect(receipt).not.toContain("081234567890");
  });

  it("preserves customer input and cart when the repository fails", async () => {
    const user = userEvent.setup();
    const result = renderCheckout({
      createOrder: vi.fn().mockRejectedValue(new Error("repository unavailable")),
    });
    await completeCustomerForm(user);

    await user.click(screen.getByRole("button", { name: "Buat Pesanan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Pesanan belum berhasil dibuat");
    expect(screen.getByLabelText("Nama")).toHaveValue("Budi Santoso");
    expect(result.cartStorage.getItem(CART_STORAGE_KEY)).not.toBeNull();
    await waitFor(() => expect(screen.getByRole("button", { name: "Buat Pesanan" })).toBeEnabled());
  });

  it("revalidates immediately before submit and blocks a stale cart", async () => {
    const user = userEvent.setup();
    const catalogRepository = createCatalogRepository();
    vi.mocked(catalogRepository.listMenus)
      .mockResolvedValueOnce([createMenu()])
      .mockResolvedValueOnce([]);
    const createOrder = vi.fn();
    renderCheckout({ createOrder, catalogRepository });
    await completeCustomerForm(user);

    await user.click(screen.getByRole("button", { name: "Buat Pesanan" }));

    expect(
      await screen.findByText("Keranjang berubah dan perlu diperiksa kembali"),
    ).toBeInTheDocument();
    expect(createOrder).not.toHaveBeenCalled();
  });
});
