import type { PosReceipt } from "@warungmeng/domain";
import { formatDate, formatRupiah, formatTime, useLocaleSettings } from "@warungmeng/i18n";
import { Button, Modal, Result, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface PosReceiptModalProps {
  readonly receipt: PosReceipt;
  readonly onClose: () => void;
}

export function PosReceiptModal({ receipt, onClose }: PosReceiptModalProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const issuedAt = new Date(receipt.issuedAt);

  return (
    <Modal
      closable={false}
      footer={
        <Button onClick={onClose} type="primary">
          {t("pos.receipt.newTransaction")}
        </Button>
      }
      open
      title={t("pos.receipt.title")}
    >
      <Result status="success" subTitle={receipt.orderNumber} title={t("pos.receipt.success")} />
      <div className="pos-receipt__summary">
        <span>{t("pos.receipt.orderNumber")}</span>
        <Typography.Text strong>{receipt.orderNumber}</Typography.Text>
        <span>{t("pos.checkout.paymentMethod")}</span>
        <span>{t(`orders.paymentMethod.${receipt.paymentMethod}`)}</span>
        <span>{t("orders.detail.total")}</span>
        <span>{formatRupiah(receipt.totals.total.amount, { regionalFormat })}</span>
        <span>{t("pos.receipt.cashReceived")}</span>
        <span>{formatRupiah(receipt.cashReceived.amount, { regionalFormat })}</span>
        <span>{t("pos.receipt.change")}</span>
        <span>{formatRupiah(receipt.change.amount, { regionalFormat })}</span>
        <span>{t("orders.table.createdAt")}</span>
        <span>
          {formatDate(issuedAt, { regionalFormat })} {formatTime(issuedAt, { regionalFormat })}
        </span>
      </div>
    </Modal>
  );
}
