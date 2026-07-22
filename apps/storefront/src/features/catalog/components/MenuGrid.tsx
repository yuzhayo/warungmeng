import { Col, Row } from "antd";
import type { MenuItem } from "@warungmeng/domain";
import { MenuCard } from "./MenuCard";

interface MenuGridProps {
  menus: readonly MenuItem[];
  onAddAction?: (menu: MenuItem) => void;
}

export function MenuGrid({ menus, onAddAction }: MenuGridProps) {
  return (
    <Row gutter={[16, 16]} role="list">
      {menus.map((menu) => (
        <Col xs={12} sm={12} md={6} key={menu.id} role="listitem">
          <MenuCard menu={menu} onAddAction={onAddAction} />
        </Col>
      ))}
    </Row>
  );
}
