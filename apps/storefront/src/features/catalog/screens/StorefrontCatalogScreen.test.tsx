import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MenuCategory, MenuItem } from "@warungmeng/domain";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StorefrontCatalogScreen } from "./StorefrontCatalogScreen";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import * as useStorefrontCatalogModule from "../application/useStorefrontCatalog";
import type { StorefrontCatalogRepository } from "../application/storefrontCatalogRepository";
import { StorefrontHeader } from "../../../components/layout/StorefrontHeader";

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

const m1 = createMenu({ id: "m1", name: "Nasi Goreng", categoryId: "cat-1", sortOrder: 0 });
const m2 = createMenu({ id: "m2", name: "Mie Ayam", categoryId: "cat-1", sortOrder: 1 });
const m3 = createMenu({ id: "m3", name: "Es Teh", categoryId: "cat-2", sortOrder: 2 });
const mUnavail = createMenu({
  id: "m4",
  name: "Kosong",
  categoryId: "cat-1",
  sortOrder: 3,
  availability: { status: "unavailable", unavailableUntil: null },
});
const cat1 = createCategory({ id: "cat-1", name: "Makanan" });
const cat2 = createCategory({ id: "cat-2", name: "Minuman" });

const actualUseStorefrontCatalog = useStorefrontCatalogModule.useStorefrontCatalog;
const mockUseStorefrontCatalog = vi.spyOn(useStorefrontCatalogModule, "useStorefrontCatalog");

function renderWithI18n(ui: React.ReactElement) {
  return render(<WarungMengI18nProvider storage={null}>{ui}</WarungMengI18nProvider>);
}

