import type { FinanceRepository, OrderRepository } from "@warungmeng/data";
import { App, Alert, Button, Card, Empty, Spin, Typography } from "antd";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusOutlined } from "@ant-design/icons";
import { getFinanceDatePresetRange, type FinanceDateRange } from "../application/financeDateRange";
import { useFinanceLedger } from "../application/useFinanceLedger";
import { useFinanceOverview } from "../application/useFinanceOverview";
import { useFinanceTransactionEditor } from "../application/useFinanceTransactionEditor";
import { FinanceDateRangeControl } from "../components/FinanceDateRangeControl";
import { FinanceExpenseBreakdown } from "../components/FinanceExpenseBreakdown";
import { FinancePaymentMethodBreakdown } from "../components/FinancePaymentMethodBreakdown";
import { FinanceSummaryCards } from "../components/FinanceSummaryCards";
import { FinanceTransactionEditorDialog } from "../components/FinanceTransactionEditorDialog";
import { FinanceTransactionTable } from "../components/FinanceTransactionTable";

interface FinanceOverviewScreenProps {
  readonly orderRepository?: OrderRepository;
  readonly financeRepository?: FinanceRepository;
  readonly referenceDate?: Dayjs;
}

export function FinanceOverviewScreen({
  orderRepository,
  financeRepository,
  referenceDate,
}: FinanceOverviewScreenProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const ledger = useFinanceLedger(orderRepository, financeRepository);
  const editor = useFinanceTransactionEditor(financeRepository);
  const [range, setRange] = useState<FinanceDateRange>(() =>
    getFinanceDatePresetRange("last30", referenceDate),
  );
  const overview = useFinanceOverview(ledger.transactions, range);

  return (
    <section aria-labelledby="finance-overview-heading" className="finance-overview">
      <div className="finance-section-heading">
        <div>
          <Typography.Title id="finance-overview-heading" level={3}>
            {t("finance.overview.title")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("finance.overview.description")}</Typography.Text>
        </div>
        <Button icon={<PlusOutlined />} onClick={() => editor.openCreate("inflow")} type="primary">
          {t("finance.actions.addTransaction")}
        </Button>
      </div>

      <FinanceDateRangeControl now={referenceDate} onChange={setRange} range={range} />

      {ledger.error ? (
        <Alert
          action={<Button onClick={ledger.retry}>{t("finance.actions.retry")}</Button>}
          description={t("finance.transactions.loadError")}
          showIcon
          type="error"
        />
      ) : null}

      {ledger.loading ? (
        <div className="finance-transactions__loading">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <FinanceSummaryCards summary={overview.summary} />
          {overview.transactions.length === 0 ? (
            <Card>
              <Empty description={t("finance.overview.empty")} />
            </Card>
          ) : (
            <>
              <div className="finance-overview__breakdowns">
                <FinancePaymentMethodBreakdown paymentMethods={overview.paymentMethods} />
                <FinanceExpenseBreakdown
                  categories={overview.expenseCategories}
                  total={overview.summary.totalOutflow.amount}
                />
              </div>
              <Card title={t("finance.overview.recentTransactions")}>
                <FinanceTransactionTable
                  loading={false}
                  showActions={false}
                  transactions={overview.recentTransactions}
                />
              </Card>
            </>
          )}
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
