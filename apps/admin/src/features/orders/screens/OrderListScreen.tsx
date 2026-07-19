import type { OrderRepository } from "@warungmeng/data";
import { Alert, Button } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { orderRepository } from "../application/orderRepository";
import { useOrderList } from "../application/useOrderList";
import { OrderListTable } from "../components/OrderListTable";
import { OrderListToolbar } from "../components/OrderListToolbar";
import "./OrderListScreen.css";

export interface OrderListScreenProps {
  readonly repository?: OrderRepository;
}

export function OrderListScreen({ repository = orderRepository }: OrderListScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const orderList = useOrderList(repository);

  return (
    <section aria-labelledby="order-list-title" className="order-list-screen">
      <header className="order-list-screen__header">
        <div>
          <h1 id="order-list-title">{t("screen.orders.title")}</h1>
          <p>{t("screen.orders.description")}</p>
        </div>
        <strong>{t("orders.summary.count", { count: orderList.orders.length })}</strong>
      </header>

      <OrderListToolbar
        filters={orderList.filters}
        onChange={orderList.updateFilters}
        onReset={orderList.resetFilters}
      />

      {orderList.error ? (
        <Alert
          action={
            <Button onClick={orderList.retry} size="small">
              {t("orders.actions.retry")}
            </Button>
          }
          showIcon
          title={t("orders.error.load")}
          type="error"
        />
      ) : null}

      <div className="order-list-screen__table">
        <OrderListTable
          loading={orderList.loading}
          onOpen={(order) => navigate(`/orders/${encodeURIComponent(order.id)}`)}
          orders={orderList.orders}
        />
      </div>
    </section>
  );
}
