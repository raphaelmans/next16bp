CREATE TABLE IF NOT EXISTS "place_review" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "place_id" uuid NOT NULL,
  "author_user_id" uuid NOT NULL,
  "rating" integer NOT NULL,
  "body" text,
  "removed_at" timestamp with time zone,
  "removed_by_user_id" uuid,
  "removal_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "place_review_rating_range" CHECK ("place_review"."rating" BETWEEN 1 AND 5)
);

ALTER TABLE "place_review"
  ADD CONSTRAINT "place_review_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "place_review"
  ADD CONSTRAINT "place_review_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "place_review"
  ADD CONSTRAINT "place_review_removed_by_user_id_users_id_fk" FOREIGN KEY ("removed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_place_review_active_per_user"
  ON "place_review" ("place_id", "author_user_id")
  WHERE "place_review"."removed_at" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_place_review_place"
  ON "place_review" ("place_id");

CREATE INDEX IF NOT EXISTS "idx_place_review_author"
  ON "place_review" ("author_user_id");

CREATE INDEX IF NOT EXISTS "idx_place_review_active"
  ON "place_review" ("place_id", "created_at")
  WHERE "place_review"."removed_at" IS NULL;
