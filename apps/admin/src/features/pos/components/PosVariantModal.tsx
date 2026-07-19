import {
  resolvePosVariantSelections,
  type MenuItem,
  type MenuVariantGroup,
  type OrderVariantSelection,
  type PosCartItem,
} from "@warungmeng/domain";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import { Alert, Checkbox, Input, Modal, Typography } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface PosVariantModalProps {
  readonly menu: MenuItem;
  readonly variantGroups: readonly MenuVariantGroup[];
  readonly editingItem?: PosCartItem;
  readonly onCancel: () => void;
  readonly onConfirm: (selections: readonly OrderVariantSelection[], note: string) => void;
}

function createInitialSelection(item?: PosCartItem): Record<string, readonly string[]> {
  const initial: Record<string, string[]> = {};
  item?.variantSelections.forEach((selection) => {
    initial[selection.groupId] = [...(initial[selection.groupId] ?? []), selection.optionId];
  });
  return initial;
}

export function PosVariantModal({
  menu,
  variantGroups,
  editingItem,
  onCancel,
  onConfirm,
}: PosVariantModalProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, readonly string[]>>(
    () => createInitialSelection(editingItem),
  );
  const [note, setNote] = useState(editingItem?.note ?? "");
  const connectedGroups = menu.variantGroupIds
    .map((groupId) => variantGroups.find((group) => group.id === groupId))
    .filter((group): group is MenuVariantGroup => Boolean(group));
  const resolved = useMemo(
    () => resolvePosVariantSelections(menu, variantGroups, selectedOptionIds),
    [menu, selectedOptionIds, variantGroups],
  );

  return (
    <Modal
      destroyOnHidden
      okButtonProps={{ disabled: !resolved.valid }}
      okText={editingItem ? t("pos.variant.save") : t("pos.variant.confirm")}
      onCancel={onCancel}
      onOk={() => onConfirm(resolved.selections, note)}
      open
      title={t("pos.variant.title", { name: menu.name })}
    >
      <div className="pos-variant-modal">
        {connectedGroups.map((group) => {
          const selected = selectedOptionIds[group.id] ?? [];
          const max = group.selection.maxSelections;
          const helper =
            group.selection.minSelections === 0 && max === null
              ? t("pos.variant.unlimited")
              : group.selection.minSelections === 0
                ? t("pos.variant.optional", { max })
                : max === group.selection.minSelections
                  ? t("pos.variant.exact", { count: group.selection.minSelections })
                  : max === null
                    ? t("pos.variant.minimum", { min: group.selection.minSelections })
                    : t("pos.variant.required", {
                        min: group.selection.minSelections,
                        max,
                      });

          return (
            <fieldset className="pos-variant-modal__group" key={group.id}>
              <legend>{group.name}</legend>
              <Typography.Text type="secondary">{helper}</Typography.Text>
              <Checkbox.Group
                aria-label={group.name}
                onChange={(values) => {
                  const next = values.map(String);
                  if (max !== null && next.length > max) return;
                  setSelectedOptionIds((current) => ({ ...current, [group.id]: next }));
                }}
                options={group.options.map((option) => ({
                  disabled:
                    option.availability.status !== "available" ||
                    (option.inventory.mode === "tracked" && option.inventory.quantity <= 0),
                  label: (
                    <span className="pos-variant-modal__option">
                      <span>{option.name}</span>
                      <span>
                        {option.priceAdjustment.amount > 0
                          ? `+${formatRupiah(option.priceAdjustment.amount, { regionalFormat })}`
                          : null}
                      </span>
                    </span>
                  ),
                  value: option.id,
                }))}
                value={[...selected]}
              />
            </fieldset>
          );
        })}
        {!resolved.valid ? (
          <Alert title={t("pos.variant.invalid")} showIcon type="warning" />
        ) : null}
        <label className="pos-variant-modal__note">
          <Typography.Text>{t("pos.cart.note")}</Typography.Text>
          <Input.TextArea onChange={(event) => setNote(event.target.value)} rows={2} value={note} />
        </label>
      </div>
    </Modal>
  );
}
