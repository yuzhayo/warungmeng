import { EyeOutlined } from "@ant-design/icons";
import type { Order } from "@warungmeng/domain";
import { formatDate, formatRupiah, formatTime, useLocaleSettings } from "@warungmeng/i18n";
import { Button, Empty, Table, Typography, type TableColumnsType } from "antd";
import { useTranslation } from "react-i18next";
import { OrderPaymentStatusTag, OrderStatusTag } from "./OrderStatusTag";

interface OrderListTableProps {
  readonly loading: boolean;
  readonly orders: readonly Order[];
  readonly onOpen: (order: Order) => void;
}

export function OrderListTable({ loading, orders, onOpen }: OrderListTableProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const columns: TableColumnsType<Order> = [
    {
      key: "orderNumber",
      title: t("orders.table.orderNumber"),
      width: "10rem",
      render: (_, order) => <Typography.Text strong>{order.orderNumber}</Typography.Text>,
    },
    {
      key: "createdAt",
      title: t("orders.table.createdAt"),
      width: "10rem",
      render: (_, order) => {
        const value = new Date(order.createdAt);
        return (
          <div className="order-list-table__stack">
            <span>{formatDate(value, { regionalFormat })}</span>
            <Typography.Text type="secondary">
              {formatTime(value, { regionalFormat })}
            </Typography.Text>
          </div>
        );
      },
    },
    {
      key: "customer",
      title: t("orders.table.customer"),
      width: "12rem",
      render: (_, order) => (
        <div className="order-list-table__stack">
          <span>{order.customer?.name || t("orders.customer.walkIn")}</span>
          {order.customer?.phone ? (
            <Typography.Text type="secondary">{order.customer.phone}</Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      dataIndex: "outletName",
      key: "outlet",
      title: t("orders.table.outlet"),
      width: "11rem",
    },
    {
      key: "channel",
      title: t("orders.table.channel"),
      width: "9rem",
      render: (_, order) => t(`orders.channel.${order.channel}`),
    },
    {
      key: "status",
      title: t("orders.table.status"),
      width: "9rem",
      render: (_, order) => <OrderStatusTag status={order.status} />,
    },
    {
      key: "payment",
      title: t("orders.table.payment"),
      width: "8rem",
      render: (_, order) => <OrderPaymentStatusTag status={order.paymentStatus} />,
    },
    {
      align: "right",
      key: "total",
      title: t("orders.table.total"),
      width: "9rem",
      render: (_, order) => (
        <Typography.Text strong>
          {formatRupiah(order.totals.total.amount, { regionalFormat })}
        </Typography.Text>
      ),
    },
    {
      align: "center",
      fixed: "right",
      key: "actions",
      title: t("orders.table.actions"),
      width: "6rem",
      render: (_, order) => (
        <Button
          aria-label={t("orders.actions.open", { orderNumber: order.orderNumber })}
          icon={<EyeOutlined />}
          onClick={() => onOpen(order)}
          type="text"
        />
      ),
    },
  ];

  return (
    <Table<Order>
      columns={columns}
      dataSource={[...orders]}
      loading={loading}
      locale={{
        emptyText: <Empty description={t("orders.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
      pagination={false}
      rowKey="id"
      scroll={{ x: "max-content", y: "calc(100dvh - 21rem)" }}
      size="medium"
      sticky
    />
  );
}
