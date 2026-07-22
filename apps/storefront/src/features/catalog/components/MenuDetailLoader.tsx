import { Alert, App as AntdApp, Button, Result, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useStorefrontCart } from "../../cart/application/storefrontCartContext";
import {
  groupCartItemSelections,
  type StorefrontCartItem,
} from "../../cart/application/storefrontCartModel";
import { useMenuDetail } from "../application/useMenuDetail";
import type { StorefrontMenuDetailRepository } from "../application/storefrontCatalogRepository";
import { MenuConfigurator, type MenuConfiguratorSubmission } from "./MenuConfigurator";

interface MenuDetailLoaderProps {
  menuSlug: string;
  repository?: StorefrontMenuDetailRepository;
  headingId?: string;
  onAdded?: () => void;
  /** When set, the configurator edits this existing cart line instead of adding a new one. */
  editItem?: StorefrontCartItem;
}

export function MenuDetailLoader({
  menuSlug,
  repository,
  headingId,
  onAdded,
  editItem,
}: MenuDetailLoaderProps) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const cart = useStorefrontCart();
  const state = useMenuDetail(menuSlug, repository);

  if (state.status === "loading") {
    return (
      <div role="status" aria-label={t("storefront.detail.loading")}>
        <Skeleton.Image active />
        <Skeleton active title paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <Alert
        title={t("storefront.detail.error.load")}
        type="error"
        showIcon
        action={
          <Button size="small" type="primary" onClick={state.retry}>
            {t("storefront.error.retry")}
          </Button>
        }
      />
    );
  }

  if (state.status === "not-found") {
    return (
      <Result
        status="404"
        title={t("storefront.detail.notFound.title")}
        subTitle={t("storefront.detail.notFound.description")}
        extra={
          <Button type="primary" onClick={() => navigate("/")}>
            {t("storefront.detail.notFound.back")}
          </Button>
        }
      />
    );
  }

  const handleSubmit = (submission: MenuConfiguratorSubmission) => {
    const input = {
      menu: state.menu,
      variantSelections: submission.variantSelections,
      quantity: submission.quantity,
      note: submission.note,
    };

    if (editItem) {
      cart.replaceItem(editItem.id, input);
      void message.success(t("storefront.cart.updated", { name: state.menu.name }));
    } else {
      cart.addItem(input);
      void message.success(t("storefront.detail.added", { name: state.menu.name }));
    }
    onAdded?.();
  };

  return (
    <MenuConfigurator
      key={`${state.menu.id}:${editItem?.id ?? "new"}`}
      menu={state.menu}
      variantGroups={state.variantGroups}
      missingGroupIds={state.missingGroupIds}
      onAdd={handleSubmit}
      headingId={headingId}
      initialSelections={editItem ? groupCartItemSelections(editItem) : undefined}
      initialQuantity={editItem?.quantity}
      initialNote={editItem?.note}
      submitLabel={editItem ? t("storefront.cart.editSave") : undefined}
    />
  );
}
