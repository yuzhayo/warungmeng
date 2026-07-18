import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWarungMengMockRepository } from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { describe, expect, it } from "vitest";
import { MenuVariantListScreen } from "./MenuVariantListScreen";

function renderVariantList() {
  const repository = createWarungMengMockRepository();
  const result = render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <MenuVariantListScreen repository={repository} />
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );

  return { repository, ...result };
}

function getVariantGroupRow(name: string): HTMLTableRowElement {
  const row = screen.getByText(name).closest("tr");
  if (!(row instanceof HTMLTableRowElement)) {
    throw new Error(`Variant group row ${name} was not found`);
  }
  return row;
}

describe("MenuVariantListScreen", () => {
  it("renders all real variant categories without pagination", async () => {
    renderVariantList();

    expect(await screen.findByText("EXTRA")).toBeInTheDocument();
    expect(screen.getByText("Ice")).toBeInTheDocument();
    expect(screen.getByText("Semua (9)")).toBeInTheDocument();
    expect(screen.getByText("Tidak Tersedia (1)")).toBeInTheDocument();
    expect(screen.getByText("5 varian")).toBeInTheDocument();
    expect(screen.queryByText("BUMBU 50ml")).not.toBeInTheDocument();

    const extraRow = getVariantGroupRow("EXTRA");
    fireEvent.click(extraRow);

    expect(screen.getByText("BUMBU 50ml")).toBeInTheDocument();
    expect(screen.getByText(/\+Rp\s*3\.000/)).toBeInTheDocument();
    expect(extraRow).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("Nama Varian")).not.toBeInTheDocument();

    fireEvent.click(extraRow);
    expect(extraRow).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
  });

  it("filters by an option name and unavailable options", async () => {
    const user = userEvent.setup();
    renderVariantList();
    await screen.findByText("EXTRA");

    await user.type(
      screen.getByRole("searchbox", { name: "Cari kategori varian atau opsi" }),
      "strawberry",
    );

    expect(screen.getByText("MIX")).toBeInTheDocument();
    expect(screen.queryByText("EXTRA")).not.toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox", { name: "Cari kategori varian atau opsi" }));
    await user.click(screen.getByText("Tidak Tersedia (1)"));

    expect(await screen.findByText("PORSI")).toBeInTheDocument();
    expect(screen.queryByText("Ice")).not.toBeInTheDocument();
  });

  it("persists visibility changes through the repository contract", async () => {
    const user = userEvent.setup();
    const { repository } = renderVariantList();
    await screen.findByText("EXTRA");

    await user.click(screen.getByRole("switch", { name: "Ubah tampilan EXTRA" }));

    await waitFor(async () => {
      await expect(repository.getVariantGroupById("3106667766346240")).resolves.toMatchObject({
        visibility: "hidden",
      });
    });
  });

  it("quick edits an option name and price through the repository", async () => {
    const { repository } = renderVariantList();
    await screen.findByText("EXTRA");

    fireEvent.click(getVariantGroupRow("EXTRA"));
    fireEvent.click(screen.getByRole("button", { name: "Edit cepat BUMBU 50ml" }));

    const nameInput = screen.getByRole("textbox", { name: "Nama varian BUMBU 50ml" });
    const priceInput = screen.getByRole("textbox", { name: "Tambahan harga BUMBU 50ml" });
    fireEvent.change(nameInput, { target: { value: "BUMBU 75ml" } });
    fireEvent.change(priceInput, { target: { value: "4500" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan BUMBU 50ml" }));

    await waitFor(async () => {
      const group = await repository.getVariantGroupById("3106667766346240");
      expect(group?.options[0]).toMatchObject({
        name: "BUMBU 75ml",
        priceAdjustment: { amount: 4_500, currency: "IDR" },
      });
    });
  });

  it("deletes an option only after confirmation", async () => {
    const user = userEvent.setup();
    const { repository } = renderVariantList();
    await screen.findByText("EXTRA");

    fireEvent.click(getVariantGroupRow("EXTRA"));
    await user.click(screen.getByRole("button", { name: "Hapus varian BUMBU 50ml" }));
    expect(screen.getByText("Hapus BUMBU 50ml?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Hapus$/ }));

    await waitFor(async () => {
      const group = await repository.getVariantGroupById("3106667766346240");
      expect(group?.options.some((option) => option.name === "BUMBU 50ml")).toBe(false);
    });
  });
});
