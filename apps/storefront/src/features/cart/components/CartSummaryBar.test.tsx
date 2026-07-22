import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { CART_STORAGE_KEY, type CartStorageLike } from "../application/cartStorage";
import { StorefrontCartProvider } from "../application/StorefrontCartProvider";
import type { StorefrontCartItem } from "../application/storefrontCartModel";
import { CartSummaryBar } from "./CartSummaryBar";

function createStoredItem(overrides: Partial<StorefrontCartItem> = {}): StorefrontCartItem {
  return {
    id: "stored-1",
    menuItemId: "m1",
    name: "Nasi Goreng",
    unitPrice: { amount: 25000, currency: "IDR" },
    variantSelections: [],
    quantity: 2,
    note: "",
    ...overrides,
  };
}

function createMemoryStorage(initial: Record<string, string> = {}): CartStorageLike {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname}</div>;
}

function renderBar(initialPath: string, storedItems: readonly StorefrontCartItem[]) {
  const storage = createMemoryStorage(
    storedItems.length > 0
      ? { [CART_STORAGE_KEY]: JSON.stringify({ version: 1, items: storedItems }) }
      : {},
  );

  return render(
    <WarungMengI18nProvider storage={null}>
      <StorefrontCartProvider storage={storage}>
        <MemoryRouter initialEntries={[initialPath]}>
          <CartSummaryBar />
          <LocationProbe />
        </MemoryRouter>
      </StorefrontCartProvider>
    </WarungMengI18nProvider>,
  );
}

describe("CartSummaryBar", () => {
  it("stays hidden while the cart is empty", () => {
    renderBar("/", []);

    expect(screen.queryByRole("button", { name: "Lihat Keranjang" })).not.toBeInTheDocument();
  });

  it("shows the total quantity and subtotal on the catalog route", () => {
    renderBar("/", [createStoredItem()]);

    expect(screen.getByText("2 item • Rp 50.000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lihat Keranjang" })).toBeInTheDocument();
  });

  it("sums quantity and subtotal across lines on the menu detail route", () => {
    renderBar("/menu/nasi-goreng", [
      createStoredItem(),
      createStoredItem({ id: "stored-2", name: "Es Teh", quantity: 1 }),
    ]);

    expect(screen.getByText("3 item • Rp 75.000")).toBeInTheDocument();
  });

  it("stays hidden on the cart route even when the cart has items", () => {
    renderBar("/cart", [createStoredItem()]);

    expect(screen.queryByRole("button", { name: "Lihat Keranjang" })).not.toBeInTheDocument();
  });

  it("navigates to the cart route and hides itself there", async () => {
    const user = userEvent.setup();
    renderBar("/", [createStoredItem()]);

    await user.click(screen.getByRole("button", { name: "Lihat Keranjang" }));

    expect(screen.getByTestId("location-probe")).toHaveTextContent("/cart");
    expect(screen.queryByRole("button", { name: "Lihat Keranjang" })).not.toBeInTheDocument();
  });
});
