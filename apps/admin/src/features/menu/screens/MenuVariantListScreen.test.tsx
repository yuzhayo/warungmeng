import { render, screen, waitFor } from "@testing-library/react";
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

describe("MenuVariantListScreen", () => {
  it("renders all real variant categories without pagination", async () => {
    renderVariantList();

    expect(await screen.findByText("EXTRA")).toBeInTheDocument();
    expect(screen.getByText("Ice")).toBeInTheDocument();
    expect(screen.getByText("Semua (9)")).toBeInTheDocument();
    expect(screen.getByText("Tidak Tersedia (1)")).toBeInTheDocument();
    expect(screen.getByText(/No Ice \(Cup Regular 14 oz\)/)).toBeInTheDocument();
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
});
