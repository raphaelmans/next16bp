import { logger } from "./logger";
import type { Logger } from "./logger";

/**
 * Composition root for shared infrastructure.
 * Database and transaction manager will be added when needed.
 */
export interface Container {
  logger: Logger;
  // Future extensions:
  // db: typeof db;
  // transactionManager: TransactionManager;
}

let container: Container | null = null;

export function getContainer(): Container {
  if (!container) {
    container = {
      logger,
    };
  }
  return container;
}
