import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "../components/layout/AdminShell";
import { MenuListScreen } from "../features/menu/screens/MenuListScreen";
import { AdminHomeScreen } from "../screens/AdminHomeScreen";
import { AdminPlaceholderScreen } from "../screens/AdminPlaceholderScreen";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<AdminHomeScreen />} />
        <Route path="menu" element={<MenuListScreen />} />
        <Route
          path="finance"
          element={
            <AdminPlaceholderScreen
              descriptionKey="screen.finance.description"
              titleKey="screen.finance.title"
            />
          }
        />
        <Route
          path="calculator"
          element={
            <AdminPlaceholderScreen
              descriptionKey="screen.calculator.description"
              titleKey="screen.calculator.title"
            />
          }
        />
        <Route
          path="orders"
          element={
            <AdminPlaceholderScreen
              descriptionKey="screen.orders.description"
              titleKey="screen.orders.title"
            />
          }
        />
        <Route
          path="settings"
          element={
            <AdminPlaceholderScreen
              descriptionKey="screen.settings.description"
              titleKey="screen.settings.title"
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
