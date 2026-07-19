import type { InventoryIngredient, InventoryMovement } from "@warungmeng/domain";
import { formatDate, formatRupiah, formatTime, useLocaleSettings } from "@warungmeng/i18n";
import type { TranslationKey } from "@warungmeng/i18n";
import { Empty, Table, Tag, Typography, type TableColumnsType } from "antd";
import { useTranslation } from "react-i18next";

interface InventoryMovementsTableProps {
  readonly ingredients: readonly InventoryIngredient[];
  readonly loading: boolean;
  readonly movements: readonly InventoryMovement[];
}

export function InventoryMovementsTable({
  ingredients,
  loading,
  movements,
}: InventoryMovementsTableProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const columns: TableColumnsType<InventoryMovement> = [
    {
      key: "occurredAt",
      title: t("inventory.movements.date"),
      width: "10rem",
      render: (_, movement) => {
        const value = new Date(movement.occurredAt);
        return (
          <div className="inventory-table__stack">
            <span>{formatDate(value, { regionalFormat })}</span>
            <Typography.Text type="secondary">
              {formatTime(value, { regionalFormat })}
            </Typography.Text>
          </div>
        );
      },
    },
    {
      key: "ingredient",
      title: t("inventory.movements.ingredient"),
      width: "13rem",
      render: (_, movement) =>
        ingredientById.get(movement.ingredientId)?.name ?? movement.ingredientId,
    },
    {
      key: "type",
      title: t("inventory.movements.type"),
      width: "10rem",
      render: (_, movement) => (
        <Tag color={movement.baseQuantityDelta < 0 ? "warning" : "success"}>
          {t(`inventory.movements.${movement.type}` as TranslationKey)}
        </Tag>
      ),
    },
    {
      align: "right",
      key: "quantity",
      title: t("inventory.movements.quantity"),
      width: "9rem",
      render: (_, movement) => (
        <Typography.Text
          className="inventory-table__number"
          type={movement.baseQuantityDelta < 0 ? "danger" : "success"}
        >
          {movement.baseQuantityDelta > 0 ? "+" : ""}
          {movement.baseQuantityDelta.toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
          {ingredientById.get(movement.ingredientId)?.baseUnit}
        </Typography.Text>
      ),
    },
    {
      align: "right",
      key: "unitCost",
      title: t("inventory.movements.unitCost"),
      width: "10rem",
      render: (_, movement) =>
        movement.unitCost ? formatRupiah(movement.unitCost.amount, { regionalFormat }) : "—",
    },
    {
      dataIndex: "note",
      key: "note",
      title: t("inventory.movements.note"),
      width: "14rem",
      ellipsis: true,
      render: (note: string) => note || "—",
    },
    {
      dataIndex: "referenceId",
      key: "reference",
      title: t("inventory.movements.reference"),
      width: "10rem",
      render: (reference: string | null) => reference ?? "—",
    },
  ];

  return (
    <Table<InventoryMovement>
      columns={columns}
      dataSource={[...movements]}
      loading={loading}
      locale={{
        emptyText: (
          <Empty
            description={t("inventory.movements.empty")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ),
      }}
      pagination={false}
      rowKey="id"
      scroll={{ x: "max-content", y: "calc(100dvh - 22rem)" }}
      size="medium"
      sticky
    />
  );
}
