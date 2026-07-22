import { useMemo, useState } from "react";
import { Alert, Button } from "antd";
import type { MenuItem, MenuVariantGroup, OrderVariantSelection } from "@warungmeng/domain";
import { isMenuSellable, resolvePosVariantSelections } from "@warungmeng/domain";
import { formatRupiah } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import { calculateDraftLineTotal } from "../../cart/application/storefrontCartModel";
import { clampQuantity, getMaxSelectableQuantity } from "../application/menuDetailModel";
import styles from "../MenuDetail.module.css";
import { ItemNoteDialog } from "./ItemNoteDialog";
import { MenuDetailIdentity } from "./MenuDetailIdentity";
import { QuantityStepper } from "./QuantityStepper";
import { VariantGroupSelector } from "./VariantGroupSelector";

export const MAX_UNTRACKED_QUANTITY = 20;

export interface MenuConfiguratorSubmission {
  readonly variantSelections: readonly OrderVariantSelection[];
  readonly quantity: number;
  readonly note: string;
}

interface MenuConfiguratorProps {
  menu: MenuItem;
  variantGroups: readonly MenuVariantGroup[];
  missingGroupIds: readonly string[];
  onAdd: (submission: MenuConfiguratorSubmission) => void;
  headingId?: string;
  initialSelections?: Readonly<Record<string, readonly string[]>>;
  initialQuantity?: number;
  initialNote?: string;
  submitLabel?: string;
}

export function MenuConfigurator({
  menu,
  variantGroups,
  missingGroupIds,
  onAdd,
  headingId,
  initialSelections,
  initialQuantity,
  initialNote,
  submitLabel,
}: MenuConfiguratorProps) {
  const { t } = useTranslation();
  const maxQuantity = getMaxSelectableQuantity(menu, MAX_UNTRACKED_QUANTITY);
  const [selectedByGroup, setSelectedByGroup] = useState<
    Readonly<Record<string, readonly string[]>>
  >(() => initialSelections ?? {});
  const [touchedGroups, setTouchedGroups] = useState<ReadonlySet<string>>(new Set());
  const [quantity, setQuantity] = useState(() => clampQuantity(initialQuantity ?? 1, maxQuantity));
  const [note, setNote] = useState(initialNote ?? "");
  const sellable = isMenuSellable(menu);
  const configurationComplete = missingGroupIds.length === 0;

  const resolution = useMemo(
    () => resolvePosVariantSelections(menu, variantGroups, selectedByGroup),
    [menu, variantGroups, selectedByGroup],
  );

  const invalidGroupIds = useMemo(
    () => new Set(resolution.issues.map((issue) => issue.groupId)),
    [resolution],
  );

  const lineTotal = calculateDraftLineTotal(menu, resolution.selections, quantity);
  const canSubmit = sellable && configurationComplete && resolution.valid;

  const handleSelectionChange = (groupId: string, optionIds: readonly string[]) => {
    setSelectedByGroup((current) => ({ ...current, [groupId]: optionIds }));
    setTouchedGroups((current) => new Set(current).add(groupId));
  };

  const handleAdd = () => {
    if (!canSubmit) return;
    onAdd({ variantSelections: resolution.selections, quantity, note });
  };

  return (
    <div>
      <MenuDetailIdentity menu={menu} headingId={headingId} />
      {!sellable ? (
        <Alert
          type="warning"
          showIcon
          title={t("storefront.detail.unavailable")}
          className={styles.noteRow}
        />
      ) : null}
      {!configurationComplete ? (
        <Alert
          type="warning"
          showIcon
          title={t("storefront.detail.rule.missingGroup")}
          className={styles.noteRow}
        />
      ) : null}
      {variantGroups.map((group) => (
        <VariantGroupSelector
          key={group.id}
          group={group}
          selectedOptionIds={selectedByGroup[group.id] ?? []}
          onSelectionChange={handleSelectionChange}
          showError={touchedGroups.has(group.id) && invalidGroupIds.has(group.id)}
        />
      ))}
      <QuantityStepper
        menuName={menu.name}
        quantity={quantity}
        maximum={maxQuantity}
        onChange={setQuantity}
      />
      <ItemNoteDialog note={note} onNoteChange={setNote} />
      <div className={styles.actionBar}>
        <Button type="primary" block size="large" disabled={!canSubmit} onClick={handleAdd}>
          {submitLabel ?? t("storefront.detail.addToCart")}
          {" • "}
          {formatRupiah(lineTotal, { regionalFormat: "id-ID" })}
        </Button>
      </div>
    </div>
  );
}
