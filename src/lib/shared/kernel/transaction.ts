/**
 * TransactionContext represents an active database transaction.
 * This is a type alias that will be narrowed by the infrastructure layer.
 */
export type TransactionContext = unknown;

/**
 * TransactionManager provides a framework-agnostic interface for
 * running code within a database transaction.
 */
export interface TransactionManager {
  /**
   * Executes the given function within a transaction.
   *
   * - If the function completes successfully, the transaction is committed
   * - If the function throws, the transaction is rolled back
   * - The transaction context (tx) should be passed to repositories via RequestContext
   */
  run<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
