import {
  createWarungMengFinanceRepository,
  createWarungMengOrderRepository,
} from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FinanceExpenseScreen } from "../screens/FinanceExpenseScreen";

function renderScreen() {
  const financeRepository = createWarungMengFinanceRepository();
  const orderRepository = createWarungMengOrderRepository();
  return render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <MemoryRouter>
          <FinanceExpenseScreen
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

describe("FinanceExpenseScreen", () => {
  it("shows only outflows and reuses the category breakdown and ledger table", async () => {
    renderScreen();

    expect(await screen.findByText("Belanja bahan baku harian")).toBeInTheDocument();
    expect(screen.queryByText("Modal awal kas operasional")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Penjualan WM-/)).not.toBeInTheDocument();
    expect(screen.getByText("Total Pengeluaran")).toBeInTheDocument();
    expect(screen.getByText("Pengeluaran per Kategori")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Catat Pengeluaran/ }).length).toBeGreaterThan(0);
  });
});
