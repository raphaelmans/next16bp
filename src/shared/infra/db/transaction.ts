import type {
  TransactionManager,
  TransactionContext,
} from "@/shared/kernel/transaction";
import type { DbClient, DrizzleTransaction } from "./types";

/**
 * Drizzle-specific implementation of TransactionManager.
 */
export class DrizzleTransactionManager implements TransactionManager {
  constructor(private db: DbClient) {}

  async run<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx: DrizzleTransaction) => {
      return fn(tx as TransactionContext);
    });
  }
}
