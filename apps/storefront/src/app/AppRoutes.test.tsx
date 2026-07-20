import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./AppRoutes";

vi.mock("../components/layout/StorefrontShell", () => ({
  StorefrontShell: () => (
    <div data-testid="storefront-shell">
      <Outlet />
    </div>
  ),
}));

vi.mock("../features/catalog/screens/StorefrontCatalogScreen", () => ({
  StorefrontCatalogScreen: () => <div data-testid="catalog-screen">Catalog</div>,
}));

vi.mock("../screens/NotFoundScreen", () => ({
  NotFoundScreen: () => <div data-testid="not-found">404</div>,
}));

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("AppRoutes", () => {
  it("renders the catalog through the shared shell at /", () => {
    renderRoute("/");

    expect(screen.getByTestId("storefront-shell")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("not-found")).not.toBeInTheDocument();
  });

  it("renders the not-found screen through the shared shell for unknown routes", () => {
    renderRoute("/some-random-page");

    expect(screen.getByTestId("storefront-shell")).toBeInTheDocument();
    expect(screen.getByTestId("not-found")).toBeInTheDocument();
    expect(screen.queryByTestId("catalog-screen")).not.toBeInTheDocument();
  });
});
