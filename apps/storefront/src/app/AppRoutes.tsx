import { Route, Routes } from "react-router-dom";
import { StorefrontShell } from "../components/layout/StorefrontShell";
import { StorefrontCatalogScreen } from "../features/catalog/screens/StorefrontCatalogScreen";
import { NotFoundScreen } from "../screens/NotFoundScreen";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<StorefrontShell />}>
        <Route index element={<StorefrontCatalogScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  );
}
