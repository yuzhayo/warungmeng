import { Button, Card, Typography } from "antd";
import type { MenuItem } from "@warungmeng/domain";
import { formatRupiah } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { isMenuAvailableForDisplay } from "../application/storefrontCatalogModel";
import styles from "../StorefrontCatalog.module.css";
import { CatalogMenuImage } from "./CatalogMenuImage";

const { Text } = Typography;

interface MenuCardProps {
  menu: MenuItem;
  onAddAction?: (menu: MenuItem) => void;
}

export function MenuCard({ menu, onAddAction }: MenuCardProps) {
  const { t } = useTranslation();
  const available = isMenuAvailableForDisplay(menu);

  return (
    <Card
      className={styles.menuCard}
      cover={
        <Link
          to={`/menu/${menu.slug}`}
          aria-label={t("storefront.detail.open", { name: menu.name })}
          tabIndex={-1}
        >
          <CatalogMenuImage image={menu.image} className={styles.cardImage} />
        </Link>
      }
    >
      <Card.Meta
        title={
          <Link className={styles.cardTitleLink} to={`/menu/${menu.slug}`}>
            {menu.name}
          </Link>
        }
        description={
          <>
            <Text type="secondary">{menu.description}</Text>
            <div className={styles.cardPrice}>
              {formatRupiah(menu.price.amount, { regionalFormat: "id-ID" })}
            </div>
            {!available && (
              <Text type="danger" className={styles.unavailableBadge}>
                {t("storefront.menu.unavailable")}
              </Text>
            )}
            {onAddAction ? (
              <Button
                className={styles.cardAddAction}
                type="primary"
                disabled={!available}
                aria-label={t("storefront.detail.add", { name: menu.name })}
                onClick={() => onAddAction(menu)}
              >
                {t("storefront.detail.addLabel")}
              </Button>
            ) : null}
          </>
        }
      />
    </Card>
  );
}
