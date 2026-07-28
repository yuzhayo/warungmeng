import { createWarungMengOrderRepository } from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { OrderListScreen } from "./OrderListScreen";

function DetailProbe() {
  const { orderId } = useParams();
  return <div>DETAIL {orderId}</div>;
}

function renderOrderList() {
  const repository = createWarungMengOrderRepository();
  const result = render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <MemoryRouter initialEntries={["/orders"]}>
          <Routes>
            <Route path="/orders" element={<OrderListScreen orders={repository} />} />
            <Route path="/orders/:orderId" element={<DetailProbe />} />
          </Routes>
        </MemoryRouter>
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );

  return { repository, ...result };
}

describe("OrderListScreen", () => {
  it("renders mock orders, Rupiah totals, and no pagination", async () => {
    renderOrderList();

    expect(await screen.findByText("WM-1008")).toBeInTheDocument();
    expect(screen.getByText("6 pesanan")).toBeInTheDocument();
    expect(screen.getAllByText(/Rp\s*48\.400/)).not.toHaveLength(0);
    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
  });

  it("filters orders using customer search and resets the filter", async () => {
    const user = userEvent.setup();
    renderOrderList();
    await screen.findByText("WM-1008");

    await user.type(screen.getByRole("textbox", { name: "Cari pesanan" }), "Rina");

    expect(await screen.findByText("WM-1008")).toBeInTheDocument();
    expect(screen.queryByText("WM-1007")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset Filter" }));
    expect(await screen.findByText("WM-1007")).toBeInTheDocument();
  });

  it("opens an order through its accessible action", async () => {
    const user = userEvent.setup();
    renderOrderList();
    await screen.findByText("WM-1008");

    await user.click(screen.getByRole("button", { name: "Buka WM-1008" }));

    expect(screen.getByText("DETAIL order-1008")).toBeInTheDocument();
  });
});
