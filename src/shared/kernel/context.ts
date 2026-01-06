import type { TransactionContext } from "./transaction";

/**
 * RequestContext is passed through layers to provide:
 * - Transaction context for database operations
 * - Request ID for correlation in logs and error responses
 * - Future: tracing context, user context, etc.
 */
export interface RequestContext {
  /**
   * Active transaction context, if within a transaction.
   * Repositories use this to participate in the transaction.
   */
  tx?: TransactionContext;

  /**
   * Request ID for correlation in logs and error responses.
   */
  requestId?: string;

  // Future extensions:
  // traceId?: string;
  // spanId?: string;
}
