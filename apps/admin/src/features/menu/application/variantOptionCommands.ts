import type { MenuVariantGroup, MenuVariantOption } from "@warungmeng/domain";

export interface VariantOptionQuickEdit {
  readonly name: string;
  readonly priceAmount: number;
}

export function updateVariantOption(
  group: MenuVariantGroup,
  optionId: string,
  patch: Partial<MenuVariantOption>,
): readonly MenuVariantOption[] {
  return group.options.map((option) => (option.id === optionId ? { ...option, ...patch } : option));
}

export function removeVariantOption(
  group: MenuVariantGroup,
  optionId: string,
): readonly MenuVariantOption[] {
  return group.options.filter((option) => option.id !== optionId);
}

export function validateVariantOptionQuickEdit(input: VariantOptionQuickEdit): boolean {
  return (
    input.name.trim().length > 0 && Number.isInteger(input.priceAmount) && input.priceAmount >= 0
  );
}
