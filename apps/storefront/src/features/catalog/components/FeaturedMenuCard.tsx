import { Card, Typography } from "antd";
import type { MenuItem } from "@warungmeng/domain";
import { formatRupiah } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import styles from "../StorefrontCatalog.module.css";
import { CatalogMenuImage } from "./CatalogMenuImage";

const { Text } = Typography;

interface FeaturedMenuCardProps {
  menu: MenuItem;
}

export function FeaturedMenuCard({ menu }: FeaturedMenuCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className={styles.featuredCard}
      cover={<CatalogMenuImage image={menu.image} className={styles.cardImage} />}
    >
      <Card.Meta
        title={menu.name}
        description={
          <>
            <Text type="secondary">{menu.description}</Text>
            <div className={styles.cardPrice}>
              {formatRupiah(menu.price.amount, { regionalFormat: "id-ID" })}
            </div>
            {menu.availability.status !== "available" && (
              <Text type="danger" className={styles.unavailableBadge}>
                {t("storefront.menu.unavailable")}
              </Text>
            )}
          </>
        }
      />
    </Card>
  );
}
