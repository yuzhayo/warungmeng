import { EditOutlined } from "@ant-design/icons";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import type { MenuItem } from "@warungmeng/domain";
import { Avatar, Button, Empty, Flex, Switch, Table, Tooltip, Typography } from "antd";
import type { TableProps } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface MenuListTableProps {
  readonly menus: readonly MenuItem[];
  readonly loading: boolean;
  readonly pendingMenuIds: ReadonlySet<string>;
  readonly onAvailabilityChange: (menuId: string, available: boolean) => void;
  readonly onVisibilityChange: (menuId: string, visible: boolean) => void;
  readonly onEdit: (menu: MenuItem) => void;
}

const { Text } = Typography;

export function MenuListTable({
  menus,
  loading,
  pendingMenuIds,
  onAvailabilityChange,
  onVisibilityChange,
  onEdit,
}: MenuListTableProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();

  const columns = useMemo<TableProps<MenuItem>["columns"]>(
    () => [
      {
        key: "name",
        title: t("menu.table.name"),
        width: 300,
        render: (_, menu) => (
          <Flex align="center" gap="middle">
            <Avatar
              alt={menu.image?.alt ?? menu.name}
              shape="square"
              size={48}
              src={menu.image?.url}
            >
              {menu.name.slice(0, 1)}
            </Avatar>
            <div className="menu-list-table__identity">
              <Text strong>{menu.name}</Text>
              {menu.description ? (
                <Text ellipsis={{ tooltip: menu.description }} type="secondary">
                  {menu.description}
                </Text>
              ) : null}
            </div>
          </Flex>
        ),
      },
      {
        key: "price",
        title: t("menu.table.price"),
        width: 140,
        render: (_, menu) => (
          <Text strong>{formatRupiah(menu.price.amount, { regionalFormat })}</Text>
        ),
      },
      {
        key: "schedule",
        title: t("menu.table.schedule"),
        width: 160,
        render: (_, menu) =>
          menu.salesSchedule.mode === "always"
            ? t("menu.schedule.always")
            : t("menu.schedule.scheduled"),
      },
      {
        key: "visibility",
        title: t("menu.table.visibility"),
        width: 175,
        render: (_, menu) => {
          const visible = menu.visibility === "visible";
          return (
            <Flex align="center" gap="small">
              <Switch
                aria-label={t("menu.actions.toggleVisibility", { name: menu.name })}
                checked={visible}
                loading={pendingMenuIds.has(menu.id)}
                onChange={(checked) => onVisibilityChange(menu.id, checked)}
                size="small"
              />
              <Text>{t(visible ? "menu.visibility.visible" : "menu.visibility.hidden")}</Text>
            </Flex>
          );
        },
      },
      {
        key: "availability",
        title: t("menu.table.stock"),
        width: 190,
        render: (_, menu) => {
          const available = menu.availability.status === "available";
          return (
            <Flex align="center" gap="small">
              <Switch
                aria-label={t("menu.actions.toggleAvailability", { name: menu.name })}
                checked={available}
                loading={pendingMenuIds.has(menu.id)}
                onChange={(checked) => onAvailabilityChange(menu.id, checked)}
                size="small"
              />
              <div className="menu-list-table__status">
                <Text>
                  {t(available ? "menu.availability.available" : "menu.availability.unavailable")}
                </Text>
                <Text type="secondary">
                  {menu.inventory.mode === "tracked"
                    ? t("menu.stock.remaining", { count: menu.inventory.quantity })
                    : t("menu.stock.untracked")}
                </Text>
              </div>
            </Flex>
          );
        },
      },
      {
        align: "center",
        key: "actions",
        title: t("menu.table.actions"),
        width: 100,
        render: (_, menu) => (
          <Tooltip title={t("menu.actions.edit", { name: menu.name })}>
            <Button
              aria-label={t("menu.actions.edit", { name: menu.name })}
              icon={<EditOutlined />}
              onClick={() => onEdit(menu)}
              type="text"
            />
          </Tooltip>
        ),
      },
    ],
    [onAvailabilityChange, onEdit, onVisibilityChange, pendingMenuIds, regionalFormat, t],
  );

  return (
    <Table<MenuItem>
      bordered
      columns={columns}
      dataSource={[...menus]}
      loading={loading}
      locale={{
        emptyText: <Empty description={t("menu.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
      pagination={false}
      rowKey="id"
      scroll={{ x: "max-content" }}
      size="medium"
    />
  );
}
