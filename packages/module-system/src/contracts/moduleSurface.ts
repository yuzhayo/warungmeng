export const MODULE_SURFACES = ["admin", "storefront"] as const;

export type WarungMengSurface = (typeof MODULE_SURFACES)[number];
