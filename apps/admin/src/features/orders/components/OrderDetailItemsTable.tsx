import type { OrderItem } from "@warungmeng/domain";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import { Table, Typography, type TableColumnsType } from "antd";
import { useTranslation } from "react-i18next";

export function OrderDetailItemsTable({ items }: { readonly items: readonly OrderItem[] }) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const columns: TableColumnsType<OrderItem> = [
    {
      key: "item",
      title: t("orders.detail.item"),
      render: (_, item) => (
        <div className="order-detail__item-name">
          <Typography.Text strong>{item.name}</Typography.Text>
          {item.variantSelections.map((selection) => (
            <Typography.Text key={`${selection.groupId}-${selection.optionId}`} type="secondary">
              {selection.groupName}: {selection.optionName}
            </Typography.Text>
          ))}
          {item.note ? <Typography.Text type="secondary">{item.note}</Typography.Text> : null}
        </div>
      ),
    },
    {
      align: "center",
      dataIndex: "quantity",
      key: "quantity",
      title: t("orders.detail.quantity"),
      width: "6rem",
    },
    {
      align: "right",
      key: "unitPrice",
      title: t("orders.detail.unitPrice"),
      width: "10rem",
      render: (_, item) => formatRupiah(item.unitPrice.amount, { regionalFormat }),
    },
    {
      align: "right",
      key: "lineTotal",
      title: t("orders.detail.lineTotal"),
      width: "10rem",
      render: (_, item) => (
        <Typography.Text strong>
          {formatRupiah(item.lineTotal.amount, { regionalFormat })}
        </Typography.Text>
      ),
    },
  ];

  return (
    <Table<OrderItem>
      columns={columns}
      dataSource={[...items]}
      pagination={false}
      rowKey="id"
      scroll={{ x: "max-content" }}
      size="small"
    />
  );
}
