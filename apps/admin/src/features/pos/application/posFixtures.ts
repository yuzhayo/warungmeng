import type { PosOutlet } from "@warungmeng/domain";

// Admin is currently pinned to a single outlet. Keep the list shape so a
// future multi-outlet rollout only has to add entries here.
export const POS_OUTLETS: readonly PosOutlet[] = [{ id: "wm-1", name: "WARUNG MENG" }];
