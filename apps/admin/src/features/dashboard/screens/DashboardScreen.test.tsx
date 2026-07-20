import {
  createWarungMengFinanceRepository,
  createWarungMengInventoryRepository,
  createWarungMengMockRepository,
  createWarungMengOrderRepository,
} from "@warungmeng/data";
import {
  LANGUAGE_STORAGE_KEY,
  REGIONAL_FORMAT_STORAGE_KEY,
  WarungMengI18nProvider,
  type LocalePreferenceStorage,
} from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { DashboardReportRepositories } from "../application/dashboardReportData.core";
import type { DashboardReportDataResult } from "../application/useDashboardReportData";
import { DashboardDataState } from "../components/DashboardDataState";
import { DashboardOverviewScreen } from "./DashboardOverviewScreen";
import { DashboardReportsScreen } from "./DashboardReportsScreen";
import { DashboardScreen } from "./DashboardScreen";

const clock = () => new Date("2026-07-20T12:00:00.000Z");

function repositories(): DashboardReportRepositories {
  return {
    orders: createWarungMengOrderRepository(),
    finance: createWarungMengFinanceRepository(),
    inventory: createWarungMengInventoryRepository(),
    catalog: createWarungMengMockRepository(),
  };
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function createStorage(language: "id" | "en" = "id"): LocalePreferenceStorage {
  const values = new Map([
    [LANGUAGE_STORAGE_KEY, language],
    [REGIONAL_FORMAT_STORAGE_KEY, "id-ID"],
  ]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

function renderDashboard(
  initialEntry = "/?period=last-30-days&source=test",
  language: "id" | "en" = "id",
) {
  return render(
    <WarungMengI18nProvider storage={createStorage(language)}>
      <AdminUiProvider storage={null}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route element={<DashboardScreen clock={clock} repositories={repositories()} />}>
              <Route index element={<DashboardOverviewScreen />} />
              <Route path="reports" element={<DashboardReportsScreen />} />
            </Route>
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );
}

const period = {
  startDate: "2026-07-20",
  endDate: "2026-07-20",
  timeZone: "Asia/Jakarta",
} as const;

function renderDataState(data: DashboardReportDataResult, missingCostItemCount = 0) {
  return render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <DashboardDataState data={data} isEmpty={false} missingCostItemCount={missingCostItemCount}>
          <div>ready content</div>
        </DashboardDataState>
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );
}

describe("DashboardScreen", () => {
  it("renders the selector-driven overview and keeps Rupiah formatting in Indonesian", async () => {
    renderDashboard();

    expect(screen.getByRole("heading", { name: "Dashboard & Laporan" })).toBeInTheDocument();
    expect(await screen.findByText("Omzet Bersih")).toBeInTheDocument();
    expect(screen.getAllByText(/Rp\s*[\d.]+/).length).toBeGreaterThan(0);
  });

  it("preserves the period query when navigating to the reports screen", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText("Omzet Bersih");

    await user.click(screen.getByRole("tab", { name: "Laporan" }));

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/reports?period=last-30-days&source=test",
    );
    expect(screen.getByRole("tab", { name: "Penjualan" })).toHaveAttribute("aria-selected", "true");
  });

  it("renders English labels without changing the Rupiah regional format", async () => {
    renderDashboard("/?period=last-30-days", "en");

    expect(screen.getByRole("heading", { name: "Dashboard & Reports" })).toBeInTheDocument();
    expect(await screen.findByText("Net Revenue")).toBeInTheDocument();
    expect(screen.getAllByText(/Rp\s*[\d.]+/).length).toBeGreaterThan(0);
  });

  it("switches report views while preserving period, custom dates, and unrelated queries", async () => {
    const user = userEvent.setup();
    renderDashboard(
      "/reports?period=custom&from=2026-07-01&to=2026-07-20&source=test&report=sales",
    );

    await screen.findByRole("tab", { name: "Penjualan" });
    await user.click(screen.getByRole("tab", { name: "Performa Menu" }));

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/reports?period=custom&from=2026-07-01&to=2026-07-20&source=test&report=menu",
    );
    expect(screen.getByRole("tab", { name: "Performa Menu" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByText("Performa Kategori")).toBeInTheDocument();
  });

  it("falls back to the sales report for an unknown report query", async () => {
    renderDashboard("/reports?period=last-30-days&report=unknown");

    expect(await screen.findByRole("tab", { name: "Penjualan" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByText("Penjualan Harian")).toBeInTheDocument();
  });

  it("renders English report labels while retaining Indonesian Rupiah separators", async () => {
    renderDashboard("/reports?period=last-30-days&report=menu", "en");

    expect(await screen.findByRole("tab", { name: "Menu Performance" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByText("Category Performance")).toBeInTheDocument();
    expect(screen.getAllByText(/Rp\s*[\d.]+/).length).toBeGreaterThan(0);
  });
});

describe("DashboardDataState", () => {
  it("renders a fatal error and retries", async () => {
    const retry = vi.fn();
    const user = userEvent.setup();
    renderDataState({
      status: "error",
      period,
      snapshot: null,
      failedSources: ["orders", "finance", "inventory", "catalog"],
      errors: {},
      retrying: false,
      retry,
    });

    expect(screen.getByText("Dashboard gagal dimuat")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Coba Lagi" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("keeps available content visible with partial and missing-cost warnings", () => {
    renderDataState(
      {
        status: "partial",
        period,
        snapshot: null,
        failedSources: ["inventory"],
        errors: {},
        retrying: false,
        retry: vi.fn(),
      },
      2,
    );

    expect(screen.getByText("Sebagian data belum tersedia")).toBeInTheDocument();
    expect(screen.getByText("inventory dan HPP")).toBeInTheDocument();
    expect(screen.getByText("Estimasi margin belum lengkap")).toBeInTheDocument();
    expect(screen.getByText("ready content")).toBeInTheDocument();
  });

  it("shows the loading skeleton before content", () => {
    const { container } = renderDataState({
      status: "loading",
      period,
      snapshot: null,
      failedSources: [],
      errors: {},
      retrying: false,
      retry: vi.fn(),
    });

    expect(container.querySelectorAll(".ant-skeleton").length).toBeGreaterThan(0);
    expect(screen.queryByText("ready content")).not.toBeInTheDocument();
  });
});
