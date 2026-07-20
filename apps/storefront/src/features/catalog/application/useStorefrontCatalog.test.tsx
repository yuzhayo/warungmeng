import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MenuCategory, MenuItem } from "@warungmeng/domain";
import type { StorefrontCatalogRepository } from "./storefrontCatalogRepository";
import { useStorefrontCatalog } from "./useStorefrontCatalog";

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

function createRepository(
  menus: readonly MenuItem[] | Promise<readonly MenuItem[]> = [],
  categories: readonly MenuCategory[] | Promise<readonly MenuCategory[]> = [],
): StorefrontCatalogRepository {
  return {
    listMenus: vi.fn(() => Promise.resolve(menus)),
    listCategories: vi.fn(() => Promise.resolve(categories)),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const mockMenus = [createMenu()];
const mockCategories = [createCategory()];

describe("useStorefrontCatalog", () => {
  it("starts in loading state and requests visible menus", () => {
    const menus = deferred<readonly MenuItem[]>();
    const repository = createRepository(menus.promise, mockCategories);

    const { result } = renderHook(() => useStorefrontCatalog(repository));

    expect(result.current.status).toBe("loading");
    expect(repository.listMenus).toHaveBeenCalledWith({ visibility: "visible" });
    expect(repository.listCategories).toHaveBeenCalledOnce();
  });

  it("transitions to ready after both repository calls resolve", async () => {
    const repository = createRepository(mockMenus, mockCategories);
    const { result } = renderHook(() => useStorefrontCatalog(repository));

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current).toEqual({
      status: "ready",
      menus: mockMenus,
      categories: mockCategories,
    });
  });

  it("transitions to error when a repository call rejects", async () => {
    const repository = createRepository(Promise.reject(new Error("Network error")));
    const { result } = renderHook(() => useStorefrontCatalog(repository));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.status === "error" && result.current.retry).toEqual(expect.any(Function));
  });

  it("retry starts exactly one fresh load", async () => {
    const listMenus = vi
      .fn<StorefrontCatalogRepository["listMenus"]>()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(mockMenus);
    const listCategories = vi
      .fn<StorefrontCatalogRepository["listCategories"]>()
      .mockResolvedValue(mockCategories);
    const repository = { listMenus, listCategories };
    const { result } = renderHook(() => useStorefrontCatalog(repository));

    await waitFor(() => expect(result.current.status).toBe("error"));
    act(() => {
      if (result.current.status === "error") result.current.retry();
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(listMenus).toHaveBeenCalledTimes(2);
    expect(listCategories).toHaveBeenCalledTimes(2);
    expect(result.current.status === "ready" && result.current.menus).toEqual(mockMenus);
  });

  it("does not let an older resolution overwrite a newer repository result", async () => {
    const oldMenus = deferred<readonly MenuItem[]>();
    const oldCategories = deferred<readonly MenuCategory[]>();
    const oldRepository = createRepository(oldMenus.promise, oldCategories.promise);
    const newMenu = createMenu({ id: "new", name: "Menu Baru" });
    const newRepository = createRepository([newMenu], mockCategories);
    const { result, rerender } = renderHook(({ repository }) => useStorefrontCatalog(repository), {
      initialProps: { repository: oldRepository },
    });

    rerender({ repository: newRepository });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.status === "ready" && result.current.menus).toEqual([newMenu]);

    await act(async () => {
      oldMenus.resolve([]);
      oldCategories.resolve([]);
      await oldMenus.promise;
    });

    expect(result.current.status === "ready" && result.current.menus).toEqual([newMenu]);
  });

  it("does not let an older rejection overwrite a newer repository result", async () => {
    const oldMenus = deferred<readonly MenuItem[]>();
    const oldRepository = createRepository(oldMenus.promise, mockCategories);
    const newRepository = createRepository(mockMenus, mockCategories);
    const { result, rerender } = renderHook(({ repository }) => useStorefrontCatalog(repository), {
      initialProps: { repository: oldRepository },
    });

    rerender({ repository: newRepository });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      oldMenus.reject(new Error("stale failure"));
      await oldMenus.promise.catch(() => undefined);
    });

    expect(result.current).toEqual({
      status: "ready",
      menus: mockMenus,
      categories: mockCategories,
    });
  });

  it("ignores a pending request after unmount", async () => {
    const menus = deferred<readonly MenuItem[]>();
    const repository = createRepository(menus.promise, mockCategories);
    const { result, unmount } = renderHook(() => useStorefrontCatalog(repository));

    unmount();
    await act(async () => {
      menus.resolve([]);
      await menus.promise;
    });

    expect(result.current.status).toBe("loading");
  });
});
