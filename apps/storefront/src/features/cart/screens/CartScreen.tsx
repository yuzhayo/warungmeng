import { useState } from "react";
import { Alert, App as AntdApp, Button, Empty, Modal, Skeleton } from "antd";
import type { MenuItem } from "@warungmeng/domain";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { StorefrontMenuDetailRepository } from "../../catalog/application/storefrontCatalogRepository";
import { MenuDetailDrawer } from "../../catalog/components/MenuDetailDrawer";
import { validateCartItems } from "../application/cartValidation";
import { calculateCartSubtotal, type StorefrontCartItem } from "../application/storefrontCartModel";
import { useCartCatalogSnapshot } from "../application/useCartCatalogSnapshot";
import { useStorefrontCart } from "../application/storefrontCartContext";
import { CartItemList } from "../components/CartItemList";
import { CartTotalsAction } from "../components/CartTotalsAction";
import { CartValidationSummary } from "../components/CartValidationSummary";
import styles from "../Cart.module.css";

interface EditTarget {
  readonly item: StorefrontCartItem;
  readonly slug: string;
}

interface CartScreenProps {
  repository?: StorefrontMenuDetailRepository;
}

export function CartScreen({ repository }: CartScreenProps) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const cart = useStorefrontCart();
  const snapshotState = useCartCatalogSnapshot(repository);
  const [removalTarget, setRemovalTarget] = useState<StorefrontCartItem | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const handleEdit = (item: StorefrontCartItem, menu: MenuItem) => {
    setEditTarget({ item, slug: menu.slug });
  };

  const handleConfirmRemove = () => {
    if (!removalTarget) return;
    cart.removeItem(removalTarget.id);
    void message.success(t("storefront.cart.removed", { name: removalTarget.name }));
    setRemovalTarget(null);
  };

  if (cart.items.length === 0) {
    return (
      <div className={styles.cartColumn}>
        <h2 className={styles.screenTitle}>{t("storefront.cart.title")}</h2>
        <Empty description={t("storefront.cart.empty")}>
          <Button type="primary" onClick={() => navigate("/")}>
            {t("storefront.cart.empty.back")}
          </Button>
        </Empty>
      </div>
    );
  }

  if (snapshotState.status === "loading") {
    return (
      <div className={styles.cartColumn} role="status" aria-label={t("storefront.cart.loading")}>
        <Skeleton active title paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (snapshotState.status === "error") {
    return (
      <div className={styles.cartColumn}>
        <Alert
          title={t("storefront.cart.error.load")}
          type="error"
          showIcon
          action={
            <Button size="small" type="primary" onClick={snapshotState.retry}>
              {t("storefront.error.retry")}
            </Button>
          }
        />
      </div>
    );
  }

  const validation = validateCartItems(cart.items, snapshotState.snapshot);
  const subtotal = calculateCartSubtotal(cart.items);

  return (
    <div className={styles.cartColumn}>
      <h2 className={styles.screenTitle}>{t("storefront.cart.title")}</h2>
      <CartValidationSummary allValid={validation.allValid} />
      <CartItemList
        lines={validation.lines}
        onQuantityChange={cart.updateItemQuantity}
        onEdit={handleEdit}
        onRemoveRequest={setRemovalTarget}
      />
      <CartTotalsAction subtotal={subtotal} checkoutDisabled={!validation.allValid} />
      <Modal
        open={removalTarget !== null}
        title={t("storefront.cart.remove.title")}
        okText={t("storefront.cart.remove.confirm")}
        okButtonProps={{ danger: true }}
        cancelText={t("storefront.cart.remove.cancel")}
        onOk={handleConfirmRemove}
        onCancel={() => setRemovalTarget(null)}
        destroyOnHidden
      >
        {removalTarget ? (
          <p>{t("storefront.cart.remove.description", { name: removalTarget.name })}</p>
        ) : null}
      </Modal>
      <MenuDetailDrawer
        menuSlug={editTarget?.slug ?? null}
        editItem={editTarget?.item}
        onClose={() => setEditTarget(null)}
        repository={repository}
      />
    </div>
  );
}
