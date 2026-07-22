import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App as AntdApp } from "antd";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type {
  MenuCategory,
  MenuItem,
  MenuVariantGroup,
  OrderVariantSelection,
} from "@warungmeng/domain";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import type { StorefrontMenuDetailRepository } from "../../catalog/application/storefrontCatalogRepository";
import { CART_STORAGE_KEY, type CartStorageLike } from "../application/cartStorage";
import { StorefrontCartProvider } from "../application/StorefrontCartProvider";
import type { StorefrontCartItem } from "../application/storefrontCartModel";
import { CartScreen } from "./CartScreen";

function createMenu(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: "m1",
    name: "Nasi Goreng",
    slug: "nasi-goreng",
    categoryId: "cat-1",
    description: "Nasi goreng spesial",
    image: null,
    price: { amount: 25000, currency: "IDR" },
    compareAtPrice: null,
    availability: { status: "available" },
    inventory: { mode: "untracked" },
    visibility: "visible",
    salesSchedule: { mode: "always" },
    variantGroupIds: [],
    sortOrder: 0,
    ...overrides,
  };
}

function createCategory(overrides: Partial<MenuCategory> = {}): MenuCategory {
  return {
    id: "cat-1",
    name: "Makanan",
    slug: "makanan",
    visibility: "visible",
    sortOrder: 0,
    ...overrides,
  };
}

function createGroup(overrides: Partial<MenuVariantGroup> = {}): MenuVariantGroup {
  return {
    id: "vg-1",
    name: "Level Pedas",
    description: "",
    visibility: "visible",
    selection: { minSelections: 1, maxSelections: 1 },
    options: [
      {
        id: "opt-biasa",
        name: "Biasa",
        priceAdjustment: { amount: 0, currency: "IDR" },
        availability: { status: "available" },
        inventory: { mode: "untracked" },
        sortOrder: 0,
      },
      {
        id: "opt-pedas",
        name: "Pedas",
        priceAdjustment: { amount: 2000, currency: "IDR" },
        availability: { status: "available" },
        inventory: { mode: "untracked" },
        sortOrder: 1,
      },
    ],
    sortOrder: 0,
    ...overrides,
  };
}

function createSelection(overrides: Partial<OrderVariantSelection> = {}): OrderVariantSelection {
  return {
    groupId: "vg-1",
    groupName: "Level Pedas",
    optionId: "opt-pedas",
    optionName: "Pedas",
    priceAdjustment: { amount: 2000, currency: "IDR" },
    ...overrides,
  };
}

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

