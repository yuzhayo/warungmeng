import type { MenuCategory, MenuItem } from "@warungmeng/domain";
import { Flex, Input, Space, Switch, Table, Typography } from "antd";
import type { TableProps } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface VariantConnectedMenuFieldsProps {
  readonly categories: readonly MenuCategory[];
  readonly menus: readonly MenuItem[];
  readonly value?: readonly string[];
  readonly onChange?: (menuIds: readonly string[]) => void;
}

export function VariantConnectedMenuFields({
  categories,
  menus,
  value = [],
  onChange,
}: VariantConnectedMenuFieldsProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const filteredMenus = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return menus;
    return menus.filter(
      (menu) =>
        menu.name.toLocaleLowerCase().includes(query) ||
        (categoryNames.get(menu.categoryId) ?? "").toLocaleLowerCase().includes(query),
    );
  }, [categoryNames, menus, search]);

  const columns = useMemo<TableProps<MenuItem>["columns"]>(
    () => [
      {
        dataIndex: "name",
        key: "name",
        title: t("variants.editor.connectedMenus.menu"),
      },
      {
        key: "category",
        title: t("variants.editor.connectedMenus.category"),
        render: (_, menu) => categoryNames.get(menu.categoryId) ?? "—",
      },
      {
        key: "availability",
        title: t("variants.editor.connectedMenus.availability"),
        render: (_, menu) =>
          t(
            menu.availability.status === "available"
              ? "menu.availability.available"
              : "menu.availability.unavailable",
          ),
      },
      {
        key: "visibility",
        title: t("variants.editor.connectedMenus.visibility"),
        render: (_, menu) => (
          <Space size="small">
            <Switch
              aria-label={t("variants.editor.connectedMenus.visibilityFor", {
                name: menu.name,
              })}
              checked={menu.visibility === "visible"}
              disabled
              size="small"
            />
            <Typography.Text>
              {t(
                menu.visibility === "visible"
                  ? "menu.visibility.visible"
                  : "menu.visibility.hidden",
              )}
            </Typography.Text>
          </Space>
        ),
      },
    ],
    [categoryNames, t],
  );

  return (
    <Flex gap="middle" style={{ width: "100%" }} vertical>
      <Space align="center" wrap>
        <Input.Search
          allowClear
          aria-label={t("variants.editor.connectedMenus.search")}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("variants.editor.connectedMenus.search")}
          value={search}
        />
        <Typography.Text type="secondary">
          {t("variants.editor.connectedMenus.selected", { count: value.length })}
        </Typography.Text>
      </Space>

      <Table<MenuItem>
        columns={columns}
        dataSource={[...filteredMenus]}
        locale={{ emptyText: t("variants.editor.connectedMenus.empty") }}
        pagination={false}
        rowKey="id"
        rowSelection={{
          preserveSelectedRowKeys: true,
          selectedRowKeys: [...value],
          onChange: (keys) => onChange?.(keys.map(String)),
        }}
        scroll={{ x: 720, y: 320 }}
        size="small"
      />
    </Flex>
  );
}
