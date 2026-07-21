import { createWarungMengOrderRepository, InMemoryInventoryRepository } from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OrderDetailScreen } from "./OrderDetailScreen";

function renderOrderDetail(orderId = "order-1008") {
  const repository = createWarungMengOrderRepository();
  const inventory = new InMemoryInventoryRepository();
  const result = render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
          <Routes>
            <Route path="/orders" element={<div>ORDER LIST</div>} />
            <Route
              path="/orders/:orderId"
              element={<OrderDetailScreen inventory={inventory} repository={repository} />}
            />
          </Routes>
        </MemoryRouter>
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );

  return { repository, inventory, ...result };
}

describe("OrderDetailScreen", () => {
  it("renders order summary, items, totals, and history", async () => {
    renderOrderDetail();

    expect(await screen.findByRole("heading", { name: "WM-1008" })).toBeInTheDocument();
    expect(screen.getByText("GADO-GADO")).toBeInTheDocument();
    expect(screen.getAllByText(/Rp\s*48\.400/).length).toBeGreaterThan(0);
    expect(screen.getByText("Riwayat Status")).toBeInTheDocument();
  });

  it("persists a valid status transition through the repository", async () => {
    const user = userEvent.setup();
    const { repository } = renderOrderDetail();
    await screen.findByRole("heading", { name: "WM-1008" });

    await user.click(screen.getByRole("button", { name: "Terima Pesanan" }));

    await waitFor(async () => {
      await expect(repository.getOrderById("order-1008")).resolves.toMatchObject({
        status: "accepted",
      });
    });
    expect((await screen.findAllByText("Diterima")).length).toBeGreaterThanOrEqual(2);
  });

  it("shows an explicit not-found state", async () => {
    renderOrderDetail("missing");

    expect(await screen.findByText("Pesanan tidak ditemukan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kembali ke daftar pesanan" })).toBeInTheDocument();
  });

  it("cancels a paid order as a refund with the paid-cancel warning (QA-ADM-005)", async () => {
    const user = userEvent.setup();
    const { repository } = renderOrderDetail();
    await screen.findByRole("heading", { name: "WM-1008" });

    await user.click(screen.getByRole("button", { name: "Batalkan Pesanan" }));
    const confirm = await screen.findByRole("tooltip");
    expect(
      within(confirm).getByText(/Pembayaran akan dicatat sebagai refund/),
    ).toBeInTheDocument();
    await user.click(within(confirm).getByRole("button", { name: "Batalkan Pesanan" }));

    expect(
      await screen.findByText("Pesanan dibatalkan. Refund dan pengembalian stok telah dicatat."),
    ).toBeInTheDocument();
    await waitFor(async () => {
      await expect(repository.getOrderById("order-1008")).resolves.toMatchObject({
        status: "cancelled",
        paymentStatus: "refunded",
      });
    });
  });
});
