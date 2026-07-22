import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { StorefrontShell } from "../components/layout/StorefrontShell";

const StorefrontCatalogScreen = lazy(() =>
  import("../features/catalog/screens/StorefrontCatalogScreen").then((module) => ({
    default: module.StorefrontCatalogScreen,
  })),
);
const MenuDetailScreen = lazy(() =>
  import("../features/catalog/screens/MenuDetailScreen").then((module) => ({
    default: module.MenuDetailScreen,
  })),
);
const CartScreen = lazy(() =>
  import("../features/cart/screens/CartScreen").then((module) => ({
    default: module.CartScreen,
  })),
);
const CheckoutScreen = lazy(() =>
  import("../features/checkout/screens/CheckoutScreen").then((module) => ({
    default: module.CheckoutScreen,
  })),
);
const NotFoundScreen = lazy(() =>
  import("../screens/NotFoundScreen").then((module) => ({ default: module.NotFoundScreen })),
);

function RouteLoadingFallback() {
  return <div role="status" aria-label="Loading" />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route element={<StorefrontShell />}>
          <Route index element={<StorefrontCatalogScreen />} />
          <Route path="menu/:menuSlug" element={<MenuDetailScreen />} />
          <Route path="cart" element={<CartScreen />} />
          <Route path="checkout" element={<CheckoutScreen />} />
          <Route path="*" element={<NotFoundScreen />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
