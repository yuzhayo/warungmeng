import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "../components/layout/AdminShell";
import { MenuListScreen } from "../features/menu/screens/MenuListScreen";
import { MenuEditorScreen } from "../features/menu/screens/MenuEditorScreen";
import { MenuScreen } from "../features/menu/screens/MenuScreen";
import { VariantCategoryEditorScreen } from "../features/menu/screens/VariantCategoryEditorScreen";
import { VariantListView } from "../features/menu/views/VariantListView";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { ThemeSettingsScreen } from "../features/settings/theme/ThemeSettingsScreen";
import { BusinessHoursScreen } from "../features/settings/business-hours/screens/BusinessHoursScreen";
import { AdminHomeScreen } from "../screens/AdminHomeScreen";
import { AdminPlaceholderScreen } from "../screens/AdminPlaceholderScreen";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<AdminHomeScreen />} />
        <Route path="menu" element={<MenuScreen />}>
          <Route index element={<MenuListScreen />} />
          <Route path="new" element={<MenuEditorScreen mode="create" />} />
          <Route path=":menuId/edit" element={<MenuEditorScreen mode="edit" />} />
          <Route path="variants" element={<VariantListView />} />
          <Route path="variants/new" element={<VariantCategoryEditorScreen mode="create" />} />
          <Route
            path="variants/:variantGroupId/edit"
            element={<VariantCategoryEditorScreen mode="edit" />}
          />
        </Route>
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
          path="inventory"
          element={
            <AdminPlaceholderScreen
              descriptionKey="screen.inventory.description"
              titleKey="screen.inventory.title"
            />
          }
        />
        <Route path="calculator" element={<Navigate replace to="/inventory" />} />
        <Route
          path="pos"
          element={
            <AdminPlaceholderScreen
              descriptionKey="screen.pos.description"
              titleKey="screen.pos.title"
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
        <Route path="settings" element={<SettingsScreen />}>
          <Route index element={<Navigate replace to="theme" />} />
          <Route path="theme" element={<ThemeSettingsScreen />} />
          <Route path="business-hours" element={<BusinessHoursScreen />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