describe("StorefrontCatalogScreen", () => {
  afterEach(() => {
    mockUseStorefrontCatalog.mockReset();
  });

  it("shows loading skeleton initially", () => {
    mockUseStorefrontCatalog.mockReturnValue({ status: "loading" });

    const { container } = renderWithI18n(<StorefrontCatalogScreen />);
    const skeletons = container.querySelectorAll(".ant-skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.getByRole("status", { name: "Memuat katalog..." })).toBeInTheDocument();
  });

  it("shows error alert and invokes retry", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    mockUseStorefrontCatalog.mockReturnValue({ status: "error", retry });

    renderWithI18n(<StorefrontCatalogScreen />);

    expect(screen.getByText("Gagal memuat katalog")).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: "Coba Lagi" });
    await user.click(retryButton);
    expect(retry).toHaveBeenCalledOnce();
  });

  it("shows featured tab content when data ready", () => {
    mockUseStorefrontCatalog.mockReturnValue({
      status: "ready",
      menus: [m1, m2, m3],
      categories: [cat1, cat2],
    });

    renderWithI18n(<StorefrontCatalogScreen />);

    expect(screen.getByText("WARUNG MENG")).toBeInTheDocument();
    expect(screen.getByText("Pilihan Warung Meng")).toBeInTheDocument();
  });

  it("shows search results when query is entered", async () => {
    const user = userEvent.setup();
    mockUseStorefrontCatalog.mockReturnValue({
      status: "ready",
      menus: [m1, m2, m3],
      categories: [cat1, cat2],
    });

    renderWithI18n(<StorefrontCatalogScreen />);

    const searchInput = screen.getByPlaceholderText("Cari menu atau deskripsi");
    await user.type(searchInput, "Es Teh");

    expect(screen.getByText("Es Teh")).toBeInTheDocument();
  });

  it("shows empty state when no results match", async () => {
    const user = userEvent.setup();
    mockUseStorefrontCatalog.mockReturnValue({
      status: "ready",
      menus: [m1, m2],
      categories: [cat1],
    });

    renderWithI18n(<StorefrontCatalogScreen />);

    const searchInput = screen.getByPlaceholderText("Cari menu atau deskripsi");
    await user.type(searchInput, "zzznonexistent");

    expect(screen.getByText(/Tidak ada hasil/)).toBeInTheDocument();
  });

  it("shows unavailable label for unavailable items", async () => {
    const user = userEvent.setup();
    const catWithMenu = createCategory({ id: "cat-1", name: "Makanan" });
    mockUseStorefrontCatalog.mockReturnValue({
      status: "ready",
      menus: [m1, mUnavail],
      categories: [catWithMenu],
    });

    renderWithI18n(<StorefrontCatalogScreen />);

    // Navigate to category tab to see unavailable item
    await user.click(screen.getByText("Makanan"));

    expect(screen.getByText("Tidak Tersedia")).toBeInTheDocument();
  });

  it("does not show Phase 02 controls", () => {
    mockUseStorefrontCatalog.mockReturnValue({
      status: "ready",
      menus: [m1],
      categories: [cat1],
    });

    renderWithI18n(<StorefrontCatalogScreen />);

    expect(screen.queryByText("Tambah")).toBeNull();
    expect(screen.queryByText("+")).toBeNull();
    expect(screen.queryByText("Beli")).toBeNull();
  });

  it("formats price using Rupiah with id-ID separator", () => {
    mockUseStorefrontCatalog.mockReturnValue({
      status: "ready",
      menus: [m1],
      categories: [cat1],
    });

    const { container } = renderWithI18n(<StorefrontCatalogScreen />);

    const priceElement = container.querySelector('[class*="cardPrice"]');
    expect(priceElement).not.toBeNull();
    expect(priceElement?.textContent).toContain("25.000");
  });

  it("translates UI chrome without translating business data or Rupiah format", async () => {
    const user = userEvent.setup();
    mockUseStorefrontCatalog.mockReturnValue({
      status: "ready",
      menus: [m1],
      categories: [cat1],
    });

    renderWithI18n(
      <>
        <StorefrontHeader />
        <StorefrontCatalogScreen />
      </>,
    );

    expect(screen.getByLabelText("Pilih bahasa")).toBeInTheDocument();
    await user.click(screen.getByText("English"));

    expect(screen.getByLabelText("Choose language")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search menu or description")).toBeInTheDocument();
    expect(screen.getAllByText("Comfortable Food Stall")).toHaveLength(2);
    expect(screen.getByText("Nasi Goreng")).toBeInTheDocument();
    expect(screen.getByText("Makanan")).toBeInTheDocument();
    expect(screen.getByText(/25\.000/)).toBeInTheDocument();
  });

  it("shows an accessible localized fallback when a menu image fails", () => {
    const imageMenu = createMenu({
      image: { url: "/missing-image.jpg", alt: "Nasi goreng" },
    });
    mockUseStorefrontCatalog.mockReturnValue({
      status: "ready",
      menus: [imageMenu],
      categories: [cat1],
    });

    renderWithI18n(<StorefrontCatalogScreen />);
    fireEvent.error(screen.getByRole("img", { name: "Nasi goreng" }));

    expect(screen.getByRole("img", { name: "Gambar tidak tersedia" })).toBeInTheDocument();
  });

  it("renders category tabs from business data", () => {
    mockUseStorefrontCatalog.mockReturnValue({
      status: "ready",
      menus: [m1, m2, m3],
      categories: [cat1, cat2],
    });

    renderWithI18n(<StorefrontCatalogScreen />);

    expect(screen.getByText("Makanan")).toBeInTheDocument();
    expect(screen.getByText("Minuman")).toBeInTheDocument();
  });

  it("keeps search and category changes local without refetching", async () => {
    const user = userEvent.setup();
    mockUseStorefrontCatalog.mockImplementation(actualUseStorefrontCatalog);
    const repository: StorefrontCatalogRepository = {
      listMenus: vi.fn().mockResolvedValue([m1, m2, m3]),
      listCategories: vi.fn().mockResolvedValue([cat1, cat2]),
    };

    renderWithI18n(<StorefrontCatalogScreen repository={repository} />);
    await screen.findByText("Pilihan Warung Meng");

    await user.click(screen.getByRole("tab", { name: "Makanan" }));
    await user.type(screen.getByLabelText("Cari menu"), "Mie");

    expect(screen.getByText("Mie Ayam")).toBeInTheDocument();
    expect(repository.listMenus).toHaveBeenCalledOnce();
    expect(repository.listCategories).toHaveBeenCalledOnce();
  });
});
