import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createWarungMengMockRepository } from "@warungmeng/data";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { VariantCategoryEditorScreen } from "./VariantCategoryEditorScreen";

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
              path="/menu/variants/new"
              element={<VariantCategoryEditorScreen mode={mode} repository={repository} />}
            />
            <Route
              path="/menu/variants/:variantGroupId/edit"
              element={<VariantCategoryEditorScreen mode={mode} repository={repository} />}
            />
            <Route path="/menu/variants" element={<div>Daftar kategori varian</div>} />
          </Routes>
        </MemoryRouter>
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );

  return { repository, ...result };
}

describe("VariantCategoryEditorScreen", () => {
  it("creates a variant category and returns to the list", async () => {
    const { repository } = renderEditor("/menu/variants/new", "create");

    expect(await screen.findByText("Buat Kategori Varian")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nama Kategori Varian"), {
      target: { value: "Level Pedas" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Nama varian 1" }), {
      target: { value: "Sedang" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Daftar kategori varian")).toBeInTheDocument();
    await waitFor(async () => {
      const groups = await repository.listVariantGroups();
      expect(groups.some((group) => group.name === "Level Pedas")).toBe(true);
    });
  });

  it("loads and updates an existing category", async () => {
    const repository = createWarungMengMockRepository();
    const existing = (await repository.listVariantGroups())[0];
    if (!existing) throw new Error("Expected variant group fixture");

    renderEditor(`/menu/variants/${existing.id}/edit`, "edit", repository);

    expect(await screen.findByText("Ubah Kategori Varian")).toBeInTheDocument();
    const nameInput = screen.getByLabelText("Nama Kategori Varian");
    expect(nameInput).toHaveValue(existing.name);

    fireEvent.change(nameInput, { target: { value: "Kategori Diperbarui" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Daftar kategori varian")).toBeInTheDocument();
    await expect(repository.getVariantGroupById(existing.id)).resolves.toMatchObject({
      name: "Kategori Diperbarui",
    });
  });

  it("shows a not-found state for an unknown category", async () => {
    renderEditor("/menu/variants/unknown/edit", "edit");

    expect(await screen.findByText("Kategori varian tidak ditemukan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kembali ke Daftar" })).toBeInTheDocument();
  });
});
