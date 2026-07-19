import type { MenuItem, MenuVariantGroup } from "../catalog/types";
import { validateVariantSelectionRule } from "../catalog/variantSelectionRule";
import type { OrderVariantSelection } from "../orders/types";
import type { PosCartItem } from "./types";

export type PosVariantSelectionIssueCode =
  "missing-group" | "unknown-option" | "unavailable-option" | "invalid-count";

export interface PosVariantSelectionIssue {
  readonly groupId: string;
  readonly code: PosVariantSelectionIssueCode;
}

export interface PosVariantSelectionResult {
  readonly valid: boolean;
  readonly selections: readonly OrderVariantSelection[];
  readonly issues: readonly PosVariantSelectionIssue[];
}

export function isMenuSellable(menu: MenuItem): boolean {
  return (
    menu.visibility === "visible" &&
    menu.availability.status === "available" &&
    (menu.inventory.mode === "untracked" || menu.inventory.quantity > 0)
  );
}

export function resolvePosVariantSelections(
  menu: MenuItem,
  variantGroups: readonly MenuVariantGroup[],
  selectedOptionIds: Readonly<Record<string, readonly string[]>>,
): PosVariantSelectionResult {
  const groupsById = new Map(variantGroups.map((group) => [group.id, group]));
  const selections: OrderVariantSelection[] = [];
  const issues: PosVariantSelectionIssue[] = [];

  for (const groupId of menu.variantGroupIds) {
    const group = groupsById.get(groupId);
    if (!group) {
      issues.push({ groupId, code: "missing-group" });
      continue;
    }

    const selectedIds = [...new Set(selectedOptionIds[groupId] ?? [])];
    const availableOptions = group.options.filter(
      (option) =>
        option.availability.status === "available" &&
        (option.inventory.mode === "untracked" || option.inventory.quantity > 0),
    );
    const ruleResult = validateVariantSelectionRule(
      group.selection,
      group.options.length,
      availableOptions.length,
    );
    const maximum = group.selection.maxSelections ?? Number.POSITIVE_INFINITY;

    if (
      !ruleResult.valid ||
      selectedIds.length < group.selection.minSelections ||
      selectedIds.length > maximum
    ) {
      issues.push({ groupId, code: "invalid-count" });
    }

    for (const optionId of selectedIds) {
      const option = group.options.find((candidate) => candidate.id === optionId);
      if (!option) {
        issues.push({ groupId, code: "unknown-option" });
        continue;
      }
      if (!availableOptions.some((candidate) => candidate.id === optionId)) {
        issues.push({ groupId, code: "unavailable-option" });
        continue;
      }

      selections.push({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        priceAdjustment: { ...option.priceAdjustment },
      });
    }
  }

  return { valid: issues.length === 0, selections, issues };
}

function configurationKey(item: PosCartItem): string {
  const variants = item.variantSelections
    .map((selection) => `${selection.groupId}:${selection.optionId}`)
    .sort()
    .join("|");
  return `${item.menuItemId}::${variants}::${item.note.trim()}`;
}

export function addPosCartItem(
  items: readonly PosCartItem[],
  incoming: PosCartItem,
): readonly PosCartItem[] {
  const key = configurationKey(incoming);
  const existing = items.find((item) => configurationKey(item) === key);
  if (!existing) return [...items, { ...incoming }];

  return items.map((item) =>
    item.id === existing.id ? { ...item, quantity: item.quantity + incoming.quantity } : item,
  );
}

export function setPosCartItemQuantity(
  items: readonly PosCartItem[],
  itemId: string,
  quantity: number,
): readonly PosCartItem[] {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return items.filter((item) => item.id !== itemId);
  }
  return items.map((item) => (item.id === itemId ? { ...item, quantity } : item));
}

export function removePosCartItem(
  items: readonly PosCartItem[],
  itemId: string,
): readonly PosCartItem[] {
  return items.filter((item) => item.id !== itemId);
}

export function updatePosCartItemConfiguration(
  items: readonly PosCartItem[],
  itemId: string,
  variantSelections: PosCartItem["variantSelections"],
  note: string,
): readonly PosCartItem[] {
  return items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          variantSelections: variantSelections.map((selection) => ({
            ...selection,
            priceAdjustment: { ...selection.priceAdjustment },
          })),
          note,
        }
      : item,
  );
}
