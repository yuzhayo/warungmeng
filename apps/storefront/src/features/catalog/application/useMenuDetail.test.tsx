import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import type { StorefrontMenuDetailRepository } from "./storefrontCatalogRepository";
import { useMenuDetail } from "./useMenuDetail";

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
    listVariantGroups: vi.fn().mockResolvedValue([]),
    ...overrides,
  } satisfies StorefrontMenuDetailRepository;
}

describe("useMenuDetail", () => {
  it("requests visible menus and resolves the slug to ready state", async () => {
    const repository = createRepository();
    const { result } = renderHook(() => useMenuDetail("nasi-goreng", repository));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(repository.listMenus).toHaveBeenCalledWith({ visibility: "visible" });
    expect(result.current.status === "ready" && result.current.menu.id).toBe("m1");
  });

  it("keeps referenced variant groups in menu order and reports missing ones", async () => {
    const g1 = createGroup({ id: "vg-1" });
    const g2 = createGroup({ id: "vg-2" });
    const repository = createRepository({
      listMenus: vi
        .fn()
        .mockResolvedValue([createMenu({ variantGroupIds: ["vg-2", "vg-1", "vg-404"] })]),
      listVariantGroups: vi.fn().mockResolvedValue([g1, g2]),
    });

    const { result } = renderHook(() => useMenuDetail("nasi-goreng", repository));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(
      result.current.status === "ready" && result.current.variantGroups.map((group) => group.id),
    ).toEqual(["vg-2", "vg-1"]);
    expect(result.current.status === "ready" && result.current.missingGroupIds).toEqual(["vg-404"]);
  });

  it("reports not-found for a missing slug", async () => {
    const repository = createRepository();
    const { result } = renderHook(() => useMenuDetail("tidak-ada", repository));

    await waitFor(() => expect(result.current.status).toBe("not-found"));
  });

  it("reports not-found for a menu in a hidden category", async () => {
    const repository = createRepository({
      listCategories: vi.fn().mockResolvedValue([createCategory({ visibility: "hidden" })]),
    });

    const { result } = renderHook(() => useMenuDetail("nasi-goreng", repository));
    await waitFor(() => expect(result.current.status).toBe("not-found"));
  });

  it("transitions to error and retries a fresh load", async () => {
    const listMenus = vi
      .fn<StorefrontMenuDetailRepository["listMenus"]>()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([createMenu()]);
    const repository = createRepository({ listMenus });

    const { result } = renderHook(() => useMenuDetail("nasi-goreng", repository));
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => {
      if (result.current.status === "error") result.current.retry();
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(listMenus).toHaveBeenCalledTimes(2);
  });

  it("reloads when the slug changes and ignores the stale result", async () => {
    const repository = createRepository({
      listMenus: vi
        .fn()
        .mockResolvedValue([
          createMenu(),
          createMenu({ id: "m2", name: "Mie Ayam", slug: "mie-ayam" }),
        ]),
    });

    const { result, rerender } = renderHook(({ slug }) => useMenuDetail(slug, repository), {
      initialProps: { slug: "nasi-goreng" },
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    rerender({ slug: "mie-ayam" });
    await waitFor(() => {
      expect(result.current.status === "ready" && result.current.menu.id).toBe("m2");
    });

    expect(result.current.status === "ready" && result.current.menu.slug).toBe("mie-ayam");
  });
});
