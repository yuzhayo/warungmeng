import {
  isPosPaymentSufficient,
  type OrderTotals,
  type PosCheckoutDraft,
} from "@warungmeng/domain";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import { Alert, InputNumber, Modal, Segmented, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface PosCheckoutModalProps {
  readonly checkout: PosCheckoutDraft;
  readonly totals: OrderTotals;
  readonly processing: boolean;
  readonly onCancel: () => void;
  readonly onChange: (patch: Partial<PosCheckoutDraft>) => void;
  readonly onPricingChange: (patch: Partial<PosCheckoutDraft["pricing"]>) => void;
  readonly onConfirm: () => void;
}

export function PosCheckoutModal({
  checkout,
  totals,
  processing,
  onCancel,
  onChange,
  onPricingChange,
  onConfirm,
}: PosCheckoutModalProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const sufficient =
    checkout.paymentMethod !== "cash" ||
    isPosPaymentSufficient(totals.total.amount, checkout.cashReceived);

  return (
    <Modal
      confirmLoading={processing}
      destroyOnHidden
      okButtonProps={{ disabled: !sufficient }}
      okText={t("pos.checkout.confirm")}
      onCancel={onCancel}
      onOk={onConfirm}
      open
      title={t("pos.checkout.title")}
      width={720}
    >
      <div className="pos-checkout">
        <label>
          <Typography.Text>{t("pos.checkout.fulfillment")}</Typography.Text>
          <Segmented
            block
            onChange={(value) =>
              onChange({ fulfillment: value as PosCheckoutDraft["fulfillment"] })
            }
            options={[
              { label: t("orders.fulfillment.dine-in"), value: "dine-in" },
              { label: t("orders.fulfillment.takeaway"), value: "takeaway" },
            ]}
            value={checkout.fulfillment}
          />
        </label>
        <label>
          <Typography.Text>{t("pos.checkout.paymentMethod")}</Typography.Text>
          <Segmented
            block
            onChange={(value) =>
              onChange({ paymentMethod: value as PosCheckoutDraft["paymentMethod"] })
            }
            options={[
              { label: t("pos.checkout.cash"), value: "cash" },
              { label: t("pos.checkout.qris"), value: "qris" },
              { label: t("pos.checkout.card"), value: "card" },
            ]}
            value={checkout.paymentMethod}
          />
        </label>
        <div className="pos-checkout__pricing">
          <label>
            <Typography.Text>{t("pos.checkout.discount")}</Typography.Text>
            <InputNumber
              min={0}
              onChange={(value) =>
                onPricingChange({ discountAmount: typeof value === "number" ? value : 0 })
              }
              prefix="Rp"
              value={checkout.pricing.discountAmount}
            />
          </label>
          <label>
            <Typography.Text>{t("pos.checkout.serviceCharge")}</Typography.Text>
            <InputNumber
              min={0}
              onChange={(value) =>
                onPricingChange({ serviceChargeAmount: typeof value === "number" ? value : 0 })
              }
              prefix="Rp"
              value={checkout.pricing.serviceChargeAmount}
            />
          </label>
          <label>
            <Typography.Text>{t("pos.checkout.tax")}</Typography.Text>
            <Segmented
              onChange={(value) => onPricingChange({ taxRate: Number(value) })}
              options={[
                { label: "0%", value: 0 },
                { label: "10%", value: 0.1 },
              ]}
              value={checkout.pricing.taxRate}
            />
          </label>
          <label>
            <Typography.Text>{t("pos.checkout.rounding")}</Typography.Text>
            <Segmented
              onChange={(value) => onPricingChange({ roundingStep: Number(value) })}
              options={[
                { label: t("pos.checkout.none"), value: 1 },
                { label: t("pos.checkout.nearest100"), value: 100 },
              ]}
              value={checkout.pricing.roundingStep}
            />
          </label>
        </div>
        {checkout.paymentMethod === "cash" ? (
          <label>
            <Typography.Text>{t("pos.checkout.cashReceived")}</Typography.Text>
            <InputNumber
              min={0}
              onChange={(value) =>
                onChange({ cashReceived: typeof value === "number" ? value : 0 })
              }
              prefix="Rp"
              value={checkout.cashReceived}
            />
          </label>
        ) : null}

        <div className="pos-checkout__summary">
          <Typography.Title level={5}>{t("pos.checkout.summary")}</Typography.Title>
          <span>{t("orders.detail.subtotal")}</span>
          <span>{formatRupiah(totals.subtotal.amount, { regionalFormat })}</span>
          <span>{t("orders.detail.discount")}</span>
          <span>{formatRupiah(-totals.discount.amount, { regionalFormat })}</span>
          <span>{t("orders.detail.serviceCharge")}</span>
          <span>{formatRupiah(totals.serviceCharge.amount, { regionalFormat })}</span>
          <span>{t("orders.detail.tax")}</span>
          <span>{formatRupiah(totals.tax.amount, { regionalFormat })}</span>
          <span>{t("orders.detail.rounding")}</span>
          <span>{formatRupiah(totals.rounding.amount, { regionalFormat })}</span>
          <Typography.Text strong>{t("orders.detail.total")}</Typography.Text>
          <Typography.Text strong>
            {formatRupiah(totals.total.amount, { regionalFormat })}
          </Typography.Text>
        </div>
        {!sufficient ? (
          <Alert title={t("pos.checkout.insufficient")} showIcon type="error" />
        ) : null}
      </div>
    </Modal>
  );
}
