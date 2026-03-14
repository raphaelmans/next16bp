import type { TransactionManager } from "@/shared/kernel/transaction";
import { db } from "./db/drizzle";
import { DrizzleTransactionManager } from "./db/transaction";
import type { DbClient } from "./db/types";
import type { Logger } from "./logger";
import { logger } from "./logger";

/**
 * Composition root for shared infrastructure.
 */
export interface Container {
  logger: Logger;
  db: DbClient;
  transactionManager: TransactionManager;
}

let container: Container | null = null;

export function getContainer(): Container {
  if (!container) {
    container = {
      logger,
      db,
      transactionManager: new DrizzleTransactionManager(db),
    };
  }
  return container;
}
