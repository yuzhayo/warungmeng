import { createWarungMengMockRepository, InMemoryOrderRepository } from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PosCashierScreen } from "./PosCashierScreen";

function renderPos() {
  const orders = new InMemoryOrderRepository();
  const result = render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <PosCashierScreen catalogRepository={createWarungMengMockRepository()} orders={orders} />
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );
  return { orders, ...result };
}

describe("PosCashierScreen", () => {
  it("requires an open session before adding catalog items", async () => {
    renderPos();

    expect(screen.getByRole("heading", { name: "POS Kasir" })).toBeInTheDocument();
    const addButton = await screen.findByRole("button", { name: "Tambah ES TELER CREAMY" });
    expect(addButton).toBeDisabled();
  });

  it("completes a non-cash transaction and persists it to Order Management repository", async () => {
    const user = userEvent.setup();
    const { orders } = renderPos();
    await screen.findByRole("button", { name: "Tambah ES TELER CREAMY" });

    await user.click(screen.getByRole("button", { name: "Buka Sesi" }));
    await user.click(screen.getByRole("button", { name: "Tambah ES TELER CREAMY" }));
    await user.click(screen.getByRole("button", { name: "Bayar" }));
    await user.click(screen.getByText("QRIS", { selector: ".ant-segmented-item-label" }));
    await user.click(screen.getByRole("button", { name: "Selesaikan Pembayaran" }));

    expect(await screen.findByText("Pembayaran berhasil")).toBeInTheDocument();
    await waitFor(async () => {
      await expect(orders.listOrders({ channel: "pos" })).resolves.toHaveLength(1);
    });
  });
});