function createRepository(overrides: Partial<StorefrontMenuDetailRepository> = {}) {
  return {
    listMenus: vi.fn().mockResolvedValue([createMenu()]),
    listCategories: vi.fn().mockResolvedValue([createCategory()]),
    listVariantGroups: vi.fn().mockResolvedValue([]),
    ...overrides,
  } satisfies StorefrontMenuDetailRepository;
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

let idCounter = 0;

function renderCartScreen(
  options: {
    repository?: StorefrontMenuDetailRepository;
    storedItems?: readonly StorefrontCartItem[];
  } = {},
) {
  const repository = options.repository ?? createRepository();
  const storedItems = options.storedItems ?? [];
  const storage = createMemoryStorage(
    storedItems.length > 0
      ? { [CART_STORAGE_KEY]: JSON.stringify({ version: 1, items: storedItems }) }
      : {},
  );

  return render(
    <WarungMengI18nProvider storage={null}>
      <AntdApp>
        <StorefrontCartProvider storage={storage} createItemId={() => `test-id-${++idCounter}`}>
          <MemoryRouter initialEntries={["/cart"]}>
            <Routes>
              <Route path="/cart" element={<CartScreen repository={repository} />} />
              <Route path="/" element={<div data-testid="catalog-route" />} />
            </Routes>
          </MemoryRouter>
        </StorefrontCartProvider>
      </AntdApp>
    </WarungMengI18nProvider>,
  );
}

describe("CartScreen", () => {
  it("shows the empty state without a checkout action and routes back to the catalog", async () => {
    const user = userEvent.setup();
    renderCartScreen();

    expect(screen.getByText("Keranjang masih kosong")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lanjut ke Checkout" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Lihat Menu" }));
    expect(screen.getByTestId("catalog-route")).toBeInTheDocument();
  });

  it("renders a valid line with variants, note, line total, subtotal, and enabled checkout", async () => {
    renderCartScreen({
      repository: createRepository({
        listMenus: vi.fn().mockResolvedValue([createMenu({ variantGroupIds: ["vg-1"] })]),
        listVariantGroups: vi.fn().mockResolvedValue([createGroup()]),
      }),
      storedItems: [createStoredItem({ variantSelections: [createSelection()], note: "pedas ya" })],
    });

    expect(await screen.findByRole("heading", { name: "Keranjang" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nasi Goreng" })).toBeInTheDocument();
    expect(screen.getByText("Pedas", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Catatan: pedas ya")).toBeInTheDocument();
    // (25.000 + 2.000) × 2 appears as the line total and again as the subtotal.
    expect(screen.getAllByText("Rp 54.000")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Lanjut ke Checkout" })).toBeEnabled();
  });

  it("updates the line total and subtotal when quantity changes", async () => {
    const user = userEvent.setup();
    renderCartScreen({ storedItems: [createStoredItem({ quantity: 1 })] });

    expect(await screen.findAllByText("Rp 25.000")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Tambah jumlah Nasi Goreng" }));

    expect(screen.getAllByText("Rp 50.000")).toHaveLength(2);
  });

  it("removes a line only after the modal confirmation", async () => {
    const user = userEvent.setup();
    renderCartScreen({ storedItems: [createStoredItem()] });

    await user.click(await screen.findByRole("button", { name: "Hapus Nasi Goreng" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Hapus dari keranjang?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Hapus" }));

    expect(await screen.findByText("Keranjang masih kosong")).toBeInTheDocument();
  });

  it("keeps the line when the removal confirmation is cancelled", async () => {
    const user = userEvent.setup();
    renderCartScreen({ storedItems: [createStoredItem()] });

    await user.click(await screen.findByRole("button", { name: "Hapus Nasi Goreng" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Batal" }));

    expect(screen.getByRole("heading", { name: "Nasi Goreng" })).toBeInTheDocument();
    expect(screen.queryByText("Keranjang masih kosong")).not.toBeInTheDocument();
  });

  it("flags a line whose menu left the catalog and blocks checkout", async () => {
    renderCartScreen({
      storedItems: [createStoredItem({ menuItemId: "m-ghost" })],
    });

    expect(await screen.findByText("Menu ini sudah tidak tersedia di katalog")).toBeInTheDocument();
    expect(
      screen.getByText("Beberapa item perlu diperiksa sebelum melanjutkan"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lanjut ke Checkout" })).toBeDisabled();
    // Without a catalog menu there is nothing to reconfigure or step.
    expect(screen.queryByRole("button", { name: "Ubah Nasi Goreng" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tambah jumlah Nasi Goreng" }),
    ).not.toBeInTheDocument();
  });

  it("flags a stock shortage and blocks checkout", async () => {
    renderCartScreen({
      repository: createRepository({
        listMenus: vi
          .fn()
          .mockResolvedValue([createMenu({ inventory: { mode: "tracked", quantity: 1 } })]),
      }),
      storedItems: [createStoredItem({ quantity: 2 })],
    });

    expect(await screen.findByText("Stok tersisa tidak mencukupi jumlah ini")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lanjut ke Checkout" })).toBeDisabled();
  });

  it("edits a line through the prefilled configurator drawer", async () => {
    const user = userEvent.setup();
    renderCartScreen({
      repository: createRepository({
        listMenus: vi.fn().mockResolvedValue([createMenu({ variantGroupIds: ["vg-1"] })]),
        listVariantGroups: vi.fn().mockResolvedValue([createGroup()]),
      }),
      storedItems: [createStoredItem({ variantSelections: [createSelection()], note: "pedas ya" })],
    });

    await user.click(await screen.findByRole("button", { name: "Ubah Nasi Goreng" }));

    // The drawer opens prefilled from the stored line.
    expect(await screen.findByRole("radio", { name: /Pedas/ })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: /Biasa/ }));
    await user.click(screen.getByRole("button", { name: /Simpan Perubahan/ }));

    // The card reflects the new configuration while the note survives the edit.
    await waitFor(() => expect(screen.getByText("Biasa", { selector: "p" })).toBeInTheDocument());
    expect(screen.queryByText("Pedas", { selector: "p" })).not.toBeInTheDocument();
    expect(screen.getByText("Catatan: pedas ya")).toBeInTheDocument();
  });
});
