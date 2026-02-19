ALTER TABLE "place" ADD COLUMN "province_rank" integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_province_rank_non_negative" CHECK ("province_rank" >= 0);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_place_province_rank_per_province_unique" ON "place" ("province", "province_rank") WHERE "province_rank" > 0;
