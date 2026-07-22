import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App as AntdApp } from "antd";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { StorefrontCartProvider } from "../../cart/application/StorefrontCartProvider";
import { useStorefrontCart } from "../../cart/application/storefrontCartContext";
import type { StorefrontMenuDetailRepository } from "../application/storefrontCatalogRepository";
import { MenuDetailScreen } from "./MenuDetailScreen";

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
      {
        id: "opt-habis",
        name: "Ekstra Ayam",
        priceAdjustment: { amount: 5000, currency: "IDR" },
        availability: { status: "unavailable", unavailableUntil: null },
        inventory: { mode: "untracked" },
        sortOrder: 2,
      },
    ],
    sortOrder: 0,
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

function CartProbe() {
  const { items } = useStorefrontCart();
  return (
    <div data-testid="cart-probe">
      {items.map((item) => (
        <div key={item.id} data-testid="cart-line">
          {`${item.name}|qty=${item.quantity}|note=${item.note}|opts=${item.variantSelections
            .map((selection) => selection.optionId)
            .sort()
            .join(",")}`}
        </div>
      ))}
    </div>
  );
}

function MenuRouteSwitcher() {
  const navigate = useNavigate();
  return <button onClick={() => navigate("/menu/mie-ayam")}>Buka Mie Ayam</button>;
}

let idCounter = 0;

function renderDetail(repository: StorefrontMenuDetailRepository, slug = "nasi-goreng") {
  return render(
    <WarungMengI18nProvider storage={null}>
      <AntdApp>
        <StorefrontCartProvider storage={null} createItemId={() => `test-id-${++idCounter}`}>
          <MemoryRouter initialEntries={[`/menu/${slug}`]}>
            <Routes>
              <Route
                path="/menu/:menuSlug"
                element={<MenuDetailScreen repository={repository} />}
              />
            </Routes>
          </MemoryRouter>
          <CartProbe />
        </StorefrontCartProvider>
      </AntdApp>
    </WarungMengI18nProvider>,
  );
}

