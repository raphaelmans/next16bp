/**
 * Request context for extensibility.
 * Currently holds request ID, can be extended for transactions, tracing, etc.
 */
export interface RequestContext {
  requestId: string;
  // Future extensions:
  // tx?: TransactionContext;
  // traceId?: string;
  // spanId?: string;
  // userId?: string;
}
