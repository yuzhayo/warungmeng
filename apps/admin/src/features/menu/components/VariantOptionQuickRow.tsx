import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { MenuVariantOption } from "@warungmeng/domain";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import { Button, Flex, Input, Popconfirm, Switch, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  validateVariantOptionQuickEdit,
  type VariantOptionQuickEdit,
} from "../application/variantOptionCommands";

export interface VariantOptionQuickRowProps {
  readonly editing: boolean;
  readonly groupId: string;
  readonly option: MenuVariantOption;
  readonly pending: boolean;
  readonly onAvailabilityChange: (
    groupId: string,
    optionId: string,
    available: boolean,
  ) => Promise<boolean>;
  readonly onCancelEdit: () => void;
  readonly onDelete: (groupId: string, optionId: string) => Promise<boolean>;
  readonly onSave: (
    groupId: string,
    optionId: string,
    input: VariantOptionQuickEdit,
  ) => Promise<boolean>;
  readonly onStartEdit: (optionId: string) => void;
}

interface EditDraft {
  readonly name: string;
  readonly priceAmount: string;
}

const { Text } = Typography;

export function VariantOptionQuickRow({
  editing,
  groupId,
  option,
  pending,
  onAvailabilityChange,
  onCancelEdit,
  onDelete,
  onSave,
  onStartEdit,
}: VariantOptionQuickRowProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const [draft, setDraft] = useState<EditDraft>({
    name: option.name,
    priceAmount: String(option.priceAdjustment.amount),
  });

  const priceAmount = Number.parseInt(draft.priceAmount, 10);
  const valid = validateVariantOptionQuickEdit({
    name: draft.name,
    priceAmount,
  });
  const available = option.availability.status === "available";

  return (
    <div className="variant-option-quick-row">
      <div className="variant-option-quick-row__name">
        {editing ? (
          <Input
            aria-label={t("variants.options.fields.name", { name: option.name })}
            maxLength={120}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            status={draft.name.trim() ? undefined : "error"}
            value={draft.name}
          />
        ) : (
          <Text strong>{option.name}</Text>
        )}
      </div>

      <div className="variant-option-quick-row__price">
        {editing ? (
          <Input
            aria-label={t("variants.options.fields.price", { name: option.name })}
            inputMode="numeric"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                priceAmount: event.target.value.replace(/\D/g, ""),
              }))
            }
            prefix="Rp"
            status={draft.priceAmount ? undefined : "error"}
            value={draft.priceAmount}
          />
        ) : (
          <Text>
            {option.priceAdjustment.amount > 0 ? "+" : ""}
            {formatRupiah(option.priceAdjustment.amount, { regionalFormat })}
          </Text>
        )}
      </div>

      <Flex align="center" className="variant-option-quick-row__availability" gap="small">
        <Switch
          aria-label={t("variants.options.actions.toggleAvailability", {
            name: option.name,
          })}
          checked={available}
          disabled={editing}
          loading={pending}
          onChange={(checked) => {
            void onAvailabilityChange(groupId, option.id, checked);
          }}
          size="small"
        />
        <Text>
          {t(available ? "menu.availability.available" : "menu.availability.unavailable")}
        </Text>
      </Flex>

      <Flex className="variant-option-quick-row__actions" gap="small" justify="center">
        {editing ? (
          <>
            <Button
              aria-label={t("variants.options.actions.saveFor", { name: option.name })}
              disabled={!valid}
              icon={<CheckOutlined />}
              loading={pending}
              onClick={() => {
                if (!valid) return;
                void onSave(groupId, option.id, {
                  name: draft.name.trim(),
                  priceAmount,
                }).then((saved) => {
                  if (saved) onCancelEdit();
                });
              }}
              type="text"
            />
            <Button
              aria-label={t("variants.options.actions.cancelFor", { name: option.name })}
              disabled={pending}
              icon={<CloseOutlined />}
              onClick={onCancelEdit}
              type="text"
            />
          </>
        ) : (
          <>
            <Button
              aria-label={t("variants.options.actions.quickEditFor", { name: option.name })}
              disabled={pending}
              icon={<EditOutlined />}
              onClick={() => {
                setDraft({
                  name: option.name,
                  priceAmount: String(option.priceAdjustment.amount),
                });
                onStartEdit(option.id);
              }}
              type="text"
            />
            <Popconfirm
              cancelText={t("variants.options.actions.cancel")}
              description={t("variants.options.delete.description")}
              disabled={pending}
              okButtonProps={{ danger: true }}
              okText={t("variants.options.actions.delete")}
              onConfirm={() => onDelete(groupId, option.id)}
              title={t("variants.options.delete.title", { name: option.name })}
            >
              <Button
                aria-label={t("variants.options.actions.deleteFor", { name: option.name })}
                danger
                disabled={pending}
                icon={<DeleteOutlined />}
                type="text"
              />
            </Popconfirm>
          </>
        )}
      </Flex>
    </div>
  );
}
