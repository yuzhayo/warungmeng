import {
  createWarungMengFinanceRepository,
  createWarungMengOrderRepository,
} from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FinanceOverviewScreen } from "../screens/FinanceOverviewScreen";

function renderScreen() {
  const financeRepository = createWarungMengFinanceRepository();
  const orderRepository = createWarungMengOrderRepository();
  return render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <MemoryRouter>
          <FinanceOverviewScreen
            finance={{
              listOrders: (query) => orderRepository.listOrders(query),
              listManualTransactions: (query) => financeRepository.listManualTransactions(query),
            }}
            record={financeRepository}
            referenceDate={dayjs("2026-07-20T12:00:00")}
          />
        </MemoryRouter>
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );
}

describe("FinanceOverviewScreen", () => {
  it("renders selector-driven KPIs, breakdowns, and recent transactions", async () => {
    renderScreen();

    expect(await screen.findByText("Tagihan listrik bulan berjalan")).toBeInTheDocument();
    expect(screen.getByText("Total Pemasukan")).toBeInTheDocument();
    expect(screen.getByText("Total Pengeluaran")).toBeInTheDocument();
    expect(screen.getByText("Arus Kas Bersih")).toBeInTheDocument();
    expect(screen.getByText("Saldo Tunai")).toBeInTheDocument();
    expect(screen.getByText("Ringkasan Metode Pembayaran")).toBeInTheDocument();
    expect(screen.getByText("Pengeluaran per Kategori")).toBeInTheDocument();
    expect(screen.getByText("Transaksi Terbaru")).toBeInTheDocument();
  });

  it("keeps presets and the custom range control synchronized", async () => {
    const user = userEvent.setup();
    renderScreen();
    await screen.findByText("Tagihan listrik bulan berjalan");

    const todayOption = screen.getByRole("radio", { name: "Hari Ini" }).closest("label");
    expect(todayOption).not.toBeNull();
    await user.click(todayOption!);
    await waitFor(() => {
      const rangeInputs = screen.getAllByLabelText("Rentang tanggal") as HTMLInputElement[];
      expect(rangeInputs.map((input) => input.value)).toEqual(["2026-07-20", "2026-07-20"]);
    });
  });
});
