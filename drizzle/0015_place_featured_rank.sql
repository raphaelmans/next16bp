ALTER TABLE "place" ADD COLUMN "featured_rank" integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_featured_rank_non_negative" CHECK ("featured_rank" >= 0);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_place_featured_rank_unique" ON "place" ("featured_rank") WHERE "featured_rank" > 0;--> statement-breakpoint
