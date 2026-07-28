import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AdminShell } from "./AdminShell";
import type { AdminRuntime } from "../../app/composition/adminRuntime";
import { createAdminRuntime } from "../../app/composition/createAdminRuntime";
import { createAdminRepositories } from "../../app/composition/createAdminRepositories";
import { AdminRuntimeProvider } from "../../app/composition/AdminRuntimeProvider";

const activeRuntimes = new Set<AdminRuntime>();

afterEach(async () => {
  await Promise.all([...activeRuntimes].map((r) => r.dispose()));
  activeRuntimes.clear();
});

function renderShell(initialPath = "/") {
  const runtime = createAdminRuntime({ repositories: createAdminRepositories() });
  activeRuntimes.add(runtime);
  return render(
    <WarungMengI18nProvider storage={null}>
      <AdminRuntimeProvider runtime={runtime}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route element={<AdminShell />}>
              <Route index element={<h1>Performa Outlet</h1>} />
              <Route path="menu" element={<h1>Pengaturan Menu</h1>} />
              <Route path="menu/new" element={<h1>Buat Menu</h1>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AdminRuntimeProvider>
    </WarungMengI18nProvider>,
  );
}

describe("AdminShell", () => {
  it("renders persistent header, navigation, and nested content", () => {
    renderShell("/menu");

    expect(screen.getByText("WARUNG MENG")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifikasi" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pengaturan Menu" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Menu" })).toHaveClass("ant-menu-item-selected");
  });

  it("navigates from a parent menu item and moves the highlight", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("menuitem", { name: "Menu" }));

    expect(screen.getByRole("heading", { name: "Pengaturan Menu" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Menu" })).toHaveClass("ant-menu-item-selected");
  });

  it("exposes sidebar collapse state through the header control", async () => {
    const user = userEvent.setup();
    renderShell();

    const closeButton = screen.getByRole("button", { name: "Tutup sidebar" });
    expect(closeButton).toHaveAttribute("aria-expanded", "true");

    await user.click(closeButton);

    expect(screen.getByRole("button", { name: "Buka sidebar" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("keeps the parent menu selected on a child route", () => {
    renderShell("/menu/new");

    expect(screen.getByRole("heading", { name: "Buat Menu" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Menu" })).toHaveClass("ant-menu-item-selected");
  });

  it("switches UI language while retaining Indonesian regional formatting", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Bahasa: Indonesia" }));
    await user.click(screen.getByRole("menuitem", { name: "English" }));

    expect(
      await screen.findByRole("navigation", { name: "Primary navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Dashboard & Reports" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Language: English" })).toBeInTheDocument();
    expect(screen.getByLabelText(/\d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
  });
});
