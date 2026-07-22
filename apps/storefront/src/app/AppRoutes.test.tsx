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

vi.mock("../features/catalog/screens/MenuDetailScreen", () => ({
  MenuDetailScreen: () => <div data-testid="menu-detail-screen">Detail</div>,
}));

vi.mock("../features/cart/screens/CartScreen", () => ({
  CartScreen: () => <div data-testid="cart-screen">Cart</div>,
}));

vi.mock("../features/checkout/screens/CheckoutScreen", () => ({
  CheckoutScreen: () => <div data-testid="checkout-screen">Checkout</div>,
}));

vi.mock("../features/orders/screens/OrderConfirmationScreen", () => ({
  OrderConfirmationScreen: () => <div data-testid="order-confirmation-screen">Order</div>,
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
  it("renders the catalog through the shared shell at /", async () => {
    renderRoute("/");

    expect(await screen.findByTestId("storefront-shell")).toBeInTheDocument();
    expect(await screen.findByTestId("catalog-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("not-found")).not.toBeInTheDocument();
  });

  it("renders the menu detail screen through the shared shell at /menu/:menuSlug", async () => {
    renderRoute("/menu/nasi-goreng");

    expect(await screen.findByTestId("storefront-shell")).toBeInTheDocument();
    expect(await screen.findByTestId("menu-detail-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("not-found")).not.toBeInTheDocument();
  });

  it("renders the cart screen through the shared shell at /cart", async () => {
    renderRoute("/cart");

    expect(await screen.findByTestId("storefront-shell")).toBeInTheDocument();
    expect(await screen.findByTestId("cart-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("not-found")).not.toBeInTheDocument();
  });

  it("renders the checkout screen through the shared shell at /checkout", async () => {
    renderRoute("/checkout");

    expect(await screen.findByTestId("storefront-shell")).toBeInTheDocument();
    expect(await screen.findByTestId("checkout-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("not-found")).not.toBeInTheDocument();
  });

  it("renders order confirmation through the shared shell at /orders/:orderId", async () => {
    renderRoute("/orders/order-1");

    expect(await screen.findByTestId("storefront-shell")).toBeInTheDocument();
    expect(await screen.findByTestId("order-confirmation-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("not-found")).not.toBeInTheDocument();
  });

  it("renders the not-found screen through the shared shell for unknown routes", async () => {
    renderRoute("/some-random-page");

    expect(await screen.findByTestId("storefront-shell")).toBeInTheDocument();
    expect(await screen.findByTestId("not-found")).toBeInTheDocument();
    expect(screen.queryByTestId("catalog-screen")).not.toBeInTheDocument();
  });
});
