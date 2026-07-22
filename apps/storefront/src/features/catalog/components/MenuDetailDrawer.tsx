import { useId } from "react";
import { Drawer } from "antd";
import type { StorefrontCartItem } from "../../cart/application/storefrontCartModel";
import type { StorefrontMenuDetailRepository } from "../application/storefrontCatalogRepository";
import styles from "../MenuDetail.module.css";
import { MenuDetailLoader } from "./MenuDetailLoader";

interface MenuDetailDrawerProps {
  menuSlug: string | null;
  onClose: () => void;
  repository?: StorefrontMenuDetailRepository;
  /** When set, the configurator edits this existing cart line instead of adding a new one. */
  editItem?: StorefrontCartItem;
}

export function MenuDetailDrawer({
  menuSlug,
  onClose,
  repository,
  editItem,
}: MenuDetailDrawerProps) {
  const headingId = useId();

  return (
    <Drawer
      open={menuSlug !== null}
      onClose={onClose}
      placement="bottom"
      size="85dvh"
      destroyOnHidden
      keyboard
      title={null}
      aria-labelledby={headingId}
      classNames={{ body: styles.drawerBody }}
    >
      {menuSlug !== null ? (
        <MenuDetailLoader
          menuSlug={menuSlug}
          repository={repository}
          headingId={headingId}
          onAdded={onClose}
          editItem={editItem}
        />
      ) : null}
    </Drawer>
  );
}
