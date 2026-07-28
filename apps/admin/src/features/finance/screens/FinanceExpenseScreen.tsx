import type { FinanceTransaction, FinanceTransactionQuery } from "@warungmeng/domain";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import { App, Alert, Button, Card, Spin, Statistic, Typography } from "antd";
import type { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type {
  FinanceReadCapability,
  FinanceRecordCapability,
} from "../application/financeCapabilities";
import { getFinanceDatePresetRange } from "../application/financeDateRange";
import { useFinanceLedger } from "../application/useFinanceLedger";
import { useFinanceOverview } from "../application/useFinanceOverview";
import { useFinanceTransactionEditor } from "../application/useFinanceTransactionEditor";
import { FinanceDateRangeControl } from "../components/FinanceDateRangeControl";
import { FinanceExpenseBreakdown } from "../components/FinanceExpenseBreakdown";
import { FinanceTransactionEditorDialog } from "../components/FinanceTransactionEditorDialog";
import { FinanceTransactionTable } from "../components/FinanceTransactionTable";
import { FinanceTransactionToolbar } from "../components/FinanceTransactionToolbar";

interface FinanceExpenseScreenProps {
  readonly finance: FinanceReadCapability;
  readonly record: FinanceRecordCapability;
  readonly referenceDate?: Dayjs;
}

export function FinanceExpenseScreen({
  finance,
  record,
  referenceDate,
}: FinanceExpenseScreenProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const ledger = useFinanceLedger(finance);
  const editor = useFinanceTransactionEditor(record);
  const [query, setQuery] = useState<FinanceTransactionQuery>(() => ({
    ...getFinanceDatePresetRange("last30", referenceDate),
    direction: "outflow",
  }));
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const expenseQuery = useMemo<FinanceTransactionQuery>(
    () => ({ ...query, direction: "outflow" }),
    [query],
  );
  const overview = useFinanceOverview(ledger.transactions, expenseQuery);

  async function voidTransaction(transaction: FinanceTransaction): Promise<void> {
    setMutatingId(transaction.id);
    try {
      const saved = await editor.voidTransaction(transaction);
      if (!saved) throw new Error("Finance transaction could not be voided");
      ledger.retry();
      void message.success(t("finance.feedback.voided"));
    } catch {
      void message.error(t("finance.feedback.saveFailed"));
    } finally {
      setMutatingId(null);
    }
  }

  return (
    <section aria-labelledby="finance-expenses-heading" className="finance-expenses">
      <div className="finance-section-heading">
        <div>
          <Typography.Title id="finance-expenses-heading" level={3}>
            {t("finance.expenses.title")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("finance.expenses.description")}</Typography.Text>
        </div>
      </div>

      <FinanceDateRangeControl
        now={referenceDate}
        onChange={(range) => setQuery((current) => ({ ...current, ...range }))}
        range={{ dateFrom: expenseQuery.dateFrom!, dateTo: expenseQuery.dateTo! }}
      />

      {ledger.error ? (
        <Alert
          action={<Button onClick={ledger.retry}>{t("finance.actions.retry")}</Button>}
          description={t("finance.transactions.loadError")}
          showIcon
          type="error"
        />
      ) : null}

      <FinanceTransactionToolbar
        onChange={(nextQuery) => setQuery({ ...nextQuery, direction: "outflow" })}
        onCreate={() => editor.openCreate("outflow")}
        onReset={() =>
          setQuery({ ...getFinanceDatePresetRange("last30", referenceDate), direction: "outflow" })
        }
        query={expenseQuery}
        variant="expenses"
      />

      {ledger.loading ? (
        <div className="finance-transactions__loading">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="finance-expenses__summary">
            <Card>
              <Statistic
                formatter={() =>
                  formatRupiah(overview.summary.totalOutflow.amount, { regionalFormat })
                }
                title={t("finance.summary.outflow")}
                value={overview.summary.totalOutflow.amount}
              />
            </Card>
            <FinanceExpenseBreakdown
              categories={overview.expenseCategories}
              total={overview.summary.totalOutflow.amount}
            />
          </div>
          <FinanceTransactionTable
            loading={false}
            mutatingId={mutatingId}
            onEdit={editor.openEdit}
            onOpenOrder={(orderId) => navigate(`/orders/${orderId}`)}
            onVoid={voidTransaction}
            transactions={overview.transactions}
          />
        </>
      )}

      <FinanceTransactionEditorDialog
        defaultDirection={editor.editor.defaultDirection}
        mode={editor.editor.mode}
        onCancel={editor.close}
        onSubmit={async (input) => {
          try {
            const saved = await editor.save(input);
            if (!saved) throw new Error("Finance transaction could not be saved");
            ledger.retry();
            void message.success(t("finance.feedback.saved"));
            return true;
          } catch {
            void message.error(t("finance.feedback.saveFailed"));
            return false;
          }
        }}
        open={editor.editor.open}
        submitting={editor.submitting}
        transaction={editor.editor.transaction}
      />
    </section>
  );
}
