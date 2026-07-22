import { useParams } from "react-router-dom";
import type { StorefrontMenuDetailRepository } from "../application/storefrontCatalogRepository";
import { MenuDetailLoader } from "../components/MenuDetailLoader";
import styles from "../MenuDetail.module.css";

interface MenuDetailScreenProps {
  repository?: StorefrontMenuDetailRepository;
}

export function MenuDetailScreen({ repository }: MenuDetailScreenProps) {
  const { menuSlug = "" } = useParams();

  return (
    <div className={styles.detailColumn}>
      <MenuDetailLoader menuSlug={menuSlug} repository={repository} />
    </div>
  );
}
