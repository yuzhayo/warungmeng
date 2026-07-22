import { useRef, useState } from "react";
import { Alert, Button, Skeleton } from "antd";
import type { OrderRepository } from "@warungmeng/data";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { validateCartItems } from "../../cart/application/cartValidation";
import { calculateCartSubtotal } from "../../cart/application/storefrontCartModel";
import { useCartCatalogSnapshot } from "../../cart/application/useCartCatalogSnapshot";
import { useStorefrontCart } from "../../cart/application/storefrontCartContext";
import {
  storefrontMenuDetailRepository,
  type StorefrontMenuDetailRepository,
} from "../../catalog/application/storefrontCatalogRepository";
import type { StorefrontCheckoutDraft } from "../application/checkoutModel";
import {
  createStorefrontOrderInput,
  type CreateStorefrontOrderDependencies,
} from "../application/createStorefrontOrderInput";
import {
  createRecentOrderReceipt,
  saveRecentOrderReceipt,
  type ReceiptStorageLike,
} from "../application/recentOrderReceiptStorage";
import { storefrontOrderRepository } from "../application/storefrontOrderRepository";
import { CheckoutForm } from "../components/CheckoutForm";
import styles from "../Checkout.module.css";

function defaultReceiptStorage(): ReceiptStorageLike | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

const defaultOrderDependencies: CreateStorefrontOrderDependencies = {
  now: () => new Date().toISOString(),
  createOrderNumber: () => `WM-WEB-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
  createEventId: () => `order-event-${crypto.randomUUID()}`,
};

interface CheckoutScreenProps {
  readonly catalogRepository?: StorefrontMenuDetailRepository;
  readonly orderRepository?: OrderRepository;
  readonly receiptStorage?: ReceiptStorageLike | null;
  readonly orderDependencies?: CreateStorefrontOrderDependencies;
}

export function CheckoutScreen({
  catalogRepository = storefrontMenuDetailRepository,
  orderRepository = storefrontOrderRepository,
  receiptStorage = defaultReceiptStorage(),
  orderDependencies = defaultOrderDependencies,
}: CheckoutScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cart = useStorefrontCart();
  const snapshotState = useCartCatalogSnapshot(catalogRepository);
  const submissionLockRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [cartBecameInvalid, setCartBecameInvalid] = useState(false);
  const [successPath, setSuccessPath] = useState<string | null>(null);

  if (successPath) return <Navigate to={successPath} replace />;
  if (cart.items.length === 0) return <Navigate to="/cart" replace />;

  if (snapshotState.status === "loading") {
    return (
      <div
        className={styles.checkoutShell}
        role="status"
        aria-label={t("storefront.checkout.loading")}
      >
        <Skeleton active title paragraph={{ rows: 6 }} />
      </div>
    );
  }

  if (snapshotState.status === "error") {
    return (
      <div className={styles.checkoutShell}>
        <Alert
          type="error"
          showIcon
          title={t("storefront.checkout.error.load")}
          action={
            <Button size="small" type="primary" onClick={snapshotState.retry}>
              {t("storefront.error.retry")}
            </Button>
          }
        />
      </div>
    );
  }

  const initialValidation = validateCartItems(cart.items, snapshotState.snapshot);
  if (!initialValidation.allValid || cartBecameInvalid) {
    return (
      <div className={styles.checkoutShell}>
        <h2 className={styles.screenTitle}>{t("storefront.checkout.title")}</h2>
        <Alert
          type="warning"
          showIcon
          title={t("storefront.checkout.error.cartInvalid")}
          action={
            <Button type="primary" size="small" onClick={() => navigate("/cart")}>
              {t("storefront.checkout.backToCart")}
            </Button>
          }
        />
      </div>
    );
  }

  const handleSubmit = async (draft: StorefrontCheckoutDraft) => {
    if (submissionLockRef.current) return;
    submissionLockRef.current = true;
    setSubmitting(true);
    setSubmitFailed(false);

    try {
      const [menus, categories, variantGroups] = await Promise.all([
        catalogRepository.listMenus({ visibility: "visible" }),
        catalogRepository.listCategories(),
        catalogRepository.listVariantGroups(),
      ]);
      const currentValidation = validateCartItems(cart.items, { menus, categories, variantGroups });
      if (!currentValidation.allValid) {
        setCartBecameInvalid(true);
        return;
      }

      const input = createStorefrontOrderInput(draft, cart.items, orderDependencies);
      const order = await orderRepository.createOrder(input);
      saveRecentOrderReceipt(receiptStorage, createRecentOrderReceipt(order));
      setSuccessPath(`/orders/${order.id}`);
      cart.clearCart();
    } catch {
      setSubmitFailed(true);
    } finally {
      submissionLockRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.checkoutShell}>
      <h2 className={styles.screenTitle}>{t("storefront.checkout.title")}</h2>
      <CheckoutForm
        items={cart.items}
        total={calculateCartSubtotal(cart.items)}
        submitting={submitting}
        submitFailed={submitFailed}
        onSubmit={(draft) => void handleSubmit(draft)}
      />
    </div>
  );
}
