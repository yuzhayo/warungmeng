import { List } from "antd";
import type { MenuItem } from "@warungmeng/domain";
import { MenuListItem } from "./MenuListItem";
import styles from "../StorefrontCatalog.module.css";

interface CategoryMenuListProps {
  menus: readonly MenuItem[];
}

export function CategoryMenuList({ menus }: CategoryMenuListProps) {
  return (
    <List
      className={styles.categoryList}
      dataSource={[...menus]}
      renderItem={(menu) => <MenuListItem menu={menu} />}
      rowKey="id"
    />
  );
}