describe("MenuDetailScreen", () => {
  it("renders menu identity and enabled CTA for a menu without variants", async () => {
    renderDetail(createRepository());

    expect(await screen.findByRole("heading", { name: "Nasi Goreng" })).toBeInTheDocument();
    expect(screen.getByText("Nasi goreng spesial")).toBeInTheDocument();
    const cta = screen.getByRole("button", { name: /Tambah ke Keranjang/ });
    expect(cta).toBeEnabled();
    expect(cta).toHaveTextContent("Rp 25.000");
  });

  it("shows a customer-safe not-found state for a missing slug", async () => {
    renderDetail(createRepository(), "tidak-ada");

    expect(await screen.findByText("Menu tidak ditemukan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kembali ke Katalog" })).toBeInTheDocument();
  });

  it("shows not-found for a hidden menu requested directly", async () => {
    const repository = createRepository({
      listMenus: vi.fn().mockResolvedValue([]),
    });

    renderDetail(repository);
    expect(await screen.findByText("Menu tidak ditemukan")).toBeInTheDocument();
  });

  it("disables the CTA until an exact-1 group has a selection and updates the price", async () => {
    const user = userEvent.setup();
    const repository = createRepository({
      listMenus: vi.fn().mockResolvedValue([createMenu({ variantGroupIds: ["vg-1"] })]),
      listVariantGroups: vi.fn().mockResolvedValue([createGroup()]),
    });

    renderDetail(repository);

    const cta = await screen.findByRole("button", { name: /Tambah ke Keranjang/ });
    expect(cta).toBeDisabled();
    expect(screen.getByText("Pilih 1")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /Pedas/ }));

    expect(cta).toBeEnabled();
    expect(cta).toHaveTextContent("Rp 27.000");
  });

  it("disables unavailable options and marks them with text", async () => {
    const repository = createRepository({
      listMenus: vi.fn().mockResolvedValue([createMenu({ variantGroupIds: ["vg-1"] })]),
      listVariantGroups: vi.fn().mockResolvedValue([createGroup()]),
    });

    renderDetail(repository);

    const unavailable = await screen.findByRole("radio", { name: /Ekstra Ayam/ });
    expect(unavailable).toBeDisabled();
    expect(screen.getByText("Tidak Tersedia")).toBeInTheDocument();
  });

  it("resets configurator draft state when the route changes to another menu", async () => {
    const user = userEvent.setup();
    const repository = createRepository({
      listMenus: vi.fn().mockResolvedValue([
        createMenu({ variantGroupIds: ["vg-1"] }),
        createMenu({
          id: "m2",
          name: "Mie Ayam",
          slug: "mie-ayam",
          variantGroupIds: ["vg-1"],
        }),
      ]),
      listVariantGroups: vi.fn().mockResolvedValue([createGroup()]),
    });

    render(
      <WarungMengI18nProvider storage={null}>
        <AntdApp>
          <StorefrontCartProvider storage={null}>
            <MemoryRouter initialEntries={["/menu/nasi-goreng"]}>
              <MenuRouteSwitcher />
              <Routes>
                <Route
                  path="/menu/:menuSlug"
                  element={<MenuDetailScreen repository={repository} />}
                />
              </Routes>
            </MemoryRouter>
          </StorefrontCartProvider>
        </AntdApp>
      </WarungMengI18nProvider>,
    );

    await user.click(await screen.findByRole("radio", { name: /Pedas/ }));
    expect(screen.getByRole("radio", { name: /Pedas/ })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Buka Mie Ayam" }));

    expect(await screen.findByRole("heading", { name: "Mie Ayam" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("radio", { name: /Pedas/ })).not.toBeChecked());
  });

  it("shows warning and keeps CTA disabled when a referenced group is missing", async () => {
    const repository = createRepository({
      listMenus: vi.fn().mockResolvedValue([createMenu({ variantGroupIds: ["vg-404"] })]),
      listVariantGroups: vi.fn().mockResolvedValue([]),
    });

    renderDetail(repository);

    expect(await screen.findByText("Sebagian pilihan menu belum dapat dimuat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tambah ke Keranjang/ })).toBeDisabled();
  });

  it("keeps CTA disabled for an unavailable menu", async () => {
    const repository = createRepository({
      listMenus: vi
        .fn()
        .mockResolvedValue([
          createMenu({ availability: { status: "unavailable", unavailableUntil: null } }),
        ]),
    });

    renderDetail(repository);

    expect(await screen.findByText("Menu ini sedang tidak tersedia")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tambah ke Keranjang/ })).toBeDisabled();
  });

  it("steps quantity within bounds and multiplies the total", async () => {
    const user = userEvent.setup();
    const repository = createRepository({
      listMenus: vi
        .fn()
        .mockResolvedValue([createMenu({ inventory: { mode: "tracked", quantity: 2 } })]),
    });

    renderDetail(repository);

    const cta = await screen.findByRole("button", { name: /Tambah ke Keranjang/ });
    const decrease = screen.getByRole("button", { name: "Kurangi jumlah Nasi Goreng" });
    const increase = screen.getByRole("button", { name: "Tambah jumlah Nasi Goreng" });

    expect(decrease).toBeDisabled();
    await user.click(increase);
    expect(cta).toHaveTextContent("Rp 50.000");
    expect(increase).toBeDisabled();
    await user.click(decrease);
    expect(cta).toHaveTextContent("Rp 25.000");
  });

  it("adds the configured item to the cart and merges an identical repeat", async () => {
    const user = userEvent.setup();
    const repository = createRepository({
      listMenus: vi.fn().mockResolvedValue([createMenu({ variantGroupIds: ["vg-1"] })]),
      listVariantGroups: vi.fn().mockResolvedValue([createGroup()]),
    });

    renderDetail(repository);

    await user.click(await screen.findByRole("radio", { name: /Pedas/ }));
    const cta = screen.getByRole("button", { name: /Tambah ke Keranjang/ });
    await user.click(cta);
    await user.click(cta);

    const lines = screen.getAllByTestId("cart-line");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveTextContent("Nasi Goreng|qty=2|note=|opts=opt-pedas");
  });

  it("stores note and different variants as separate cart lines", async () => {
    const user = userEvent.setup();
    const repository = createRepository({
      listMenus: vi.fn().mockResolvedValue([createMenu({ variantGroupIds: ["vg-1"] })]),
      listVariantGroups: vi.fn().mockResolvedValue([createGroup()]),
    });

    renderDetail(repository);

    await user.click(await screen.findByRole("radio", { name: /Biasa/ }));
    await user.click(screen.getByRole("button", { name: /Tambah ke Keranjang/ }));

    await user.click(screen.getByRole("button", { name: "Tambah Catatan" }));
    await user.type(screen.getByRole("textbox", { name: "Catatan" }), "tidak pakai bawang");
    await user.click(screen.getByRole("button", { name: "Simpan" }));
    // The closed modal can linger in jsdom, so assert the visible preview paragraph.
    await waitFor(() =>
      expect(screen.getByText("tidak pakai bawang", { selector: "p" })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /Tambah ke Keranjang/ }));

    const lines = screen.getAllByTestId("cart-line");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveTextContent("note=|opts=opt-biasa");
    expect(lines[1]).toHaveTextContent("note=tidak pakai bawang|opts=opt-biasa");
  });

  it("cancelling the note dialog preserves the previous note", async () => {
    const user = userEvent.setup();
    renderDetail(createRepository());

    await user.click(await screen.findByRole("button", { name: "Tambah Catatan" }));
    await user.type(screen.getByRole("textbox", { name: "Catatan" }), "draf pertama");
    await user.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(screen.getByText("draf pertama", { selector: "p" })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Ubah Catatan" }));
    const reopened = await screen.findAllByRole("textbox", { name: "Catatan" });
    await user.type(reopened[reopened.length - 1]!, " diubah");
    await user.click(screen.getByRole("button", { name: "Batal" }));

    // The saved note stays; the cancelled draft never reaches the visible preview.
    expect(screen.getByText("draf pertama", { selector: "p" })).toBeInTheDocument();
    expect(screen.queryByText(/diubah/, { selector: "p" })).toBeNull();
  });
});
