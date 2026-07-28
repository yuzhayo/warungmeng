import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import type { AdminRuntime } from "./app/composition/adminRuntime";
import { createAdminRepositories } from "./app/composition/createAdminRepositories";
import { createAdminRuntime } from "./app/composition/createAdminRuntime";
import { dashboardRepositories } from "./features/dashboard/application/dashboardRepositories";

const activeRuntimes = new Set<AdminRuntime>();

function renderAdminApp(runtime?: AdminRuntime) {
  const repositories = runtime?.repositories ?? createAdminRepositories();
  const activeRuntime = runtime ?? createAdminRuntime({ repositories });
  activeRuntimes.add(activeRuntime);
  return { ...render(<App runtime={activeRuntime} />), repositories, runtime: activeRuntime };
}

function createFailedDashboardRuntime(): AdminRuntime {
  return createAdminRuntime({
    repositories: createAdminRepositories(),
    candidates: [{ source: "dashboard", load: () => ({ manifest: null }) }],
  });
}

afterEach(async () => {
  await Promise.all([...activeRuntimes].map((runtime) => runtime.dispose()));
  activeRuntimes.clear();
});

describe("admin foundation", () => {
  it("registers Dashboard once with the composition-owned repositories", async () => {
    const { repositories, runtime } = renderAdminApp();

    await waitFor(() => expect(runtime.getSnapshot().status).toBe("ready"));
    expect(runtime.registry.list().map(({ id }) => id)).toEqual([
      "admin.dashboard",
      "admin.finance",
      "admin.inventory",
      "admin.menu",
      "admin.orders",
      "admin.pos",
      "admin.settings",
      "admin.settings.business-hours",
      "admin.settings.theme",
    ]);
    expect(runtime.repositories).toBe(repositories);
    expect(dashboardRepositories.orders).toBe(repositories.dashboard.orders);
  });

  it("keeps the Admin shell active while only Dashboard reports startup failure", async () => {
    window.localStorage.clear();
    window.location.hash = "#/settings";
    const runtime = createFailedDashboardRuntime();
    renderAdminApp(runtime);

    expect(await screen.findByText("WARUNG MENG")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Pengaturan" })).toBeInTheDocument();
    expect(runtime.getSnapshot()).toEqual({
      status: "degraded",
      dashboardAvailable: false,
      diagnostics: [
        expect.objectContaining({
          code: "manifest-malformed",
          source: "dashboard",
          surface: "admin",
        }),
      ],
    });

    window.location.hash = "#/";
    expect(await screen.findByText("Dashboard gagal dimuat")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
  });

  it("renders the initial admin route inside the application providers", async () => {
    window.localStorage.clear();
    window.location.hash = "#/";
    renderAdminApp();

    expect(await screen.findByText("WARUNG MENG")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dashboard & Laporan" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
  });

  it("routes Settings through the reusable settings tabs to the theme screen", async () => {
    window.localStorage.clear();
    window.location.hash = "#/settings";
    renderAdminApp();

    expect(await screen.findByRole("heading", { name: "Pengaturan" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tema" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Jam Operasional" })).toBeInTheDocument();
    expect(await screen.findByText("Pilihan Tema")).toBeInTheDocument();
  });

  it("routes Menu through reusable tabs to the variant category list", async () => {
    window.localStorage.clear();
    window.location.hash = "#/menu/variants";
    renderAdminApp();

    expect(await screen.findByRole("heading", { name: "Pengaturan Menu" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Kategori Varian" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByText("BUMBU 50ml")).toBeInTheDocument();
  });

  it("routes Order Management to the order list inside the admin shell", async () => {
    window.localStorage.clear();
    window.location.hash = "#/orders";
    renderAdminApp();

    expect(await screen.findByRole("heading", { name: "Manajemen Pesanan" })).toBeInTheDocument();
    expect(await screen.findByText("WM-1008")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
  });

  it("routes a selected order to its detail screen", async () => {
    window.localStorage.clear();
    window.location.hash = "#/orders/order-1008";
    renderAdminApp();

    expect(await screen.findByRole("heading", { name: "WM-1008" })).toBeInTheDocument();
    expect(screen.getByText("Ringkasan")).toBeInTheDocument();
    expect(screen.getByText("Riwayat Status")).toBeInTheDocument();
  });

  it("routes POS Cashier inside the admin shell", async () => {
    window.localStorage.clear();
    window.location.hash = "#/pos";
    renderAdminApp();

    expect(await screen.findByRole("heading", { name: "POS Kasir" })).toBeInTheDocument();
    expect(screen.getByText("Sesi Kasir")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
  });

  it("routes Inventory through materials, movement, and HPP tabs", async () => {
    window.localStorage.clear();
    window.location.hash = "#/inventory/hpp";
    renderAdminApp();

    expect(await screen.findByRole("heading", { name: "Inventory" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Resep & HPP" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByText("GADO-GADO")).toBeInTheDocument();
  });

  it("redirects Finance to its route-driven overview tab", async () => {
    window.localStorage.clear();
    window.location.hash = "#/finance";
    renderAdminApp();

    expect(await screen.findByRole("heading", { name: "Keuangan" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ringkasan" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByRole("heading", { name: "Ringkasan Keuangan" })).toBeInTheDocument();
  });

  it("selects the Finance transaction tab from the child route", async () => {
    window.localStorage.clear();
    window.location.hash = "#/finance/transactions";
    renderAdminApp();

    expect(await screen.findByRole("heading", { name: "Keuangan" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Transaksi" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByRole("heading", { name: "Daftar Transaksi" })).toBeInTheDocument();
  });
});
