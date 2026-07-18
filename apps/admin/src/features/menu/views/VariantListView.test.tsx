import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWarungMengMockRepository } from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { describe, expect, it } from "vitest";
import { VariantListView } from "./VariantListView";

function renderVariantList() {
  const repository = createWarungMengMockRepository();
  const result = render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <VariantListView repository={repository} />
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );

  return { repository, ...result };
}

describe("VariantListView", () => {
  it("renders variant options as regular rows without expansion or pagination", async () => {
    renderVariantList();

    expect(await screen.findByText("BUMBU 50ml")).toBeInTheDocument();
    expect(screen.getByText("Semua (30)")).toBeInTheDocument();
    expect(screen.getByText("Tidak Tersedia (1)")).toBeInTheDocument();
    expect(screen.getByTitle("EXTRA (5)")).toBeInTheDocument();
    expect(screen.queryByText(/Semua Kategori/)).not.toBeInTheDocument();
    expect(document.querySelector("tr[aria-expanded]")).toBeNull();
    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
  });

  it("filters with category rows and restores all options from the category header", async () => {
    const user = userEvent.setup();
    renderVariantList();
    await screen.findByText("BUMBU 50ml");

    await user.click(screen.getByTitle("PORSI (2)"));
    expect(await screen.findByText("REGULER")).toBeInTheDocument();
    expect(screen.queryByText("BUMBU 50ml")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Kategori Varian" }));
    expect(await screen.findByText("BUMBU 50ml")).toBeInTheDocument();
  });

  it("places the parent editor action in the category rail", async () => {
    renderVariantList();
    await screen.findByText("BUMBU 50ml");

    const allCategories = screen
      .getByTestId("catalog-category-rail")
      .querySelector('button[aria-label="Kategori Varian"]');
    expect(allCategories).not.toBeNull();
    expect(allCategories).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Ubah EXTRA")).toBeInTheDocument();
  });

  it("filters by option name and unavailable options", async () => {
    const user = userEvent.setup();
    renderVariantList();
    await screen.findByText("BUMBU 50ml");

    await user.type(
      screen.getByRole("searchbox", { name: "Cari kategori varian atau opsi" }),
      "strawberry",
    );

    expect(screen.getByText("Strawberry")).toBeInTheDocument();
    expect(screen.queryByText("BUMBU 50ml")).not.toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox", { name: "Cari kategori varian atau opsi" }));
    await user.click(screen.getByText("Tidak Tersedia (1)"));

    expect(await screen.findByText("PROMO")).toBeInTheDocument();
    expect(screen.queryByText("Strawberry")).not.toBeInTheDocument();
  });

  it("quick edits an option name and price through the repository", async () => {
    const { repository } = renderVariantList();
    await screen.findByText("BUMBU 50ml");

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
    await screen.findByText("BUMBU 50ml");

    await user.click(screen.getByRole("button", { name: "Hapus varian BUMBU 50ml" }));
    expect(screen.getByText("Hapus BUMBU 50ml?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Hapus$/ }));

    await waitFor(async () => {
      const group = await repository.getVariantGroupById("3106667766346240");
      expect(group?.options.some((option) => option.name === "BUMBU 50ml")).toBe(false);
    });
  });
});
