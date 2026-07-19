import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type {
  InventoryIngredient,
  InventoryStockBalance,
  InventorySupplier,
} from "@warungmeng/domain";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import {
  Button,
  Empty,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { useTranslation } from "react-i18next";

interface InventoryMaterialsTableProps {
  readonly balanceByIngredientId: ReadonlyMap<string, InventoryStockBalance>;
  readonly ingredients: readonly InventoryIngredient[];
  readonly loading: boolean;
  readonly suppliers: readonly InventorySupplier[];
  readonly onArchive: (ingredient: InventoryIngredient) => void;
  readonly onEdit: (ingredient: InventoryIngredient) => void;
}

export function InventoryMaterialsTable({
  balanceByIngredientId,
  ingredients,
  loading,
  suppliers,
  onArchive,
  onEdit,
}: InventoryMaterialsTableProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  const columns: TableColumnsType<InventoryIngredient> = [
    {
      dataIndex: "name",
      key: "name",
      title: t("inventory.materials.name"),
      width: "14rem",
      render: (name: string, ingredient) => (
        <div className="inventory-table__stack">
          <Typography.Text strong>{name}</Typography.Text>
          <Typography.Text type="secondary">
            {supplierById.get(ingredient.supplierId ?? "")?.name ?? "—"}
          </Typography.Text>
        </div>
      ),
    },
    {
      key: "stock",
      title: t("inventory.materials.stock"),
      width: "10rem",
      render: (_, ingredient) => {
        const quantity = balanceByIngredientId.get(ingredient.id)?.quantity ?? 0;
        const low = quantity <= ingredient.minimumStock;
        return (
          <Space>
            <Typography.Text className="inventory-table__number" strong>
              {quantity.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {ingredient.baseUnit}
            </Typography.Text>
            <Tag color={low ? "warning" : "success"}>
              {t(low ? "inventory.materials.low" : "inventory.materials.normal")}
            </Tag>
          </Space>
        );
      },
    },
    {
      align: "right",
      dataIndex: "minimumStock",
      key: "minimumStock",
      title: t("inventory.materials.minimumStock"),
      width: "8rem",
      render: (value: number, ingredient) =>
        `${value.toLocaleString("id-ID")} ${ingredient.baseUnit}`,
    },
    {
      align: "right",
      key: "averageCost",
      title: t("inventory.materials.averageCost"),
      width: "12rem",
      render: (_, ingredient) =>
        `${formatRupiah(ingredient.averageUnitCost.amount, { regionalFormat })} / ${ingredient.baseUnit}`,
    },
    {
      key: "status",
      title: t("inventory.materials.status"),
      width: "7rem",
      render: (_, ingredient) => (
        <Tag color={ingredient.status === "active" ? "success" : "default"}>
          {t(`inventory.materials.${ingredient.status}`)}
        </Tag>
      ),
    },
    {
      align: "center",
      fixed: "right",
      key: "actions",
      title: t("inventory.materials.actions"),
      width: "7rem",
      render: (_, ingredient) => (
        <Space>
          <Button
            aria-label={t("inventory.materials.edit", { name: ingredient.name })}
            icon={<EditOutlined />}
            onClick={() => onEdit(ingredient)}
            type="text"
          />
          {ingredient.status === "active" ? (
            <Popconfirm
              description={t("inventory.materials.archiveDescription")}
              okButtonProps={{ danger: true }}
              onConfirm={() => onArchive(ingredient)}
              title={t("inventory.materials.archiveConfirm")}
            >
              <Button
                aria-label={t("inventory.materials.archive", { name: ingredient.name })}
                danger
                icon={<DeleteOutlined />}
                type="text"
              />
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Table<InventoryIngredient>
      columns={columns}
      dataSource={[...ingredients]}
      loading={loading}
      locale={{
        emptyText: (
          <Empty
            description={t("inventory.materials.empty")}
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
