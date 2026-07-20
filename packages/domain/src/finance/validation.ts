import {
  FINANCE_CATEGORIES,
  type FinanceAttachmentMetadata,
  type FinanceDirection,
  type ManualFinanceTransactionInput,
  type ManualFinanceTransactionType,
} from "./types";

export const MAX_FINANCE_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export interface ManualFinanceTransactionErrors {
  readonly occurredAt?: string;
  readonly type?: string;
  readonly categoryId?: string;
  readonly categoryLabel?: string;
  readonly amount?: string;
  readonly description?: string;
  readonly attachment?: string;
}

const INFLOW_TYPES: readonly ManualFinanceTransactionType[] = [
  "manual-income",
  "cash-in",
  "adjustment",
];
const OUTFLOW_TYPES: readonly ManualFinanceTransactionType[] = [
  "expense",
  "cash-out",
  "adjustment",
];

function isValidIsoDatetime(value: string): boolean {
  return value.trim() !== "" && Number.isFinite(Date.parse(value));
}

function isAcceptedAttachment(attachment: FinanceAttachmentMetadata): boolean {
  return attachment.mimeType.startsWith("image/") || attachment.mimeType === "application/pdf";
}

function isTypeValidForDirection(
  type: ManualFinanceTransactionType,
  direction: FinanceDirection,
): boolean {
  return (direction === "inflow" ? INFLOW_TYPES : OUTFLOW_TYPES).includes(type);
}

export function validateManualFinanceTransaction(
  input: ManualFinanceTransactionInput,
): ManualFinanceTransactionErrors {
  const errors: Record<string, string> = {};
  const category = FINANCE_CATEGORIES.find((candidate) => candidate.id === input.categoryId);

  if (!isValidIsoDatetime(input.occurredAt)) {
    errors.occurredAt = "Transaction date and time must be valid.";
  }
  if (!isTypeValidForDirection(input.type, input.direction)) {
    errors.type = "Transaction type does not match its direction.";
  }
  if (input.categoryId.trim() === "") {
    errors.categoryId = "Transaction category is required.";
  } else if (category && category.direction !== input.direction) {
    errors.categoryId = "Transaction category does not match its direction.";
  }
  if (input.categoryLabel.trim() === "") {
    errors.categoryLabel = "Transaction category label is required.";
  }
  if (
    input.amount.currency !== "IDR" ||
    !Number.isSafeInteger(input.amount.amount) ||
    input.amount.amount < 0
  ) {
    errors.amount = "Amount must be a non-negative whole number in IDR.";
  }
  if (input.description.trim() === "") {
    errors.description = "Transaction description is required.";
  }
  if (input.attachment) {
    if (
      input.attachment.id.trim() === "" ||
      input.attachment.name.trim() === "" ||
      !Number.isSafeInteger(input.attachment.size) ||
      input.attachment.size < 0 ||
      input.attachment.size > MAX_FINANCE_ATTACHMENT_BYTES ||
      !isAcceptedAttachment(input.attachment)
    ) {
      errors.attachment = "Attachment must be an image or PDF no larger than 5 MB.";
    }
  }

  return errors;
}

export function isManualFinanceTransactionValid(input: ManualFinanceTransactionInput): boolean {
  return Object.keys(validateManualFinanceTransaction(input)).length === 0;
}
