import type {
  FinanceTransaction,
  FinanceTransactionQuery,
  ManualFinanceTransactionInput,
} from "@warungmeng/domain";

export type CreateManualFinanceTransactionInput = ManualFinanceTransactionInput;
export type UpdateManualFinanceTransactionInput = ManualFinanceTransactionInput;

export interface FinanceRepository {
  listManualTransactions(query?: FinanceTransactionQuery): Promise<readonly FinanceTransaction[]>;
  getManualTransactionById(id: string): Promise<FinanceTransaction | null>;
  createManualTransaction(input: CreateManualFinanceTransactionInput): Promise<FinanceTransaction>;
  updateManualTransaction(
    id: string,
    input: UpdateManualFinanceTransactionInput,
  ): Promise<FinanceTransaction | null>;
  voidManualTransaction(id: string, occurredAt: string): Promise<FinanceTransaction | null>;
}
