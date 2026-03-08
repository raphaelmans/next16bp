CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "place_embedding" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "place_id" uuid NOT NULL,
  "purpose" varchar(50) NOT NULL,
  "model" varchar(100) NOT NULL,
  "dimensions" integer NOT NULL,
  "canonical_text" text NOT NULL,
  "embedding" vector(1536) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "place_embedding"
  ADD CONSTRAINT "place_embedding_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_place_embedding_place_purpose_model"
  ON "place_embedding" ("place_id", "purpose", "model");

CREATE INDEX IF NOT EXISTS "idx_place_embedding_purpose_model"
  ON "place_embedding" ("purpose", "model");

CREATE INDEX IF NOT EXISTS "idx_place_embedding_vector"
  ON "place_embedding" USING hnsw ("embedding" vector_cosine_ops);
