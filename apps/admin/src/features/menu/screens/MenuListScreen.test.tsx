import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWarungMengMockRepository } from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { describe, expect, it } from "vitest";
import { MenuListScreen } from "./MenuListScreen";

function renderMenuList() {
  const repository = createWarungMengMockRepository();
  const result = render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider>
        <MenuListScreen repository={repository} />
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
    expect(screen.getAllByText(/Rp\s*22\.000/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buat kategori/i })).toHaveClass("ant-btn-primary");
    expect(screen.getByRole("button", { name: /buat menu/i })).toHaveClass("ant-btn-primary");
  });

  it("filters by search and category", async () => {
    const user = userEvent.setup();
    renderMenuList();
    await screen.findByText("GADO-GADO");

    await user.type(screen.getByRole("searchbox", { name: /cari nama/i }), "gado");

    expect(screen.getByText("GADO-GADO")).toBeInTheDocument();
    expect(screen.queryByText("LONTONG BALAP")).not.toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox", { name: /cari nama/i }));
    await user.click(screen.getByText("Minuman (18)"));

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

    const categoryFilter = screen.getByTestId("menu-category-filter");
    const collapseButton = screen.getByRole("button", { name: "Tutup kategori" });

    await user.click(collapseButton);

    expect(categoryFilter).toHaveClass("menu-category-filter--collapsed");
    expect(screen.getByRole("button", { name: "Buka kategori" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await user.click(screen.getByRole("button", { name: "Buka kategori" }));

    expect(categoryFilter).not.toHaveClass("menu-category-filter--collapsed");
  });
});
