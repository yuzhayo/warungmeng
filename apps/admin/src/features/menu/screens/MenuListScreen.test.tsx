import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWarungMengMockRepository } from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { MenuListScreen } from "./MenuListScreen";

function renderMenuList() {
  const repository = createWarungMengMockRepository();
  const result = render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <MemoryRouter>
          <MenuListScreen repository={repository} />
        </MemoryRouter>
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );

  return { repository, ...result };
}

describe("MenuListScreen", () => {
  it("renders the real menu catalog without pagination and keeps Rupiah formatting", async () => {
    renderMenuList();

    expect(await screen.findByText("GADO-GADO")).toBeInTheDocument();
    expect(screen.getByText("Semua (23)")).toBeInTheDocument();
    expect(screen.queryByText(/Semua Kategori/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Rp\s*22\.000/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buat kategori/i })).toHaveClass("ant-btn-primary");
    expect(screen.getByRole("button", { name: /buat menu/i })).toHaveClass("ant-btn-primary");
  }, 10_000);

  it("filters by search and category", async () => {
    const user = userEvent.setup();
    renderMenuList();
    await screen.findByText("GADO-GADO");

    await user.type(screen.getByRole("searchbox", { name: /cari nama/i }), "gado");

    expect(screen.getByText("GADO-GADO")).toBeInTheDocument();
    expect(screen.queryByText("LONTONG BALAP")).not.toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox", { name: /cari nama/i }));
    await user.click(screen.getByTitle("Minuman (18)"));

    expect(await screen.findByText("ES TELER CREAMY")).toBeInTheDocument();
    expect(screen.queryByText("GADO-GADO")).not.toBeInTheDocument();
  });

  it("persists availability changes through the repository contract", async () => {
    const user = userEvent.setup();
    const { repository } = renderMenuList();
    await screen.findByText("GADO-GADO");

    await user.click(screen.getByRole("switch", { name: "Ubah ketersediaan GADO-GADO" }));

    await waitFor(async () => {
      await expect(repository.getMenuById("2661748529823232")).resolves.toMatchObject({
        availability: { status: "unavailable" },
      });
    });
  });

  it("collapses the category column to an icon rail and expands it again", async () => {
    const user = userEvent.setup();
    renderMenuList();
    await screen.findByText("GADO-GADO");

    const categoryFilter = screen.getByTestId("catalog-category-rail");
    const collapseButton = screen.getByRole("button", { name: "Tutup kategori" });

    await user.click(collapseButton);

    expect(categoryFilter).toHaveClass("catalog-category-rail--collapsed");
    expect(screen.getByRole("button", { name: "Buka kategori" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await user.click(screen.getByRole("button", { name: "Buka kategori" }));

    expect(categoryFilter).not.toHaveClass("catalog-category-rail--collapsed");
  }, 10_000);

  it("uses the category header to restore the unfiltered list", async () => {
    const user = userEvent.setup();
    renderMenuList();
    await screen.findByText("GADO-GADO");

    await user.click(screen.getByTitle("Minuman (18)"));
    expect(screen.queryByText("GADO-GADO")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Kategori" }));
    expect(await screen.findByText("GADO-GADO")).toBeInTheDocument();
  });

  it("creates a category from the toolbar dialog and refreshes the category rail", async () => {
    const user = userEvent.setup();
    const { repository } = renderMenuList();
    await screen.findByText("GADO-GADO");

    await user.click(screen.getByRole("button", { name: /Buat Kategori/ }));
    await user.type(screen.getByLabelText("Nama Kategori"), "Camilan");
    await user.click(screen.getByRole("button", { name: /^Buat$/ }));

    expect(await screen.findByTitle("Camilan (0)")).toBeInTheDocument();
    await expect(repository.listCategories()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Camilan", slug: "camilan" })]),
    );
  });
});
