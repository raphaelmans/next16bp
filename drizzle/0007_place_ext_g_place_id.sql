ALTER TABLE "place" ADD COLUMN "ext_g_place_id" varchar(128);--> statement-breakpoint
CREATE INDEX "idx_place_ext_g_place_id" ON "place" ("ext_g_place_id");--> statement-breakpoint
