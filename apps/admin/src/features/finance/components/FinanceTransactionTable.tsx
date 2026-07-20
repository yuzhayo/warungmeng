import { DeleteOutlined, EditOutlined, EyeOutlined, PaperClipOutlined } from "@ant-design/icons";
import type { FinanceTransaction } from "@warungmeng/domain";
import {
  formatDate,
  formatRupiah,
  formatTime,
  type TranslationKey,
  useLocaleSettings,
} from "@warungmeng/i18n";
import { Button, Empty, Popconfirm, Space, Table, Typography, type TableColumnsType } from "antd";
import { useTranslation } from "react-i18next";
import { FinanceTransactionStatusTag } from "./FinanceTransactionStatusTag";

interface FinanceTransactionTableProps {
  readonly loading: boolean;
  readonly transactions: readonly FinanceTransaction[];
  readonly mutatingId?: string | null;
  readonly onEdit?: (transaction: FinanceTransaction) => void;
  readonly onOpenOrder?: (orderId: string) => void;
  readonly onVoid?: (transaction: FinanceTransaction) => Promise<void>;
  readonly showActions?: boolean;
}

export function FinanceTransactionTable({
  loading,
  transactions,
  mutatingId = null,
  onEdit,
  onOpenOrder,
  onVoid,
  showActions = true,
}: FinanceTransactionTableProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const columns: TableColumnsType<FinanceTransaction> = [
    {
      key: "occurredAt",
      title: t("finance.table.date"),
      width: "10rem",
      render: (_, transaction) => {
        const occurredAt = new Date(transaction.occurredAt);
        return (
          <div className="finance-table__stack">
            <span>{formatDate(occurredAt, { regionalFormat })}</span>
            <Typography.Text type="secondary">
              {formatTime(occurredAt, { regionalFormat })}
            </Typography.Text>
          </div>
        );
      },
    },
    {
      key: "type",
      title: t("finance.table.typeCategory"),
      width: "13rem",
      render: (_, transaction) => (
        <div className="finance-table__stack">
          <span>{t(`finance.type.${transaction.type}` as TranslationKey)}</span>
          <Typography.Text type="secondary">
            {transaction.categoryId.startsWith("custom:")
              ? transaction.categoryLabel
              : t(`finance.category.${transaction.categoryId}` as TranslationKey)}
          </Typography.Text>
        </div>
      ),
    },
    {
      key: "description",
      title: t("finance.table.descriptionReference"),
      width: "17rem",
      render: (_, transaction) => (
        <div className="finance-table__stack">
          <span>{transaction.description}</span>
          <Typography.Text type="secondary">
            {transaction.referenceNumber || t("finance.value.noReference")}
            {transaction.attachment ? (
              <span
                className="finance-table__attachment"
                title={`${transaction.attachment.name} (${transaction.attachment.size} bytes)`}
              >
                <PaperClipOutlined /> {transaction.attachment.name}
              </span>
            ) : null}
          </Typography.Text>
        </div>
      ),
    },
    {
      key: "paymentMethod",
      title: t("finance.table.paymentMethod"),
      width: "10rem",
      render: (_, transaction) =>
        t(`finance.payment.${transaction.paymentMethod}` as TranslationKey),
    },
    {
      key: "source",
      title: t("finance.table.source"),
      width: "8rem",
      render: (_, transaction) => t(`finance.source.${transaction.source}` as TranslationKey),
    },
    {
      align: "right",
      key: "amount",
      title: t("finance.table.amount"),
      width: "11rem",
      render: (_, transaction) => (
        <Typography.Text
          className={`finance-table__amount finance-table__amount--${transaction.direction}`}
          delete={transaction.status === "voided"}
          strong
        >
          {transaction.direction === "inflow" ? "+" : "−"}
          {formatRupiah(transaction.amount.amount, { regionalFormat })}
        </Typography.Text>
      ),
    },
    {
      key: "status",
      title: t("finance.table.status"),
      width: "8rem",
      render: (_, transaction) => <FinanceTransactionStatusTag status={transaction.status} />,
    },
    ...(showActions
      ? [
          {
            align: "center" as const,
            fixed: "right" as const,
            key: "actions",
            title: t("finance.table.actions"),
            width: "7rem",
            render: (_: unknown, transaction: FinanceTransaction) => {
              if (transaction.source === "automatic") {
                return transaction.sourceReference && onOpenOrder ? (
                  <Button
                    aria-label={t("finance.actions.openOrder", {
                      reference: transaction.referenceNumber,
                    })}
                    icon={<EyeOutlined />}
                    onClick={() => onOpenOrder(transaction.sourceReference!)}
                    type="text"
                  />
                ) : null;
              }
              if (transaction.status === "voided") return "—";
              if (!onEdit && !onVoid) return "—";
              return (
                <Space size="small">
                  {onEdit ? (
                    <Button
                      aria-label={t("finance.actions.edit", {
                        description: transaction.description,
                      })}
                      disabled={mutatingId === transaction.id}
                      icon={<EditOutlined />}
                      onClick={() => onEdit(transaction)}
                      type="text"
                    />
                  ) : null}
                  {onVoid ? (
                    <Popconfirm
                      cancelText={t("finance.actions.cancel")}
                      description={t("finance.actions.voidDescription")}
                      okButtonProps={{ danger: true }}
                      okText={t("finance.actions.void")}
                      onConfirm={() => onVoid(transaction)}
                      title={t("finance.actions.voidConfirm")}
                    >
                      <Button
                        aria-label={t("finance.actions.voidFor", {
                          description: transaction.description,
                        })}
                        danger
                        icon={<DeleteOutlined />}
                        loading={mutatingId === transaction.id}
                        type="text"
                      />
                    </Popconfirm>
                  ) : null}
                </Space>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <Table<FinanceTransaction>
      className="finance-transaction-table"
      columns={columns}
      dataSource={[...transactions]}
      loading={loading}
      locale={{
        emptyText: (
          <Empty
            description={t("finance.transactions.empty")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ),
      }}
      pagination={false}
      rowClassName={(transaction) =>
        transaction.status === "voided" ? "finance-table__row--voided" : ""
      }
      rowKey="id"
      scroll={{ x: "max-content", y: "calc(100dvh - 24rem)" }}
      size="middle"
      sticky
    />
  );
}
