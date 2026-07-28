/**
 * Boundary for multi-repository mutations that must apply completely or not at
 * all. `run` resolves with the callback result when every targeted mutation
 * committed, and rethrows the callback failure after the owning adapter rolled
 * every targeted resource back to its pre-transaction state.
 */
export interface AtomicDataTransaction {
  run<TResult>(operation: () => Promise<TResult>): Promise<TResult>;
}
