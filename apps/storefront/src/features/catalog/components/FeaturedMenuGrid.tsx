import { Col, Row } from "antd";
import type { MenuItem } from "@warungmeng/domain";
import { FeaturedMenuCard } from "./FeaturedMenuCard";

interface FeaturedMenuGridProps {
  menus: readonly MenuItem[];
}

export function FeaturedMenuGrid({ menus }: FeaturedMenuGridProps) {
  return (
    <Row gutter={[16, 16]}>
      {menus.map((menu) => (
        <Col xs={12} sm={12} md={6} key={menu.id}>
          <FeaturedMenuCard menu={menu} />
        </Col>
      ))}
    </Row>
  );
}
