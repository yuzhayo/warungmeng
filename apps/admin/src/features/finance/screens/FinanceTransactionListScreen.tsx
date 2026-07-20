import type { FinanceRepository, OrderRepository } from "@warungmeng/data";
import type { FinanceTransaction, FinanceTransactionQuery } from "@warungmeng/domain";
import { App, Alert, Button, Spin, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useFinanceLedger } from "../application/useFinanceLedger";
import { useFinanceTransactionEditor } from "../application/useFinanceTransactionEditor";
import { useFinanceTransactions } from "../application/useFinanceTransactions";
import { FinanceTransactionEditorDialog } from "../components/FinanceTransactionEditorDialog";
import { FinanceTransactionTable } from "../components/FinanceTransactionTable";
import { FinanceTransactionToolbar } from "../components/FinanceTransactionToolbar";

interface FinanceTransactionListScreenProps {
  readonly orderRepository?: OrderRepository;
  readonly financeRepository?: FinanceRepository;
}

export function FinanceTransactionListScreen({
  orderRepository,
  financeRepository,
}: FinanceTransactionListScreenProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const ledger = useFinanceLedger(orderRepository, financeRepository);
  const editor = useFinanceTransactionEditor(financeRepository);
  const [query, setQuery] = useState<FinanceTransactionQuery>({});
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const transactions = useFinanceTransactions(ledger.transactions, query);

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
    <section aria-labelledby="finance-transactions-heading" className="finance-transactions">
      <div className="finance-transactions__heading">
        <div>
          <Typography.Title id="finance-transactions-heading" level={3}>
            {t("finance.transactions.title")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("finance.transactions.description")}
          </Typography.Text>
        </div>
      </div>

      {ledger.error ? (
        <Alert
          action={<Button onClick={ledger.retry}>{t("finance.actions.retry")}</Button>}
          description={t("finance.transactions.loadError")}
          showIcon
          type="error"
        />
      ) : null}

      <FinanceTransactionToolbar
        onChange={setQuery}
        onCreate={editor.openCreate}
        onReset={() => setQuery({})}
        query={query}
      />

      {ledger.loading ? (
        <div className="finance-transactions__loading">
          <Spin size="large" />
        </div>
      ) : (
        <FinanceTransactionTable
          loading={false}
          mutatingId={mutatingId}
          onEdit={editor.openEdit}
          onOpenOrder={(orderId) => navigate(`/orders/${orderId}`)}
          onVoid={voidTransaction}
          transactions={transactions}
        />
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
