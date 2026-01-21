ALTER TABLE "place" ADD COLUMN "slug" varchar(200);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_place_slug" ON "place" ("slug") WHERE "slug" IS NOT NULL;
