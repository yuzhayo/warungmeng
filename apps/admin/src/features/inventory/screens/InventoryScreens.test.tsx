import {
  createWarungMengInventoryRepository,
  createWarungMengMockRepository,
} from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { InventoryHppScreen } from "./InventoryHppScreen";
import { InventoryMaterialsScreen } from "./InventoryMaterialsScreen";
import { InventoryMovementsScreen } from "./InventoryMovementsScreen";

function renderScreen(node: React.ReactNode) {
  return render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>{node}</AdminUiProvider>
    </WarungMengI18nProvider>,
  );
}

describe("Inventory screens", () => {
  it("loads ingredient balances and low-stock indicators", async () => {
    renderScreen(<InventoryMaterialsScreen repository={createWarungMengInventoryRepository()} />);

    expect(await screen.findByText("Telur")).toBeInTheDocument();
    expect(screen.getAllByText("Menipis").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Tambah Bahan/ })).toBeInTheDocument();
  });

  it("loads the movement audit trail and opens its transaction dialog", async () => {
    const user = userEvent.setup();
    renderScreen(<InventoryMovementsScreen repository={createWarungMengInventoryRepository()} />);

    expect(await screen.findByText("Saldo awal mock inventory")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Catat Pergerakan/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText("Catat Pergerakan").length).toBeGreaterThan(0);
  });

  it("calculates menu HPP and opens the recipe editor", async () => {
    const user = userEvent.setup();
    renderScreen(
      <InventoryHppScreen
        catalogRepository={createWarungMengMockRepository()}
        repository={createWarungMengInventoryRepository()}
      />,
    );

    expect(await screen.findByText("GADO-GADO")).toBeInTheDocument();
    const editButtons = screen.getAllByRole("button", { name: "Atur resep GADO-GADO" });
    await user.click(editButtons.at(-1)!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Hapus bahan resep" })).toHaveLength(6);
  });
});
