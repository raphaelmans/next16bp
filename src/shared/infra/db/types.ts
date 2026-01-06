import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type AppSchema = typeof schema;

/**
 * The main Drizzle database client type.
 * Import AppDatabase from drizzle.ts for the actual type.
 */
export type { AppDatabase as DbClient } from "./drizzle";

/**
 * Drizzle transaction type for postgres.js driver.
 * Used when passing transaction context to repositories.
 */
export type DrizzleTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  AppSchema,
  ExtractTablesWithRelations<AppSchema>
>;
