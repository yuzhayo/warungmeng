import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import {
  FINANCE_CATEGORIES,
  FINANCE_PAYMENT_METHODS,
  FINANCE_SOURCES,
  FINANCE_STATUSES,
  type FinanceDirection,
  type FinanceTransactionQuery,
} from "@warungmeng/domain";
import type { TranslationKey } from "@warungmeng/i18n";
import { Button, DatePicker, Input, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

interface FinanceTransactionToolbarProps {
  readonly query: FinanceTransactionQuery;
  readonly onChange: (query: FinanceTransactionQuery) => void;
  readonly onCreate: (direction: FinanceDirection) => void;
  readonly onReset: () => void;
}

function categoryLabelKey(id: string): TranslationKey {
  return `finance.category.${id}` as TranslationKey;
}

export function FinanceTransactionToolbar({
  query,
  onChange,
  onCreate,
  onReset,
}: FinanceTransactionToolbarProps) {
  const { t } = useTranslation();
  const rangeValue: [Dayjs, Dayjs] | null =
    query.dateFrom && query.dateTo ? [dayjs(query.dateFrom), dayjs(query.dateTo)] : null;

  return (
    <div className="finance-transaction-toolbar">
      <Input
        allowClear
        aria-label={t("finance.filters.search")}
        onChange={(event) => onChange({ ...query, search: event.target.value || undefined })}
        placeholder={t("finance.filters.search")}
        prefix={<SearchOutlined />}
        value={query.search ?? ""}
      />
      <DatePicker.RangePicker
        aria-label={t("finance.filters.dateRange")}
        onChange={(range) =>
          onChange({
            ...query,
            dateFrom: range?.[0]?.format("YYYY-MM-DD"),
            dateTo: range?.[1]?.format("YYYY-MM-DD"),
          })
        }
        value={rangeValue}
      />
      <Select
        allowClear
        aria-label={t("finance.filters.direction")}
        onChange={(direction) => onChange({ ...query, direction })}
        options={(["inflow", "outflow"] as const).map((direction) => ({
          value: direction,
          label: t(`finance.direction.${direction}` as TranslationKey),
        }))}
        placeholder={t("finance.filters.direction")}
        value={query.direction}
      />
      <Select
        allowClear
        aria-label={t("finance.filters.category")}
        onChange={(categoryId) => onChange({ ...query, categoryId })}
        options={FINANCE_CATEGORIES.map((category) => ({
          value: category.id,
          label: t(categoryLabelKey(category.id)),
        }))}
        placeholder={t("finance.filters.category")}
        showSearch={{ optionFilterProp: "label" }}
        value={query.categoryId}
      />
      <Select
        allowClear
        aria-label={t("finance.filters.paymentMethod")}
        onChange={(paymentMethod) => onChange({ ...query, paymentMethod })}
        options={FINANCE_PAYMENT_METHODS.map((method) => ({
          value: method,
          label: t(`finance.payment.${method}` as TranslationKey),
        }))}
        placeholder={t("finance.filters.paymentMethod")}
        value={query.paymentMethod}
      />
      <Select
        allowClear
        aria-label={t("finance.filters.source")}
        onChange={(source) => onChange({ ...query, source })}
        options={FINANCE_SOURCES.map((source) => ({
          value: source,
          label: t(`finance.source.${source}` as TranslationKey),
        }))}
        placeholder={t("finance.filters.source")}
        value={query.source}
      />
      <Select
        allowClear
        aria-label={t("finance.filters.status")}
        onChange={(status) => onChange({ ...query, status })}
        options={FINANCE_STATUSES.map((status) => ({
          value: status,
          label: t(`finance.status.${status}` as TranslationKey),
        }))}
        placeholder={t("finance.filters.status")}
        value={query.status}
      />
      <Button icon={<ReloadOutlined />} onClick={onReset}>
        {t("finance.actions.reset")}
      </Button>
      <div className="finance-transaction-toolbar__actions">
        <Button icon={<PlusOutlined />} onClick={() => onCreate("inflow")}>
          {t("finance.actions.addIncome")}
        </Button>
        <Button icon={<PlusOutlined />} onClick={() => onCreate("outflow")} type="primary">
          {t("finance.actions.addExpense")}
        </Button>
      </div>
    </div>
  );
}
