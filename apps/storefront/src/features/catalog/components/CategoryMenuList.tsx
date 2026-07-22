import type { MenuItem } from "@warungmeng/domain";
import { MenuListItem } from "./MenuListItem";
import styles from "../StorefrontCatalog.module.css";

interface CategoryMenuListProps {
  menus: readonly MenuItem[];
  onAddAction?: (menu: MenuItem) => void;
}

export function CategoryMenuList({ menus, onAddAction }: CategoryMenuListProps) {
  return (
    <div className={styles.categoryList} role="list">
      {menus.map((menu) => (
        <MenuListItem key={menu.id} menu={menu} onAddAction={onAddAction} />
      ))}
    </div>
  );
}
