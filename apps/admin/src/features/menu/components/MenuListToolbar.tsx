import { PlusOutlined } from "@ant-design/icons";
import { Button, Input, Segmented } from "antd";
import { useTranslation } from "react-i18next";
import type { MenuAvailabilityFilter } from "../application/menuListModel";

export interface MenuListToolbarProps {
  readonly search: string;
  readonly availability: MenuAvailabilityFilter;
  readonly allCount: number;
  readonly unavailableCount: number;
  readonly onSearchChange: (search: string) => void;
  readonly onAvailabilityChange: (availability: MenuAvailabilityFilter) => void;
  readonly onCreateCategory: () => void;
  readonly onCreateMenu: () => void;
}

const { Search } = Input;

export function MenuListToolbar({
  search,
  availability,
  allCount,
  unavailableCount,
  onSearchChange,
  onAvailabilityChange,
  onCreateCategory,
  onCreateMenu,
}: MenuListToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="menu-list-toolbar">
      <div className="menu-list-toolbar__filters">
        <Search
          allowClear
          aria-label={t("menu.search.placeholder")}
          enterButton={t("menu.search.action")}
          onChange={(event) => onSearchChange(event.target.value)}
          onSearch={onSearchChange}
          placeholder={t("menu.search.placeholder")}
          value={search}
        />
        <Segmented<MenuAvailabilityFilter>
          aria-label={t("menu.table.stock")}
          onChange={onAvailabilityChange}
          options={[
            { label: `${t("menu.filter.all")} (${allCount})`, value: "all" },
            {
              label: `${t("menu.filter.unavailable")} (${unavailableCount})`,
              value: "unavailable",
            },
          ]}
          value={availability}
        />
      </div>
      <div className="menu-list-toolbar__actions">
        <Button icon={<PlusOutlined />} onClick={onCreateCategory}>
          {t("menu.actions.createCategory")}
        </Button>
        <Button icon={<PlusOutlined />} onClick={onCreateMenu} type="primary">
          {t("menu.actions.createMenu")}
        </Button>
      </div>
    </div>
  );
}
