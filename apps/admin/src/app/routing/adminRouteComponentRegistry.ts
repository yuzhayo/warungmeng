import { lazy, createElement, type ComponentType, type LazyExoticComponent } from "react";
import { Navigate } from "react-router-dom";

/**
 * Component IDs are the app-local extension seam.  Feature manifests only
 * store these opaque IDs; React, router, and screen imports stay here.
 */
const registry: Record<string, LazyExoticComponent<ComponentType>> = {
  "admin.dashboard.screen.root": lazy(() =>
    import("../../features/dashboard/screens/DashboardScreen").then((module) => ({
      default: module.DashboardScreen,
    })),
  ),
  "admin.dashboard.screen.overview": lazy(() =>
    import("../../features/dashboard/screens/DashboardOverviewScreen").then((module) => ({
      default: module.DashboardOverviewScreen,
    })),
  ),
  "admin.dashboard.screen.reports": lazy(() =>
    import("../../features/dashboard/screens/DashboardReportsScreen").then((module) => ({
      default: module.DashboardReportsScreen,
    })),
  ),

  "admin.menu.screen.root": lazy(() =>
    import("../../features/menu/screens/MenuScreen").then((module) => ({
      default: module.MenuScreen,
    })),
  ),
  "admin.menu.screen.list": lazy(() =>
    import("../../features/menu/screens/MenuListScreen").then((module) => ({
      default: module.MenuListScreen,
    })),
  ),
  "admin.menu.screen.editor.create": lazy(async () => {
    const { MenuEditorScreen } = await import("../../features/menu/screens/MenuEditorScreen");
    return {
      default: () => createElement(MenuEditorScreen, { mode: "create" }),
    };
  }),
  "admin.menu.screen.editor.edit": lazy(async () => {
    const { MenuEditorScreen } = await import("../../features/menu/screens/MenuEditorScreen");
    return {
      default: () => createElement(MenuEditorScreen, { mode: "edit" }),
    };
  }),
  "admin.menu.screen.variants": lazy(() =>
    import("../../features/menu/views/VariantListView").then((module) => ({
      default: module.VariantListView,
    })),
  ),
  "admin.menu.screen.variant-editor.create": lazy(async () => {
    const { VariantCategoryEditorScreen } =
      await import("../../features/menu/screens/VariantCategoryEditorScreen");
    return {
      default: () => createElement(VariantCategoryEditorScreen, { mode: "create" }),
    };
  }),
  "admin.menu.screen.variant-editor.edit": lazy(async () => {
    const { VariantCategoryEditorScreen } =
      await import("../../features/menu/screens/VariantCategoryEditorScreen");
    return {
      default: () => createElement(VariantCategoryEditorScreen, { mode: "edit" }),
    };
  }),

  "admin.finance.screen.root": lazy(() =>
    import("../../features/finance/screens/FinanceScreen").then((module) => ({
      default: module.FinanceScreen,
    })),
  ),
  "admin.finance.screen.overview": lazy(() =>
    import("../../features/finance/screens/FinanceOverviewScreen").then((module) => ({
      default: module.FinanceOverviewScreen,
    })),
  ),
  "admin.finance.screen.transactions": lazy(() =>
    import("../../features/finance/screens/FinanceTransactionListScreen").then((module) => ({
      default: module.FinanceTransactionListScreen,
    })),
  ),
  "admin.finance.screen.expenses": lazy(() =>
    import("../../features/finance/screens/FinanceExpenseScreen").then((module) => ({
      default: module.FinanceExpenseScreen,
    })),
  ),

  "admin.inventory.screen.root": lazy(() =>
    import("../../features/inventory/screens/InventoryScreen").then((module) => ({
      default: module.InventoryScreen,
    })),
  ),
  "admin.inventory.screen.materials": lazy(() =>
    import("../../features/inventory/screens/InventoryMaterialsScreen").then((module) => ({
      default: module.InventoryMaterialsScreen,
    })),
  ),
  "admin.inventory.screen.movements": lazy(() =>
    import("../../features/inventory/screens/InventoryMovementsScreen").then((module) => ({
      default: module.InventoryMovementsScreen,
    })),
  ),
  "admin.inventory.screen.hpp": lazy(() =>
    import("../../features/inventory/screens/InventoryHppScreen").then((module) => ({
      default: module.InventoryHppScreen,
    })),
  ),

  "admin.pos.screen.cashier": lazy(() =>
    import("../../features/pos/screens/PosCashierScreen").then((module) => ({
      default: module.PosCashierScreen,
    })),
  ),

  "admin.orders.screen.list": lazy(() =>
    import("../../features/orders/screens/OrderListScreen").then((module) => ({
      default: module.OrderListScreen,
    })),
  ),
  "admin.orders.screen.detail": lazy(() =>
    import("../../features/orders/screens/OrderDetailScreen").then((module) => ({
      default: module.OrderDetailScreen,
    })),
  ),

  "admin.settings.screen.root": lazy(() =>
    import("../../features/settings/SettingsScreen").then((module) => ({
      default: module.SettingsScreen,
    })),
  ),
  "admin.settings.theme.screen": lazy(() =>
    import("../../features/settings/theme/ThemeSettingsScreen").then((module) => ({
      default: module.ThemeSettingsScreen,
    })),
  ),
  "admin.settings.business-hours.screen": lazy(() =>
    import("../../features/settings/business-hours/screens/BusinessHoursScreen").then((module) => ({
      default: module.BusinessHoursScreen,
    })),
  ),

  "admin.finance.redirect.overview": lazy(() =>
    Promise.resolve({
      default: () => createElement(Navigate, { replace: true, to: "overview" }),
    }),
  ),
  "admin.inventory.redirect.calculator": lazy(() =>
    Promise.resolve({
      default: () => createElement(Navigate, { replace: true, to: "/inventory" }),
    }),
  ),
  "admin.settings.redirect.theme": lazy(() =>
    Promise.resolve({
      default: () => createElement(Navigate, { replace: true, to: "theme" }),
    }),
  ),
};

export function getRouteComponent(
  componentId: string,
): LazyExoticComponent<ComponentType> | undefined {
  return registry[componentId];
}

export function hasRouteComponent(componentId: string): boolean {
  return getRouteComponent(componentId) !== undefined;
}
