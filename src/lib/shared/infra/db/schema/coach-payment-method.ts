import { sql } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coach } from "./coach";
import { paymentMethodProviderEnum, paymentMethodTypeEnum } from "./enums";

/**
 * Coach Payment Method table
 * Stores coach payment accounts for P2P payments.
 */
export const coachPaymentMethod = pgTable(
  "coach_payment_method",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    type: paymentMethodTypeEnum("type").notNull(),
    provider: paymentMethodProviderEnum("provider").notNull(),
    accountName: varchar("account_name", { length: 150 }).notNull(),
    accountNumber: varchar("account_number", { length: 50 }).notNull(),
    instructions: text("instructions"),
    isActive: boolean("is_active").notNull().default(true),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_coach_payment_method_unique").on(
      table.coachId,
      table.provider,
      table.accountNumber,
    ),
    uniqueIndex("idx_coach_payment_method_default")
      .on(table.coachId)
      .where(sql`${table.isDefault} = true`),
  ],
);

export const CoachPaymentMethodSchema = createSelectSchema(coachPaymentMethod);
export const InsertCoachPaymentMethodSchema =
  createInsertSchema(coachPaymentMethod);

export type CoachPaymentMethodRecord = z.infer<typeof CoachPaymentMethodSchema>;
export type InsertCoachPaymentMethod = z.infer<
  typeof InsertCoachPaymentMethodSchema
>;
