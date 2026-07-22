import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import type { StorefrontMenuDetailRepository } from "../../catalog/application/storefrontCatalogRepository";
import { useCartCatalogSnapshot } from "./useCartCatalogSnapshot";

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
    options: [],
    sortOrder: 0,
    ...overrides,
  };
}

function createRepository(overrides: Partial<StorefrontMenuDetailRepository> = {}) {
  return {
    listMenus: vi.fn().mockResolvedValue([createMenu()]),
    listCategories: vi.fn().mockResolvedValue([createCategory()]),
    listVariantGroups: vi.fn().mockResolvedValue([createGroup()]),
    ...overrides,
  } satisfies StorefrontMenuDetailRepository;
}

describe("useCartCatalogSnapshot", () => {
  it("loads visible menus, categories, and variant groups into one snapshot", async () => {
    const repository = createRepository();
    const { result } = renderHook(() => useCartCatalogSnapshot(repository));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(repository.listMenus).toHaveBeenCalledWith({ visibility: "visible" });
    expect(
      result.current.status === "ready" && result.current.snapshot.menus.map((menu) => menu.id),
    ).toEqual(["m1"]);
    expect(
      result.current.status === "ready" &&
        result.current.snapshot.categories.map((category) => category.id),
    ).toEqual(["cat-1"]);
    expect(
      result.current.status === "ready" &&
        result.current.snapshot.variantGroups.map((group) => group.id),
    ).toEqual(["vg-1"]);
  });

  it("transitions to error and retries a fresh load", async () => {
    const listMenus = vi
      .fn<StorefrontMenuDetailRepository["listMenus"]>()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([createMenu()]);
    const repository = createRepository({ listMenus });

    const { result } = renderHook(() => useCartCatalogSnapshot(repository));
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => {
      if (result.current.status === "error") result.current.retry();
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(listMenus).toHaveBeenCalledTimes(2);
  });

  it("resets to loading and reloads when the repository changes", async () => {
    const first = createRepository();
    const second = createRepository({
      listMenus: vi.fn().mockResolvedValue([createMenu({ id: "m2" })]),
    });

    const { result, rerender } = renderHook(
      ({ repository }) => useCartCatalogSnapshot(repository),
      { initialProps: { repository: first } },
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    rerender({ repository: second });
    expect(result.current.status).toBe("loading");
    await waitFor(() => {
      expect(
        result.current.status === "ready" && result.current.snapshot.menus.map((menu) => menu.id),
      ).toEqual(["m2"]);
    });
  });
});
