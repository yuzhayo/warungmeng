import { List } from "antd";
import type { MenuItem } from "@warungmeng/domain";
import { MenuListItem } from "./MenuListItem";
import styles from "../StorefrontCatalog.module.css";

interface CategoryMenuListProps {
  menus: readonly MenuItem[];
  onAddAction?: (menu: MenuItem) => void;
}

export function CategoryMenuList({ menus, onAddAction }: CategoryMenuListProps) {
  return (
    <List
      className={styles.categoryList}
      dataSource={[...menus]}
      renderItem={(menu) => <MenuListItem menu={menu} onAddAction={onAddAction} />}
      rowKey="id"
    />
  );
}
