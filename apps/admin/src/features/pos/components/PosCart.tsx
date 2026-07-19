import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { calculatePosItemLineTotal, type OrderTotals, type PosCartItem } from "@warungmeng/domain";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import { Button, Card, Empty, Flex, InputNumber, List, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface PosCartProps {
  readonly items: readonly PosCartItem[];
  readonly totals: OrderTotals;
  readonly disabled: boolean;
  readonly onQuantityChange: (itemId: string, quantity: number) => void;
  readonly onEdit: (item: PosCartItem) => void;
  readonly onRemove: (itemId: string) => void;
  readonly onCheckout: () => void;
}

export function PosCart({
  items,
  totals,
  disabled,
  onQuantityChange,
  onEdit,
  onRemove,
  onCheckout,
}: PosCartProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Card
      className="pos-cart"
      extra={t("pos.cart.count", { count: itemCount })}
      title={t("pos.cart.title")}
    >
      {items.length === 0 ? (
        <Empty description={t("pos.cart.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={[...items]}
          renderItem={(item) => (
            <List.Item className="pos-cart__item" key={item.id}>
              <div className="pos-cart__item-main">
                <Typography.Text strong>{item.name}</Typography.Text>
                {item.variantSelections.length > 0 ? (
                  <Typography.Text type="secondary">
                    {item.variantSelections.map((selection) => selection.optionName).join(", ")}
                  </Typography.Text>
                ) : null}
                {item.note ? <Typography.Text type="secondary">{item.note}</Typography.Text> : null}
                <Typography.Text>
                  {formatRupiah(calculatePosItemLineTotal(item), { regionalFormat })}
                </Typography.Text>
              </div>
              <Flex align="center" gap="small">
                <InputNumber
                  aria-label={t("pos.cart.quantity", { name: item.name })}
                  min={1}
                  onChange={(value) =>
                    onQuantityChange(item.id, typeof value === "number" ? value : 1)
                  }
                  size="small"
                  value={item.quantity}
                />
                <Button
                  aria-label={t("pos.cart.edit", { name: item.name })}
                  icon={<EditOutlined aria-hidden />}
                  onClick={() => onEdit(item)}
                  size="small"
                />
                <Button
                  aria-label={t("pos.cart.remove", { name: item.name })}
                  danger
                  icon={<DeleteOutlined aria-hidden />}
                  onClick={() => onRemove(item.id)}
                  size="small"
                />
              </Flex>
            </List.Item>
          )}
        />
      )}

      <div className="pos-cart__totals">
        <span>{t("orders.detail.subtotal")}</span>
        <span>{formatRupiah(totals.subtotal.amount, { regionalFormat })}</span>
        <Typography.Text strong>{t("orders.detail.total")}</Typography.Text>
        <Typography.Text strong>
          {formatRupiah(totals.total.amount, { regionalFormat })}
        </Typography.Text>
      </div>
      <Button block disabled={disabled || items.length === 0} onClick={onCheckout} type="primary">
        {t("pos.cart.checkout")}
      </Button>
    </Card>
  );
}
