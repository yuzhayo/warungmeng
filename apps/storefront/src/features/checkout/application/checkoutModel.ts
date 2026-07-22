export const MAX_CUSTOMER_NAME_LENGTH = 100;
export const MAX_CUSTOMER_NOTE_LENGTH = 500;

export interface StorefrontCheckoutDraft {
  readonly customerName: string;
  readonly customerPhone: string;
  readonly fulfillment: "takeaway";
  readonly paymentMethod: "cash";
  readonly customerNote: string;
}

export type StorefrontCheckoutField = "customerName" | "customerPhone" | "customerNote";

export type StorefrontCheckoutErrors = Partial<Record<StorefrontCheckoutField, string>>;

export function createDefaultCheckoutDraft(): StorefrontCheckoutDraft {
  return {
    customerName: "",
    customerPhone: "",
    fulfillment: "takeaway",
    paymentMethod: "cash",
    customerNote: "",
  };
}

export function normalizeCustomerName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeCustomerPhone(value: string): string | null {
  const trimmed = value.trim();
  if (!/^[+]?[(\d][\d\s().-]*$/.test(trimmed)) return null;

  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  return `${hasLeadingPlus ? "+" : ""}${digits}`;
}

export function normalizeCheckoutDraft(draft: StorefrontCheckoutDraft): StorefrontCheckoutDraft {
  return {
    ...draft,
    customerName: normalizeCustomerName(draft.customerName),
    customerPhone: normalizeCustomerPhone(draft.customerPhone) ?? draft.customerPhone.trim(),
    customerNote: draft.customerNote.trim(),
  };
}

export function validateCheckoutDraft(draft: StorefrontCheckoutDraft): StorefrontCheckoutErrors {
  const errors: StorefrontCheckoutErrors = {};
  const name = normalizeCustomerName(draft.customerName);
  const note = draft.customerNote.trim();

  if (!name || name.length > MAX_CUSTOMER_NAME_LENGTH) {
    errors.customerName = !name ? "required" : "too-long";
  }
  if (!normalizeCustomerPhone(draft.customerPhone)) {
    errors.customerPhone = "invalid";
  }
  if (note.length > MAX_CUSTOMER_NOTE_LENGTH) {
    errors.customerNote = "too-long";
  }

  return errors;
}

export function isCheckoutDraftValid(draft: StorefrontCheckoutDraft): boolean {
  return Object.keys(validateCheckoutDraft(draft)).length === 0;
}
