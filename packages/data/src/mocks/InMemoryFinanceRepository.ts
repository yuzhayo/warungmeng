import {
  filterFinanceTransactions,
  isManualFinanceTransactionValid,
  type FinanceTransaction,
  type FinanceTransactionQuery,
  type ManualFinanceTransactionInput,
} from "@warungmeng/domain";
import type {
  CreateManualFinanceTransactionInput,
  FinanceRepository,
  UpdateManualFinanceTransactionInput,
} from "../repositories/FinanceRepository";

export type FinanceIdFactory = () => string;
export type FinanceClock = () => string;

function clone<TEntity>(value: TEntity): TEntity {
  return structuredClone(value);
}

function defaultIdFactory(): string {
  return `finance-manual-${crypto.randomUUID()}`;
}

function defaultClock(): string {
  return new Date().toISOString();
}

function assertValidManualInput(input: ManualFinanceTransactionInput): void {
  if (!isManualFinanceTransactionValid(input)) {
    throw new RangeError("Manual finance transaction input is invalid");
  }
}

export class InMemoryFinanceRepository implements FinanceRepository {
  readonly #clock: FinanceClock;
  readonly #idFactory: FinanceIdFactory;
  #transactions: FinanceTransaction[];

  constructor(
    seed: readonly FinanceTransaction[] = [],
    clock: FinanceClock = defaultClock,
    idFactory: FinanceIdFactory = defaultIdFactory,
  ) {
    this.#transactions = seed.map((transaction) => clone(transaction));
    this.#clock = clock;
    this.#idFactory = idFactory;
  }

  async listManualTransactions(
    query: FinanceTransactionQuery = {},
  ): Promise<readonly FinanceTransaction[]> {
    return clone(
      filterFinanceTransactions(
        this.#transactions.filter((transaction) => transaction.source === "manual"),
        query,
      ),
    );
  }

  async getManualTransactionById(id: string): Promise<FinanceTransaction | null> {
    const transaction = this.#transactions.find(
      (candidate) => candidate.id === id && candidate.source === "manual",
    );
    return transaction ? clone(transaction) : null;
  }

  async createManualTransaction(
    input: CreateManualFinanceTransactionInput,
  ): Promise<FinanceTransaction> {
    assertValidManualInput(input);
    const timestamp = this.#clock();
    const transaction: FinanceTransaction = {
      ...clone(input),
      id: this.#idFactory(),
      source: "manual",
      sourceReference: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.#transactions.push(transaction);
    return clone(transaction);
  }

  async updateManualTransaction(
    id: string,
    input: UpdateManualFinanceTransactionInput,
  ): Promise<FinanceTransaction | null> {
    const index = this.#transactions.findIndex((transaction) => transaction.id === id);
    const current = this.#transactions[index];
    if (!current || current.source !== "manual" || current.status === "voided") return null;

    assertValidManualInput(input);
    const updated: FinanceTransaction = {
      ...clone(input),
      id,
      source: "manual",
      sourceReference: null,
      createdAt: current.createdAt,
      updatedAt: this.#clock(),
    };
    this.#transactions[index] = updated;
    return clone(updated);
  }

  async voidManualTransaction(id: string, occurredAt: string): Promise<FinanceTransaction | null> {
    const index = this.#transactions.findIndex((transaction) => transaction.id === id);
    const current = this.#transactions[index];
    if (!current || current.source !== "manual") return null;
    if (current.status === "voided") return clone(current);
    if (!Number.isFinite(Date.parse(occurredAt))) {
      throw new RangeError("Finance void timestamp must be valid");
    }

    const updated: FinanceTransaction = {
      ...current,
      status: "voided",
      updatedAt: occurredAt,
    };
    this.#transactions[index] = updated;
    return clone(updated);
  }
}
