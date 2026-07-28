import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AdminRuntimeProvider } from "../composition/AdminRuntimeProvider";
import type { AdminRuntime } from "../composition/adminRuntime";
import { createAdminCapabilities } from "../composition/createAdminCapabilities";
import { createAdminRepositories } from "../composition/createAdminRepositories";
import { createMemoryPosSessionStorageAdapter } from "../composition/createAdminStorageAdapters";
import { createAdminRuntime } from "../composition/createAdminRuntime";
import { createAdminModuleCandidates } from "../discovery/adminModuleCandidates";
import {
  InventoryHppRouteAdapter,
  OrderListRouteAdapter,
  PosCashierRouteAdapter,
} from "./adminCapabilityRouteAdapters";

const activeRuntimes = new Set<AdminRuntime>();

afterEach(async () => {
  await Promise.all([...activeRuntimes].map((runtime) => runtime.dispose()));
  activeRuntimes.clear();
});

function createRuntime(failModule?: string): AdminRuntime {
  const repositories = createAdminRepositories();
  const capabilities = createAdminCapabilities({
    repositories,
    storage: { posSessionStorage: createMemoryPosSessionStorageAdapter() },
  });
  const candidates = createAdminModuleCandidates({ repositories, capabilities }).map((candidate) =>
    candidate.source === failModule
      ? {
          ...candidate,
          load: () => {
            throw new Error(`${failModule} failed to load`);
          },
        }
      : candidate,
  );
  const runtime = createAdminRuntime({ repositories, capabilities, candidates });
  activeRuntimes.add(runtime);
  return runtime;
}

function renderWithRuntime(runtime: AdminRuntime, children: ReactNode) {
  return render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <AdminRuntimeProvider runtime={runtime}>
          <MemoryRouter>{children}</MemoryRouter>
        </AdminRuntimeProvider>
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );
}

describe("adminCapabilityRouteAdapters", () => {
  it("shows a loading state, then renders the Orders screen with runtime-owned data", async () => {
    const runtime = createRuntime();
    renderWithRuntime(runtime, <OrderListRouteAdapter />);

    // Before the runtime settles, the adapter renders the shared route
    // loading state instead of an error.
    expect(screen.getByRole("status", { name: "Memuat halaman" })).toBeInTheDocument();

    expect(await screen.findByRole("heading", { name: "Manajemen Pesanan" })).toBeInTheDocument();
    expect(await screen.findByText("WM-1008")).toBeInTheDocument();
  });

  it("shows the explicit unavailable state when the Orders module failed to register", async () => {
    const runtime = createRuntime("admin.orders");
    renderWithRuntime(runtime, <OrderListRouteAdapter />);

    await waitFor(() => expect(runtime.getSnapshot().status).toBe("ready"));
    expect(await screen.findByText("Pesanan gagal dimuat.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Manajemen Pesanan" })).not.toBeInTheDocument();
    // Other slices remain published — only the failed module is withheld.
    expect(runtime.capabilities.pos).toBeDefined();
    expect(runtime.capabilities.orders).toBeUndefined();
  });

  it("renders the POS cashier through the injected session, cart, and checkout capabilities", async () => {
    const runtime = createRuntime();
    renderWithRuntime(runtime, <PosCashierRouteAdapter />);

    expect(await screen.findByRole("heading", { name: "POS Kasir" })).toBeInTheDocument();
    expect(await screen.findByText("Sesi Kasir")).toBeInTheDocument();
  });

  it("renders Inventory HPP only when both inventory and catalog capabilities exist", async () => {
    const runtime = createRuntime();
    await expect(runtime.repositories.menuCatalog.listMenus()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "GADO-GADO" })]),
    );
    await runtime.initialize();
    expect(runtime.capabilities.catalog).toBe(runtime.repositories.menuCatalog);
    await expect(runtime.capabilities.catalog?.listMenus()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "GADO-GADO" })]),
    );
    renderWithRuntime(runtime, <InventoryHppRouteAdapter />);
    expect(await screen.findByText("GADO-GADO")).toBeInTheDocument();

    const degraded = createRuntime("admin.menu");
    renderWithRuntime(degraded, <InventoryHppRouteAdapter />);
    await waitFor(() => expect(degraded.getSnapshot().status).toBe("ready"));
    expect(await screen.findByText("Data HPP gagal dimuat.")).toBeInTheDocument();
  });
});
