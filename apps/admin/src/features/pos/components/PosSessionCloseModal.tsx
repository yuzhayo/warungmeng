import { calculateExpectedPosCash, type PosSession } from "@warungmeng/domain";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import { Alert, InputNumber, Modal, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface PosSessionCloseModalProps {
  readonly session: Extract<PosSession, { status: "open" }>;
  readonly cashSales: number;
  readonly cartItemCount: number;
  readonly onCancel: () => void;
  readonly onConfirm: (actualCash: number) => void;
}

export function PosSessionCloseModal({
  session,
  cashSales,
  cartItemCount,
  onCancel,
  onConfirm,
}: PosSessionCloseModalProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const expectedCash = calculateExpectedPosCash(session.openingBalance.amount, cashSales);
  const [actualCash, setActualCash] = useState(expectedCash);
  const variance = actualCash - expectedCash;

  return (
    <Modal
      destroyOnHidden
      okButtonProps={{ danger: true }}
      okText={t("pos.session.closeConfirm")}
      onCancel={onCancel}
      onOk={() => onConfirm(actualCash)}
      open
      title={t("pos.session.closeTitle")}
    >
      <div className="pos-session-close">
        {cartItemCount > 0 ? (
          <Alert showIcon title={t("pos.session.confirmCloseDescription")} type="warning" />
        ) : null}
        <div className="pos-session-close__summary">
          <span>{t("pos.session.openingBalance")}</span>
          <span>{formatRupiah(session.openingBalance.amount, { regionalFormat })}</span>
          <span>{t("pos.session.cashSales")}</span>
          <span>{formatRupiah(cashSales, { regionalFormat })}</span>
          <Typography.Text strong>{t("pos.session.expectedCash")}</Typography.Text>
          <Typography.Text strong>
            {formatRupiah(expectedCash, { regionalFormat })}
          </Typography.Text>
        </div>
        <label className="pos-session__field">
          <Typography.Text>{t("pos.session.actualCash")}</Typography.Text>
          <InputNumber
            aria-label={t("pos.session.actualCash")}
            min={0}
            onChange={(value) => setActualCash(typeof value === "number" ? value : 0)}
            prefix="Rp"
            step={10_000}
            value={actualCash}
          />
        </label>
        <div className="pos-session-close__summary">
          <Typography.Text strong>{t("pos.session.variance")}</Typography.Text>
          <Typography.Text strong type={variance < 0 ? "danger" : variance > 0 ? "warning" : undefined}>
            {formatRupiah(variance, { regionalFormat })}
          </Typography.Text>
        </div>
        {variance !== 0 ? (
          <Alert
            showIcon
            title={variance > 0 ? t("pos.session.surplus") : t("pos.session.shortage")}
            type={variance > 0 ? "warning" : "error"}
          />
        ) : null}
      </div>
    </Modal>
  );
}
