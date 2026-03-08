import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { place } from "./place";

export const placeEmbedding = pgTable(
  "place_embedding",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    purpose: varchar("purpose", { length: 50 }).notNull(),
    model: varchar("model", { length: 100 }).notNull(),
    dimensions: integer("dimensions").notNull(),
    canonicalText: text("canonical_text").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_place_embedding_place_purpose_model").on(
      table.placeId,
      table.purpose,
      table.model,
    ),
    index("idx_place_embedding_purpose_model").on(table.purpose, table.model),
    index("idx_place_embedding_vector").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const PlaceEmbeddingSchema = createSelectSchema(placeEmbedding);
export const InsertPlaceEmbeddingSchema = createInsertSchema(placeEmbedding);

export type PlaceEmbeddingRecord = z.infer<typeof PlaceEmbeddingSchema>;
export type InsertPlaceEmbedding = z.infer<typeof InsertPlaceEmbeddingSchema>;
