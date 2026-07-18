import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useSingleExpandedRow } from "@warungmeng/ui-admin";
import type { MenuVariantGroup } from "@warungmeng/domain";
import { Button, Empty, Flex, Switch, Table, Tooltip, Typography } from "antd";
import type { TableProps } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { VariantOptionQuickEdit } from "../application/variantOptionCommands";
import { VariantOptionQuickList } from "./VariantOptionQuickList";

export interface VariantGroupListTableProps {
  readonly connectedMenuCounts: ReadonlyMap<string, number>;
  readonly groups: readonly MenuVariantGroup[];
  readonly loading: boolean;
  readonly pendingGroupIds: ReadonlySet<string>;
  readonly pendingOptionIds: ReadonlySet<string>;
  readonly onDelete: (group: MenuVariantGroup) => void;
  readonly onEdit: (group: MenuVariantGroup) => void;
  readonly onOptionAvailabilityChange: (
    groupId: string,
    optionId: string,
    available: boolean,
  ) => Promise<boolean>;
  readonly onOptionDelete: (groupId: string, optionId: string) => Promise<boolean>;
  readonly onOptionSave: (
    groupId: string,
    optionId: string,
    input: VariantOptionQuickEdit,
  ) => Promise<boolean>;
  readonly onVisibilityChange: (groupId: string, visible: boolean) => void;
}

const { Text } = Typography;

function getVariantGroupRowKey(group: MenuVariantGroup): string {
  return group.id;
}

export function VariantGroupListTable({
  connectedMenuCounts,
  groups,
  loading,
  pendingGroupIds,
  pendingOptionIds,
  onDelete,
  onEdit,
  onOptionAvailabilityChange,
  onOptionDelete,
  onOptionSave,
  onVisibilityChange,
}: VariantGroupListTableProps) {
  const { t } = useTranslation();
  const expansion = useSingleExpandedRow(getVariantGroupRowKey);

  const columns = useMemo<TableProps<MenuVariantGroup>["columns"]>(
    () => [
      {
        dataIndex: "name",
        key: "name",
        title: t("variants.table.name"),
        width: "25%",
        render: (name: string) => <Text strong>{name}</Text>,
      },
      {
        key: "options",
        title: t("variants.table.options"),
        width: "25%",
        render: (_, group) => (
          <Text>{t("variants.table.optionCount", { count: group.options.length })}</Text>
        ),
      },
      {
        align: "center",
        key: "connectedMenus",
        title: t("variants.table.connectedMenus"),
        width: "15%",
        render: (_, group) => <Text>{connectedMenuCounts.get(group.id) ?? 0}</Text>,
      },
      {
        key: "visibility",
        title: t("variants.table.visibility"),
        width: "22%",
        render: (_, group) => {
          const visible = group.visibility === "visible";
          return (
            <Flex align="center" gap="small" onClick={(event) => event.stopPropagation()}>
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
        width: "13%",
        render: (_, group) => (
          <Flex gap="small" justify="center" onClick={(event) => event.stopPropagation()}>
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
      expandable={{
        expandRowByClick: true,
        expandedRowKeys: [...expansion.expandedRowKeys],
        expandedRowRender: (group) => (
          <VariantOptionQuickList
            group={group}
            onAvailabilityChange={onOptionAvailabilityChange}
            onDelete={onOptionDelete}
            onSave={onOptionSave}
            pendingOptionIds={pendingOptionIds}
          />
        ),
        onExpand: expansion.onExpand,
        rowExpandable: (group) => group.options.length > 0,
        showExpandColumn: false,
      }}
      loading={loading}
      locale={{
        emptyText: <Empty description={t("variants.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
      pagination={false}
      rowKey="id"
      rowClassName="variant-group-list-table__row"
      onRow={(group) => ({
        "aria-expanded": expansion.isExpanded(group),
        onKeyDown: (event) => {
          if (
            (event.key === "Enter" || event.key === " ") &&
            event.target === event.currentTarget
          ) {
            event.preventDefault();
            expansion.toggle(group);
          }
        },
        tabIndex: 0,
      })}
      scroll={{
        x: 1050,
        y: "clamp(20rem, calc(100dvh - 19rem), 52rem)",
      }}
      size="medium"
      tableLayout="fixed"
    />
  );
}
