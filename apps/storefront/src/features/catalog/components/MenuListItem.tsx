import { List, Typography } from "antd";
import type { MenuItem } from "@warungmeng/domain";
import { formatRupiah } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import styles from "../StorefrontCatalog.module.css";
import { CatalogMenuImage } from "./CatalogMenuImage";

const { Text } = Typography;

interface MenuListItemProps {
  menu: MenuItem;
}

export function MenuListItem({ menu }: MenuListItemProps) {
  const { t } = useTranslation();

  return (
    <List.Item className={styles.listItem}>
      <CatalogMenuImage image={menu.image} className={styles.listItemImage} />
      <div className={styles.listItemContent}>
        <h4 className={styles.listItemTitle}>{menu.name}</h4>
        <p className={styles.listItemDescription}>{menu.description}</p>
        <div className={styles.listItemPrice}>
          {formatRupiah(menu.price.amount, { regionalFormat: "id-ID" })}
        </div>
        {menu.availability.status !== "available" && (
          <Text type="danger" className={styles.unavailableBadge}>
            {t("storefront.menu.unavailable")}
          </Text>
        )}
      </div>
    </List.Item>
  );
}
