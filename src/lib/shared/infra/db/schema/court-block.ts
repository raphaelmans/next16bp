import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { court } from "./court";
import { courtBlockTypeEnum } from "./enums";

/**
 * Court Block table
 * One-off blocks that make a court unavailable for a time range.
 */
export const courtBlock = pgTable(
  "court_block",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courtId: uuid("court_id")
      .notNull()
      .references(() => court.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    type: courtBlockTypeEnum("type").notNull().default("MAINTENANCE"),
    totalPriceCents: integer("total_price_cents").notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull().default("PHP"),
    reason: text("reason"),
    isActive: boolean("is_active").notNull().default(true),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_court_block_court_start").on(table.courtId, table.startTime),
    check(
      "court_block_end_after_start",
      sql`${table.endTime} > ${table.startTime}`,
    ),
    check(
      "court_block_duration_multiple_of_60",
      sql`mod(extract(epoch from (${table.endTime} - ${table.startTime}))::int, 3600) = 0`,
    ),
  ],
);

export const CourtBlockSchema = createSelectSchema(courtBlock);
export const InsertCourtBlockSchema = createInsertSchema(courtBlock);

export type CourtBlockRecord = z.infer<typeof CourtBlockSchema>;
export type InsertCourtBlock = z.infer<typeof InsertCourtBlockSchema>;
