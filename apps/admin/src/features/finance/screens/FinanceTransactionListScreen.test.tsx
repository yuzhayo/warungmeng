import {
  createWarungMengFinanceRepository,
  createWarungMengOrderRepository,
} from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FinanceTransactionListScreen } from "./FinanceTransactionListScreen";

function renderScreen() {
  const financeRepository = createWarungMengFinanceRepository();
  const orderRepository = createWarungMengOrderRepository();
  const result = render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <MemoryRouter>
          <FinanceTransactionListScreen
            financeRepository={financeRepository}
            orderRepository={orderRepository}
          />
        </MemoryRouter>
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );
  return { financeRepository, ...result };
}

afterEach(() => vi.unstubAllGlobals());

describe("FinanceTransactionListScreen", () => {
  it("renders filters and keeps automatic transactions read-only", async () => {
    renderScreen();

    expect(await screen.findByText("Modal awal kas operasional")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Rentang tanggal")).toHaveLength(2);
    const automaticDescription = (await screen.findAllByText(/^Penjualan WM-/))[0]!;
    const automaticRow = automaticDescription.closest("tr");
    expect(automaticRow).not.toBeNull();
    expect(within(automaticRow!).getByRole("button", { name: /Buka pesanan/ })).toBeInTheDocument();
    expect(within(automaticRow!).queryByRole("button", { name: /Ubah/ })).not.toBeInTheDocument();
    expect(
      within(automaticRow!).queryByRole("button", { name: /Batalkan/ }),
    ).not.toBeInTheDocument();
  });

  it("creates, rehydrates, and voids a manual expense without uploading the file", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { financeRepository } = renderScreen();
    const createSpy = vi.spyOn(financeRepository, "createManualTransaction");
    await screen.findByText("Modal awal kas operasional");

    await user.click(screen.getByRole("button", { name: /Catat Pengeluaran/ }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Catat Transaksi")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Tanggal dan Waktu")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Metode Pembayaran")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Status")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Nomor Referensi (Opsional)")).toBeInTheDocument();

    fireEvent.mouseDown(within(dialog).getByLabelText("Kategori"));
    fireEvent.click(
      await screen.findByText("Bahan Baku", { selector: ".ant-select-item-option-content" }),
    );
    await user.clear(within(dialog).getByLabelText("Nominal"));
    await user.type(within(dialog).getByLabelText("Nominal"), "45000");
    await user.type(within(dialog).getByLabelText("Keterangan"), "Belanja test UI");
    await user.type(within(dialog).getByLabelText("Nomor Referensi (Opsional)"), "UI-001");
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();
    await user.upload(
      fileInput!,
      new File(["receipt"], "receipt.pdf", { type: "application/pdf" }),
    );
    expect(fetchSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Simpan" }));
    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      expect(
        screen.getAllByText("Belanja test UI").some((element) => Boolean(element.closest("tr"))),
      ).toBe(true);
    });
    expect(fetchSpy).not.toHaveBeenCalled();

    const created = (await financeRepository.listManualTransactions()).find(
      (transaction) => transaction.description === "Belanja test UI",
    );
    expect(created).toMatchObject({
      direction: "outflow",
      categoryId: "ingredients",
      amount: { amount: 45_000, currency: "IDR" },
      referenceNumber: "UI-001",
      attachment: { name: "receipt.pdf", mimeType: "application/pdf" },
    });

    await user.click(screen.getByRole("button", { name: "Ubah Belanja test UI" }));
    const editDialog = screen.getByRole("dialog");
    expect(within(editDialog).getByLabelText("Nominal")).toHaveValue("45000");
    expect(within(editDialog).getByLabelText("Keterangan")).toHaveValue("Belanja test UI");
    expect(within(editDialog).getByLabelText("Nomor Referensi (Opsional)")).toHaveValue("UI-001");
    await user.click(within(editDialog).getByRole("button", { name: "Batal" }));

    await user.click(screen.getByRole("button", { name: "Batalkan Belanja test UI" }));
    await user.click(await screen.findByRole("button", { name: "Batalkan Transaksi" }));
    await waitFor(async () => {
      await expect(financeRepository.getManualTransactionById(created!.id)).resolves.toMatchObject({
        status: "voided",
      });
    });
    const auditRow = screen
      .getAllByText("Belanja test UI")
      .map((element) => element.closest("tr"))
      .find(Boolean);
    expect(auditRow).toHaveTextContent("Dibatalkan");
  }, 15_000);
});
