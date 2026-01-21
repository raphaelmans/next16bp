ALTER TABLE "court" DROP CONSTRAINT IF EXISTS "court_place_id_place_id_fk";--> statement-breakpoint
ALTER TABLE "court" ALTER COLUMN "place_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "court" ADD CONSTRAINT "court_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
