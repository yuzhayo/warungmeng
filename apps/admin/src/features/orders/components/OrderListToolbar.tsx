import { SearchOutlined } from "@ant-design/icons";
import type { OrderChannel, OrderStatus } from "@warungmeng/domain";
import { Button, Input, Select } from "antd";
import { useTranslation } from "react-i18next";
import type { OrderListFilters } from "../application/useOrderList";

interface OrderListToolbarProps {
  readonly filters: OrderListFilters;
  readonly onChange: (patch: Partial<OrderListFilters>) => void;
  readonly onReset: () => void;
}

export function OrderListToolbar({ filters, onChange, onReset }: OrderListToolbarProps) {
  const { t } = useTranslation();
  const statusOptions: Array<{ label: string; value: OrderStatus }> = [
    "new",
    "accepted",
    "preparing",
    "ready",
    "completed",
    "cancelled",
  ].map((status) => ({
    value: status as OrderStatus,
    label: t(`orders.status.${status}`),
  }));
  const channelOptions: Array<{ label: string; value: OrderChannel }> = [
    "pos",
    "storefront",
    "manual",
  ].map((channel) => ({
    value: channel as OrderChannel,
    label: t(`orders.channel.${channel}`),
  }));

  return (
    <div className="order-list-toolbar">
      <Input
        allowClear
        aria-label={t("orders.search.label")}
        onChange={(event) => onChange({ search: event.target.value })}
        placeholder={t("orders.search.placeholder")}
        prefix={<SearchOutlined aria-hidden />}
        value={filters.search}
      />
      <Select
        allowClear
        aria-label={t("orders.filter.status")}
        onChange={(status: OrderStatus | undefined) => onChange({ status: status ?? null })}
        options={statusOptions}
        placeholder={t("orders.filter.status")}
        value={filters.status ?? undefined}
      />
      <Select
        allowClear
        aria-label={t("orders.filter.channel")}
        onChange={(channel: OrderChannel | undefined) => onChange({ channel: channel ?? null })}
        options={channelOptions}
        placeholder={t("orders.filter.channel")}
        value={filters.channel ?? undefined}
      />
      <Input
        aria-label={t("orders.filter.dateFrom")}
        onChange={(event) => onChange({ dateFrom: event.target.value })}
        type="date"
        value={filters.dateFrom}
      />
      <Input
        aria-label={t("orders.filter.dateTo")}
        onChange={(event) => onChange({ dateTo: event.target.value })}
        type="date"
        value={filters.dateTo}
      />
      <Button onClick={onReset}>{t("orders.actions.resetFilters")}</Button>
    </div>
  );
}
