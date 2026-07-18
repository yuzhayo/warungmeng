import type { MenuVariantGroup } from "@warungmeng/domain";
import { Table, Tag, Typography } from "antd";
import type { TableProps } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface MenuEditorVariantFieldsProps {
  readonly groups: readonly MenuVariantGroup[];
  readonly value?: readonly string[];
  readonly onChange?: (groupIds: readonly string[]) => void;
}

export function MenuEditorVariantFields({
  groups,
  value = [],
  onChange,
}: MenuEditorVariantFieldsProps) {
  const { t } = useTranslation();
  const columns = useMemo<TableProps<MenuVariantGroup>["columns"]>(
    () => [
      {
        dataIndex: "name",
        key: "name",
        title: t("menu.editor.variants.name"),
      },
      {
        key: "options",
        title: t("menu.editor.variants.options"),
        render: (_, group) => (
          <>
            {group.options.slice(0, 4).map((option) => (
              <Tag key={option.id}>{option.name}</Tag>
            ))}
            {group.options.length > 4 ? (
              <Typography.Text type="secondary">+{group.options.length - 4}</Typography.Text>
            ) : null}
          </>
        ),
      },
      {
        key: "selection",
        title: t("menu.editor.variants.selection"),
        render: (_, group) =>
          group.selection.maxSelections === null
            ? `${group.selection.minSelections}+`
            : `${group.selection.minSelections}–${group.selection.maxSelections}`,
      },
    ],
    [t],
  );

  return (
    <Table<MenuVariantGroup>
      columns={columns}
      dataSource={[...groups]}
      locale={{ emptyText: t("menu.editor.variants.empty") }}
      pagination={false}
      rowKey="id"
      rowSelection={{
        preserveSelectedRowKeys: true,
        selectedRowKeys: [...value],
        onChange: (keys) => onChange?.(keys.map(String)),
      }}
      scroll={{ x: 640, y: 280 }}
      size="small"
    />
  );
}
