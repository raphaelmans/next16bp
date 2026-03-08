CREATE TABLE IF NOT EXISTS "external_open_play_court" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "external_open_play_id" uuid NOT NULL,
  "label" varchar(120) NOT NULL,
  "sort_order" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "external_open_play_court"
  ADD CONSTRAINT "external_open_play_court_open_play_id_fk"
  FOREIGN KEY ("external_open_play_id")
  REFERENCES "public"."external_open_play"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_external_open_play_court_open_play"
  ON "external_open_play_court" ("external_open_play_id");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "uq_external_open_play_court_sort_order"
  ON "external_open_play_court" ("external_open_play_id", "sort_order");
