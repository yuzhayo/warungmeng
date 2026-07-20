import type { FinanceStatus } from "@warungmeng/domain";
import type { TranslationKey } from "@warungmeng/i18n";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<FinanceStatus, string> = {
  pending: "gold",
  posted: "green",
  voided: "default",
};

export function FinanceTransactionStatusTag({ status }: { readonly status: FinanceStatus }) {
  const { t } = useTranslation();

  return <Tag color={STATUS_COLORS[status]}>{t(`finance.status.${status}` as TranslationKey)}</Tag>;
}
