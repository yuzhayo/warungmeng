import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { MenuVariantGroup } from "@warungmeng/domain";
import { Button, Empty, Flex, Switch, Table, Tooltip, Typography } from "antd";
import type { TableProps } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface VariantGroupListTableProps {
  readonly connectedMenuCounts: ReadonlyMap<string, number>;
  readonly groups: readonly MenuVariantGroup[];
  readonly loading: boolean;
  readonly pendingGroupIds: ReadonlySet<string>;
  readonly onDelete: (group: MenuVariantGroup) => void;
  readonly onEdit: (group: MenuVariantGroup) => void;
  readonly onVisibilityChange: (groupId: string, visible: boolean) => void;
}

const { Text } = Typography;

export function VariantGroupListTable({
  connectedMenuCounts,
  groups,
  loading,
  pendingGroupIds,
  onDelete,
  onEdit,
  onVisibilityChange,
}: VariantGroupListTableProps) {
  const { t } = useTranslation();

  const columns = useMemo<TableProps<MenuVariantGroup>["columns"]>(
    () => [
      {
        dataIndex: "name",
        key: "name",
        title: t("variants.table.name"),
        width: "18%",
        render: (name: string) => <Text strong>{name}</Text>,
      },
      {
        key: "options",
        title: t("variants.table.options"),
        width: "32%",
        render: (_, group) => {
          const optionNames = group.options.map((option) => option.name).join(", ");
          return <Text ellipsis={{ tooltip: optionNames }}>{optionNames}</Text>;
        },
      },
      {
        dataIndex: "description",
        key: "description",
        title: t("variants.table.note"),
        width: "16%",
        render: (description: string) => (
          <Text ellipsis={{ tooltip: description || undefined }}>{description || "—"}</Text>
        ),
      },
      {
        align: "center",
        key: "connectedMenus",
        title: t("variants.table.connectedMenus"),
        width: "11%",
        render: (_, group) => <Text>{connectedMenuCounts.get(group.id) ?? 0}</Text>,
      },
      {
        key: "visibility",
        title: t("variants.table.visibility"),
        width: "15%",
        render: (_, group) => {
          const visible = group.visibility === "visible";
          return (
            <Flex align="center" gap="small">
              <Switch
                aria-label={t("variants.actions.toggleVisibility", { name: group.name })}
                checked={visible}
                loading={pendingGroupIds.has(group.id)}
                onChange={(checked) => onVisibilityChange(group.id, checked)}
                size="small"
              />
              <Text>{t(visible ? "menu.visibility.visible" : "menu.visibility.hidden")}</Text>
            </Flex>
          );
        },
      },
      {
        align: "center",
        key: "actions",
        title: t("variants.table.actions"),
        width: "8%",
        render: (_, group) => (
          <Flex gap="small" justify="center">
            <Tooltip title={t("variants.actions.edit", { name: group.name })}>
              <Button
                aria-label={t("variants.actions.edit", { name: group.name })}
                icon={<EditOutlined />}
                onClick={() => onEdit(group)}
                type="text"
              />
            </Tooltip>
            <Tooltip title={t("variants.actions.delete", { name: group.name })}>
              <Button
                aria-label={t("variants.actions.delete", { name: group.name })}
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(group)}
                type="text"
              />
            </Tooltip>
          </Flex>
        ),
      },
    ],
    [connectedMenuCounts, onDelete, onEdit, onVisibilityChange, pendingGroupIds, t],
  );

  return (
    <Table<MenuVariantGroup>
      columns={columns}
      dataSource={[...groups]}
      loading={loading}
      locale={{
        emptyText: <Empty description={t("variants.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
      pagination={false}
      rowKey="id"
      scroll={{
        x: 1050,
        y: "clamp(20rem, calc(100dvh - 19rem), 52rem)",
      }}
      size="medium"
      tableLayout="fixed"
    />
  );
}
