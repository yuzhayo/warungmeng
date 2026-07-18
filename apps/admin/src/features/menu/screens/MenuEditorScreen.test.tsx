import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createWarungMengMockRepository } from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { MenuEditorScreen } from "./MenuEditorScreen";

function renderEditor(
  initialPath: string,
  mode: "create" | "edit",
  repository = createWarungMengMockRepository(),
) {
  const result = render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route
              path="/menu/new"
              element={<MenuEditorScreen mode={mode} repository={repository} />}
            />
            <Route
              path="/menu/:menuId/edit"
              element={<MenuEditorScreen mode={mode} repository={repository} />}
            />
            <Route path="/menu" element={<div>Daftar menu</div>} />
          </Routes>
        </MemoryRouter>
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );

  return { repository, ...result };
}

describe("MenuEditorScreen", () => {
  it("creates a menu and returns to the list", async () => {
    const { repository } = renderEditor("/menu/new", "create");

    expect(await screen.findByText("Buat Menu")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nama Menu"), {
      target: { value: "Nasi Goreng" },
    });
    fireEvent.mouseDown(screen.getByLabelText("Kategori"));
    fireEvent.click(await screen.findByText("Makanan"));
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Daftar menu")).toBeInTheDocument();
    await waitFor(async () => {
      const menus = await repository.listMenus();
      expect(menus).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Nasi Goreng", slug: "nasi-goreng" }),
        ]),
      );
    });
  });

  it("loads and updates an existing menu", async () => {
    const repository = createWarungMengMockRepository();
    const existing = (await repository.listMenus())[0];
    if (!existing) throw new Error("Expected menu fixture");

    renderEditor(`/menu/${existing.id}/edit`, "edit", repository);

    expect(await screen.findByText("Ubah Menu")).toBeInTheDocument();
    const nameInput = screen.getByLabelText("Nama Menu");
    expect(nameInput).toHaveValue(existing.name);
    fireEvent.change(nameInput, { target: { value: "Menu Diperbarui" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Daftar menu")).toBeInTheDocument();
    await expect(repository.getMenuById(existing.id)).resolves.toMatchObject({
      name: "Menu Diperbarui",
    });
  });

  it("shows an explicit not-found state", async () => {
    renderEditor("/menu/unknown/edit", "edit");

    expect(await screen.findByText("Menu tidak ditemukan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kembali ke Daftar" })).toBeInTheDocument();
  });
});
