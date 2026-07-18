import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import { Button, Empty, Flex, Input, Popconfirm, Switch, Table, Typography } from "antd";
import type { TableProps } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { VariantOptionListItem } from "../application/variantGroupListModel";
import {
  validateVariantOptionQuickEdit,
  type VariantOptionQuickEdit,
} from "../application/variantOptionCommands";
import "./VariantOptionListTable.css";

export interface VariantOptionListTableProps {
  readonly items: readonly VariantOptionListItem[];
  readonly loading: boolean;
  readonly pendingOptionIds: ReadonlySet<string>;
  readonly onAvailabilityChange: (
    groupId: string,
    optionId: string,
    available: boolean,
  ) => Promise<boolean>;
  readonly onDelete: (groupId: string, optionId: string) => Promise<boolean>;
  readonly onSave: (
    groupId: string,
    optionId: string,
    input: VariantOptionQuickEdit,
  ) => Promise<boolean>;
}

interface EditDraft {
  readonly name: string;
  readonly priceAmount: string;
}

const { Text } = Typography;

export function VariantOptionListTable({
  items,
  loading,
  pendingOptionIds,
  onAvailabilityChange,
  onDelete,
  onSave,
}: VariantOptionListTableProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft>({ name: "", priceAmount: "" });
  const priceAmount = Number.parseInt(draft.priceAmount, 10);
  const validDraft = validateVariantOptionQuickEdit({ name: draft.name, priceAmount });

  const columns = useMemo<TableProps<VariantOptionListItem>["columns"]>(
    () => [
      {
        key: "name",
        title: t("variants.options.table.name"),
        width: "30%",
        render: (_, item) =>
          editingRowId === item.id ? (
            <Input
              aria-label={t("variants.options.fields.name", { name: item.option.name })}
              maxLength={120}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
              status={draft.name.trim() ? undefined : "error"}
              value={draft.name}
            />
          ) : (
            <Text strong>{item.option.name}</Text>
          ),
      },
      {
        dataIndex: "groupName",
        key: "group",
        title: t("variants.options.table.category"),
        width: "22%",
        render: (groupName: string) => <Text>{groupName}</Text>,
      },
      {
        key: "price",
        title: t("variants.options.table.price"),
        width: "18%",
        render: (_, item) =>
          editingRowId === item.id ? (
            <Input
              aria-label={t("variants.options.fields.price", { name: item.option.name })}
              inputMode="numeric"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  priceAmount: event.target.value.replace(/\D/g, ""),
                }))
              }
              prefix="Rp"
              status={draft.priceAmount ? undefined : "error"}
              value={draft.priceAmount}
            />
          ) : (
            <Text>
              {item.option.priceAdjustment.amount > 0 ? "+" : ""}
              {formatRupiah(item.option.priceAdjustment.amount, { regionalFormat })}
            </Text>
          ),
      },
      {
        key: "availability",
        title: t("variants.options.table.availability"),
        width: "18%",
        render: (_, item) => {
          const available = item.option.availability.status === "available";
          const pending = pendingOptionIds.has(item.option.id);

          return (
            <Flex align="center" gap="small">
              <Switch
                aria-label={t("variants.options.actions.toggleAvailability", {
                  name: item.option.name,
                })}
                checked={available}
                disabled={editingRowId === item.id}
                loading={pending}
                onChange={(checked) => {
                  void onAvailabilityChange(item.groupId, item.option.id, checked);
                }}
                size="small"
              />
              <Text>
                {t(available ? "menu.availability.available" : "menu.availability.unavailable")}
              </Text>
            </Flex>
          );
        },
      },
      {
        align: "center",
        key: "actions",
        title: t("variants.options.table.actions"),
        width: "12%",
        render: (_, item) => {
          const editing = editingRowId === item.id;
          const pending = pendingOptionIds.has(item.option.id);

          return (
            <Flex gap="small" justify="center">
              {editing ? (
                <>
                  <Button
                    aria-label={t("variants.options.actions.saveFor", {
                      name: item.option.name,
                    })}
                    disabled={!validDraft}
                    icon={<CheckOutlined />}
                    loading={pending}
                    onClick={() => {
                      if (!validDraft) return;
                      void onSave(item.groupId, item.option.id, {
                        name: draft.name.trim(),
                        priceAmount,
                      }).then((saved) => {
                        if (saved) setEditingRowId(null);
                      });
                    }}
                    type="text"
                  />
                  <Button
                    aria-label={t("variants.options.actions.cancelFor", {
                      name: item.option.name,
                    })}
                    disabled={pending}
                    icon={<CloseOutlined />}
                    onClick={() => setEditingRowId(null)}
                    type="text"
                  />
                </>
              ) : (
                <>
                  <Button
                    aria-label={t("variants.options.actions.quickEditFor", {
                      name: item.option.name,
                    })}
                    disabled={pending}
                    icon={<EditOutlined />}
                    onClick={() => {
                      setDraft({
                        name: item.option.name,
                        priceAmount: String(item.option.priceAdjustment.amount),
                      });
                      setEditingRowId(item.id);
                    }}
                    type="text"
                  />
                  <Popconfirm
                    cancelText={t("variants.options.actions.cancel")}
                    description={t("variants.options.delete.description")}
                    disabled={pending}
                    okButtonProps={{ danger: true }}
                    okText={t("variants.options.actions.delete")}
                    onConfirm={() => onDelete(item.groupId, item.option.id)}
                    title={t("variants.options.delete.title", { name: item.option.name })}
                  >
                    <Button
                      aria-label={t("variants.options.actions.deleteFor", {
                        name: item.option.name,
                      })}
                      danger
                      disabled={pending}
                      icon={<DeleteOutlined />}
                      type="text"
                    />
                  </Popconfirm>
                </>
              )}
            </Flex>
          );
        },
      },
    ],
    [
      draft,
      editingRowId,
      onAvailabilityChange,
      onDelete,
      onSave,
      pendingOptionIds,
      priceAmount,
      regionalFormat,
      t,
      validDraft,
    ],
  );

  return (
    <Table<VariantOptionListItem>
      className="variant-option-list-table"
      columns={columns}
      dataSource={[...items]}
      loading={loading}
      locale={{
        emptyText: (
          <Empty description={t("variants.options.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ),
      }}
      pagination={false}
      rowKey="id"
      scroll={{
        x: 900,
        y: "clamp(20rem, calc(100dvh - 19rem), 52rem)",
      }}
      size="medium"
      tableLayout="fixed"
    />
  );
}
