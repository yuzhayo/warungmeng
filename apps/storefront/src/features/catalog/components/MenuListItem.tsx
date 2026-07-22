import { Button, Typography } from "antd";
import type { MenuItem } from "@warungmeng/domain";
import { formatRupiah } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { isMenuAvailableForDisplay } from "../application/storefrontCatalogModel";
import styles from "../StorefrontCatalog.module.css";
import { CatalogMenuImage } from "./CatalogMenuImage";

const { Text } = Typography;

interface MenuListItemProps {
  menu: MenuItem;
  onAddAction?: (menu: MenuItem) => void;
}

export function MenuListItem({ menu, onAddAction }: MenuListItemProps) {
  const { t } = useTranslation();
  const available = isMenuAvailableForDisplay(menu);
  const itemClassName = available
    ? styles.listItem
    : `${styles.listItem} ${styles.listItemUnavailable}`;

  return (
    <div className={itemClassName} role="listitem">
      <CatalogMenuImage image={menu.image} className={styles.listItemImage} />
      <div className={styles.listItemContent}>
        <h3 className={styles.listItemTitle}>
          <Link className={styles.listItemTitleLink} to={`/menu/${menu.slug}`}>
            {menu.name}
          </Link>
        </h3>
        <p className={styles.listItemDescription}>{menu.description}</p>
        <div className={styles.listItemPrice}>
          {formatRupiah(menu.price.amount, { regionalFormat: "id-ID" })}
        </div>
        {!available && (
          <Text type="danger" className={styles.unavailableBadge}>
            {t("storefront.menu.unavailable")}
          </Text>
        )}
      </div>
      {onAddAction ? (
        <Button
          className={styles.listItemAddAction}
          type="primary"
          disabled={!available}
          aria-label={t("storefront.detail.add", { name: menu.name })}
          onClick={() => onAddAction(menu)}
        >
          {t("storefront.detail.addLabel")}
        </Button>
      ) : null}
    </div>
  );
}
