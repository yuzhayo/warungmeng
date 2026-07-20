import type { Money } from "../catalog/types";

export const FINANCE_DIRECTIONS = ["inflow", "outflow"] as const;
export type FinanceDirection = (typeof FINANCE_DIRECTIONS)[number];

export const FINANCE_TRANSACTION_TYPES = [
  "sale",
  "manual-income",
  "expense",
  "refund",
  "cash-in",
  "cash-out",
  "adjustment",
] as const;
export type FinanceTransactionType = (typeof FINANCE_TRANSACTION_TYPES)[number];

export const FINANCE_SOURCES = ["automatic", "manual"] as const;
export type FinanceSource = (typeof FINANCE_SOURCES)[number];

export const FINANCE_STATUSES = ["pending", "posted", "voided"] as const;
export type FinanceStatus = (typeof FINANCE_STATUSES)[number];
export type ManualFinanceStatus = Exclude<FinanceStatus, "voided">;

export const FINANCE_PAYMENT_METHODS = ["cash", "qris", "card", "bank-transfer", "other"] as const;
export type FinancePaymentMethod = (typeof FINANCE_PAYMENT_METHODS)[number];

export interface FinanceCategory {
  readonly id: string;
  readonly label: string;
  readonly direction: FinanceDirection;
}

export const FINANCE_CATEGORIES: readonly FinanceCategory[] = [
  { id: "sales", label: "Penjualan", direction: "inflow" },
  { id: "other-income", label: "Pemasukan Lain", direction: "inflow" },
  { id: "capital-deposit", label: "Setoran Modal", direction: "inflow" },
  { id: "inflow-adjustment", label: "Penyesuaian Masuk", direction: "inflow" },
  { id: "ingredients", label: "Bahan Baku", direction: "outflow" },
  { id: "packaging", label: "Kemasan", direction: "outflow" },
  { id: "utilities", label: "Listrik dan Utilitas", direction: "outflow" },
  { id: "transportation", label: "Transportasi", direction: "outflow" },
  { id: "salary", label: "Gaji", direction: "outflow" },
  { id: "maintenance", label: "Perawatan", direction: "outflow" },
  { id: "refund", label: "Refund", direction: "outflow" },
  { id: "other-expense", label: "Pengeluaran Lain", direction: "outflow" },
  { id: "outflow-adjustment", label: "Penyesuaian Keluar", direction: "outflow" },
] as const;

export interface FinanceAttachmentMetadata {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly size: number;
}

export interface FinanceTransaction {
  readonly id: string;
  readonly occurredAt: string;
  readonly direction: FinanceDirection;
  readonly type: FinanceTransactionType;
  readonly source: FinanceSource;
  readonly status: FinanceStatus;
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly amount: Money;
  readonly paymentMethod: FinancePaymentMethod;
  readonly description: string;
  readonly referenceNumber: string;
  readonly sourceReference: string | null;
  readonly attachment: FinanceAttachmentMetadata | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ManualFinanceTransactionType = Exclude<FinanceTransactionType, "sale" | "refund">;

export interface ManualFinanceTransactionInput {
  readonly occurredAt: string;
  readonly direction: FinanceDirection;
  readonly type: ManualFinanceTransactionType;
  readonly status: ManualFinanceStatus;
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly amount: Money;
  readonly paymentMethod: FinancePaymentMethod;
  readonly description: string;
  readonly referenceNumber: string;
  readonly attachment: FinanceAttachmentMetadata | null;
}

export interface FinanceTransactionQuery {
  readonly search?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly direction?: FinanceDirection;
  readonly type?: FinanceTransactionType;
  readonly categoryId?: string;
  readonly paymentMethod?: FinancePaymentMethod;
  readonly source?: FinanceSource;
  readonly status?: FinanceStatus;
}

export interface FinanceSummary {
  readonly totalInflow: Money;
  readonly totalOutflow: Money;
  readonly netCashflow: Money;
  readonly cashBalance: Money;
  readonly postedCount: number;
  readonly pendingCount: number;
  readonly voidedCount: number;
}

export interface FinancePaymentMethodSummary {
  readonly paymentMethod: FinancePaymentMethod;
  readonly totalInflow: Money;
  readonly totalOutflow: Money;
  readonly netCashflow: Money;
  readonly transactionCount: number;
}

export interface FinanceCategorySummary {
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly total: Money;
  readonly transactionCount: number;
}

export function getFinanceCategories(direction: FinanceDirection): readonly FinanceCategory[] {
  return FINANCE_CATEGORIES.filter((category) => category.direction === direction);
}
