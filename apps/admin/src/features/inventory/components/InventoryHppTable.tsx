import { EditOutlined } from "@ant-design/icons";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import { Button, Empty, Table, Tag, Typography, type TableColumnsType } from "antd";
import { useTranslation } from "react-i18next";
import type { InventoryHppRow } from "../application/useInventoryHpp";

interface InventoryHppTableProps {
  readonly loading: boolean;
  readonly rows: readonly InventoryHppRow[];
  readonly onEdit: (row: InventoryHppRow) => void;
}

export function InventoryHppTable({ loading, rows, onEdit }: InventoryHppTableProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const money = (amount: number) => formatRupiah(amount, { regionalFormat });
  const columns: TableColumnsType<InventoryHppRow> = [
    {
      key: "menu",
      title: t("inventory.hpp.menu"),
      width: "15rem",
      render: (_, row) => (
        <div className="inventory-table__stack">
          <Typography.Text strong>{row.menu.name}</Typography.Text>
          <Typography.Text type="secondary">{money(row.menu.price.amount)}</Typography.Text>
        </div>
      ),
    },
    {
      key: "recipe",
      title: t("inventory.hpp.recipe"),
      width: "10rem",
      render: (_, row) =>
        row.recipe ? (
          `${row.recipe.components.length} ${t("inventory.hpp.component")}`
        ) : (
          <Tag>{t("inventory.hpp.noRecipe")}</Tag>
        ),
    },
    {
      align: "right",
      key: "ingredients",
      title: t("inventory.hpp.ingredientCost"),
      width: "10rem",
      render: (_, row) => (row.hpp ? money(row.hpp.ingredientTotal.amount) : "—"),
    },
    {
      align: "right",
      key: "packaging",
      title: t("inventory.hpp.packaging"),
      width: "9rem",
      render: (_, row) => (row.hpp ? money(row.hpp.packagingCost.amount) : "—"),
    },
    {
      align: "right",
      key: "additional",
      title: t("inventory.hpp.additional"),
      width: "9rem",
      render: (_, row) => (row.hpp ? money(row.hpp.additionalCost.amount) : "—"),
    },
    {
      align: "right",
      key: "total",
      title: t("inventory.hpp.total"),
      width: "10rem",
      render: (_, row) =>
        row.hpp ? <Typography.Text strong>{money(row.hpp.total.amount)}</Typography.Text> : "—",
    },
    {
      align: "right",
      key: "recommendedPrice",
      title: t("inventory.hpp.recommendedPrice"),
      width: "10rem",
      render: (_, row) => (row.recommendedPrice === null ? "—" : money(row.recommendedPrice)),
    },
    {
      align: "right",
      key: "margin",
      title: t("inventory.hpp.margin"),
      width: "8rem",
      render: (_, row) =>
        row.marginPercentage === null ? (
          "—"
        ) : (
          <Tag
            color={
              row.marginPercentage >= 50
                ? "success"
                : row.marginPercentage >= 30
                  ? "warning"
                  : "error"
            }
          >
            {row.marginPercentage}%
          </Tag>
        ),
    },
    {
      align: "center",
      fixed: "right",
      key: "actions",
      title: t("inventory.hpp.actions"),
      width: "6rem",
      render: (_, row) => (
        <Button
          aria-label={t("inventory.hpp.edit", { name: row.menu.name })}
          icon={<EditOutlined />}
          onClick={() => onEdit(row)}
          type="text"
        />
      ),
    },
  ];

  return (
    <Table<InventoryHppRow>
      columns={columns}
      dataSource={[...rows]}
      loading={loading}
      locale={{
        emptyText: (
          <Empty description={t("inventory.hpp.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ),
      }}
      pagination={false}
      rowKey={(row) => row.menu.id}
      scroll={{ x: "max-content", y: "calc(100dvh - 20rem)" }}
      size="medium"
      sticky
    />
  );
}
