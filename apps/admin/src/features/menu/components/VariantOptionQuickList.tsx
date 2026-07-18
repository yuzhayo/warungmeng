import type { MenuVariantGroup } from "@warungmeng/domain";
import { useState } from "react";
import type { VariantOptionQuickEdit } from "../application/variantOptionCommands";
import { VariantOptionQuickRow } from "./VariantOptionQuickRow";

export interface VariantOptionQuickListProps {
  readonly group: MenuVariantGroup;
  readonly pendingOptionIds: ReadonlySet<string>;
  readonly onAvailabilityChange: (
    groupId: string,
    optionId: string,
    available: boolean,
  ) => Promise<boolean>;
  readonly onDelete: (groupId: string, optionId: string) => Promise<boolean>;
  readonly onSave: (
    groupId: string,
    optionId: string,
    input: VariantOptionQuickEdit,
  ) => Promise<boolean>;
}

export function VariantOptionQuickList({
  group,
  pendingOptionIds,
  onAvailabilityChange,
  onDelete,
  onSave,
}: VariantOptionQuickListProps) {
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);

  return (
    <div className="variant-option-quick-list">
      {group.options.map((option) => (
        <VariantOptionQuickRow
          editing={editingOptionId === option.id}
          groupId={group.id}
          key={option.id}
          onAvailabilityChange={onAvailabilityChange}
          onCancelEdit={() => setEditingOptionId(null)}
          onDelete={onDelete}
          onSave={onSave}
          onStartEdit={setEditingOptionId}
          option={option}
          pending={pendingOptionIds.has(option.id)}
        />
      ))}
    </div>
  );
}
