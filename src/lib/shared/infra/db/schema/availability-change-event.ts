import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { court } from "./court";
import { place } from "./place";
import { sport } from "./sport";

export const availabilityChangeEvent = pgTable(
  "availability_change_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceKind: varchar("source_kind", { length: 32 }).notNull(),
    sourceEvent: varchar("source_event", { length: 64 }).notNull(),
    sourceId: uuid("source_id").notNull(),
    courtId: uuid("court_id")
      .notNull()
      .references(() => court.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    sportId: uuid("sport_id")
      .notNull()
      .references(() => sport.id, { onDelete: "restrict" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    slotStatus: varchar("slot_status", { length: 16 }).notNull(),
    unavailableReason: varchar("unavailable_reason", { length: 32 }),
    totalPriceCents: integer("total_price_cents"),
    currency: varchar("currency", { length: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_availability_change_event_court_created").on(
      table.courtId,
      table.createdAt,
    ),
    index("idx_availability_change_event_place_sport_created").on(
      table.placeId,
      table.sportId,
      table.createdAt,
    ),
    index("idx_availability_change_event_source").on(
      table.sourceKind,
      table.sourceId,
      table.createdAt,
    ),
  ],
);

export const AvailabilityChangeEventSchema = createSelectSchema(
  availabilityChangeEvent,
);
export const InsertAvailabilityChangeEventSchema = createInsertSchema(
  availabilityChangeEvent,
);

export type AvailabilityChangeEventRecord = z.infer<
  typeof AvailabilityChangeEventSchema
>;
export type InsertAvailabilityChangeEvent = z.infer<
  typeof InsertAvailabilityChangeEventSchema
>;
