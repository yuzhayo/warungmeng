import type { MenuItem } from "@warungmeng/domain";
import { formatRupiah } from "@warungmeng/i18n";
import styles from "../MenuDetail.module.css";
import { CatalogMenuImage } from "./CatalogMenuImage";

interface MenuDetailIdentityProps {
  menu: MenuItem;
  headingId?: string;
}

export function MenuDetailIdentity({ menu, headingId }: MenuDetailIdentityProps) {
  return (
    <div className={styles.identity}>
      <CatalogMenuImage image={menu.image} className={styles.identityImage} />
      <h2 className={styles.identityName} id={headingId}>
        {menu.name}
      </h2>
      {menu.description ? <p className={styles.identityDescription}>{menu.description}</p> : null}
      <div className={styles.identityPrice}>
        {formatRupiah(menu.price.amount, { regionalFormat: "id-ID" })}
      </div>
    </div>
  );
}
