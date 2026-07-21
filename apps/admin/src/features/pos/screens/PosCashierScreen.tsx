import type { InventoryRepository, MenuCatalogRepository, OrderRepository } from "@warungmeng/data";
import type { MenuItem, PosCartItem } from "@warungmeng/domain";
import { Alert, App as AntApp, Button, Spin } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { menuCatalogRepository } from "../../menu/application/menuCatalogRepository";
import { orderRepository } from "../../orders/application/orderRepository";
import { inventoryRepository } from "../../inventory/application/inventoryRepository";
import type { PosSessionStore } from "../application/posSessionStore";
import { usePosCashier } from "../application/usePosCashier";
import { usePosCatalog } from "../application/usePosCatalog";
import { PosCart } from "../components/PosCart";
import { PosCatalog } from "../components/PosCatalog";
import { PosCheckoutModal } from "../components/PosCheckoutModal";
import { PosReceiptModal } from "../components/PosReceiptModal";
import { PosSessionBar } from "../components/PosSessionBar";
import { PosSessionCloseModal } from "../components/PosSessionCloseModal";
import { PosVariantModal } from "../components/PosVariantModal";
import "./PosCashierScreen.css";

interface PosCashierScreenProps {
  readonly catalogRepository?: MenuCatalogRepository;
  readonly orders?: OrderRepository;
  readonly inventory?: InventoryRepository;
  readonly sessionStore?: PosSessionStore;
}

interface ActiveConfiguration {
  readonly menu: MenuItem;
  readonly item?: PosCartItem;
}

export function PosCashierScreen({
  catalogRepository = menuCatalogRepository,
  orders = orderRepository,
  inventory = inventoryRepository,
  sessionStore,
}: PosCashierScreenProps) {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const catalog = usePosCatalog(catalogRepository);
  const cashier = usePosCashier(orders, undefined, inventory, sessionStore);
  const [activeConfiguration, setActiveConfiguration] = useState<ActiveConfiguration | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [closeSessionOpen, setCloseSessionOpen] = useState(false);
  const sessionOpen = cashier.session.status === "open";

  function handleSelectMenu(menu: MenuItem): void {
    if (menu.variantGroupIds.length > 0) {
      setActiveConfiguration({ menu });
      return;
    }
    cashier.addMenu(menu, [], "");
    void message.success(t("pos.feedback.itemAdded"));
  }

  function handleEditItem(item: PosCartItem): void {
    const menu = catalog.allMenus.find((candidate) => candidate.id === item.menuItemId);
    if (menu) setActiveConfiguration({ menu, item });
  }

  function handleConfirmCloseSession(actualCash: number): void {
    const record = cashier.endSession(actualCash);
    setCloseSessionOpen(false);
    if (record) void message.success(t("pos.feedback.sessionClosed"));
  }

  async function handleCompleteCheckout(): Promise<void> {
    try {
      const result = await cashier.completeCheckout();
      if (!result) return;
      setCheckoutOpen(false);
      void message.success(t("pos.feedback.orderCreated"));
      if (result.inventorySyncError) {
        void message.warning(t("pos.feedback.inventorySyncFailed"));
      }
    } catch {
      void message.error(t("pos.checkout.failed"));
    }
  }

  async function handleRetryInventorySync(orderId: string): Promise<void> {
    const succeeded = await cashier.retryInventorySync(orderId);
    if (succeeded) {
      void message.success(t("pos.sync.retrySucceeded"));
    } else {
      void message.error(t("pos.sync.retryFailed"));
    }
  }

  return (
    <section aria-labelledby="pos-cashier-title" className="pos-cashier-screen">
      <header className="pos-cashier-screen__header">
        <div>
          <h1 id="pos-cashier-title">{t("screen.pos.title")}</h1>
          <p>{t("screen.pos.description")}</p>
        </div>
      </header>

      <PosSessionBar
        lastCloseRecord={cashier.lastCloseRecord}
        onEnd={() => setCloseSessionOpen(true)}
        onOpeningBalanceChange={cashier.setOpeningBalance}
        onStart={() => {
          cashier.startSession();
          void message.success(t("pos.feedback.sessionOpened"));
        }}
        openingBalance={cashier.openingBalance}
        selectedOutlet={cashier.selectedOutlet}
        session={cashier.session}
      />

      {!sessionOpen ? <Alert title={t("pos.session.closed")} showIcon type="info" /> : null}
      {cashier.pendingInventorySyncs.map((pending) => (
        <Alert
          action={
            <Button onClick={() => void handleRetryInventorySync(pending.orderId)} size="small">
              {t("pos.sync.retry")}
            </Button>
          }
          key={pending.orderId}
          showIcon
          title={t("pos.sync.pendingTitle", { orderNumber: pending.orderNumber })}
          type="warning"
        />
      ))}
      {catalog.error ? (
        <Alert
          action={<Button onClick={catalog.retry}>{t("pos.catalog.retry")}</Button>}
          title={t("pos.catalog.error")}
          showIcon
          type="error"
        />
      ) : null}

      <Spin spinning={catalog.loading}>
        <div className="pos-cashier-screen__workspace">
          <PosCatalog
            categories={catalog.categories}
            categoryId={catalog.categoryId}
            disabled={!sessionOpen}
            menus={catalog.menus}
            onCategoryChange={catalog.setCategoryId}
            onSearchChange={catalog.setSearch}
            onSelectMenu={handleSelectMenu}
            search={catalog.search}
          />
          <PosCart
            disabled={!sessionOpen}
            items={cashier.items}
            onCheckout={() => setCheckoutOpen(true)}
            onEdit={handleEditItem}
            onQuantityChange={cashier.setItemQuantity}
            onRemove={cashier.removeItem}
            totals={cashier.totals}
          />
        </div>
      </Spin>

      {activeConfiguration ? (
        <PosVariantModal
          editingItem={activeConfiguration.item}
          key={`${activeConfiguration.menu.id}:${activeConfiguration.item?.id ?? "new"}`}
          menu={activeConfiguration.menu}
          onCancel={() => setActiveConfiguration(null)}
          onConfirm={(selections, note) => {
            if (activeConfiguration.item) {
              cashier.updateItem(activeConfiguration.item.id, selections, note);
            } else {
              cashier.addMenu(activeConfiguration.menu, selections, note);
              void message.success(t("pos.feedback.itemAdded"));
            }
            setActiveConfiguration(null);
          }}
          variantGroups={catalog.variantGroups}
        />
      ) : null}
      {checkoutOpen ? (
        <PosCheckoutModal
          checkout={cashier.checkout}
          onCancel={() => setCheckoutOpen(false)}
          onChange={cashier.updateCheckout}
          onConfirm={() => void handleCompleteCheckout()}
          onPricingChange={cashier.updatePricing}
          processing={cashier.processing}
          totals={cashier.totals}
        />
      ) : null}
      {closeSessionOpen && cashier.session.status === "open" ? (
        <PosSessionCloseModal
          cartItemCount={cashier.items.length}
          cashSales={cashier.cashSales}
          onCancel={() => setCloseSessionOpen(false)}
          onConfirm={handleConfirmCloseSession}
          session={cashier.session}
        />
      ) : null}
      {cashier.receipt ? (
        <PosReceiptModal onClose={cashier.dismissReceipt} receipt={cashier.receipt} />
      ) : null}
    </section>
  );
}
