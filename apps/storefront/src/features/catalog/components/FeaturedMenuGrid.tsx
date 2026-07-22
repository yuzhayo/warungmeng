import { Col, Row } from "antd";
import type { MenuItem } from "@warungmeng/domain";
import { FeaturedMenuCard } from "./FeaturedMenuCard";

interface FeaturedMenuGridProps {
  menus: readonly MenuItem[];
  onAddAction?: (menu: MenuItem) => void;
}

export function FeaturedMenuGrid({ menus, onAddAction }: FeaturedMenuGridProps) {
  return (
    <Row gutter={[16, 16]}>
      {menus.map((menu) => (
        <Col xs={12} sm={12} md={6} key={menu.id}>
          <FeaturedMenuCard menu={menu} onAddAction={onAddAction} />
        </Col>
      ))}
    </Row>
  );
}
