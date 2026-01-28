CREATE TABLE "bookings_import_source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"source_type" "bookings_import_source_type" NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"file_path" text NOT NULL,
	"sort_order" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings_import_source" ADD CONSTRAINT "bookings_import_source_job_id_bookings_import_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."bookings_import_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bookings_import_source_job" ON "bookings_import_source" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bookings_import_source_job_sort" ON "bookings_import_source" USING btree ("job_id","sort_order");--> statement-breakpoint

ALTER TABLE "bookings_import_row" ADD COLUMN IF NOT EXISTS "source_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings_import_row" ADD COLUMN IF NOT EXISTS "source_line_number" integer;--> statement-breakpoint
ALTER TABLE "bookings_import_row" ADD CONSTRAINT "bookings_import_row_source_id_bookings_import_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."bookings_import_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bookings_import_row_source" ON "bookings_import_row" USING btree ("source_id");--> statement-breakpoint

INSERT INTO "bookings_import_source" ("job_id", "source_type", "file_name", "file_size", "file_path", "sort_order", "created_at", "updated_at")
SELECT "id", "source_type", "file_name", "file_size", "file_path", 1, "created_at", "updated_at"
FROM "bookings_import_job";--> statement-breakpoint

UPDATE "bookings_import_row" AS bir
SET "source_id" = source."id",
	"source_line_number" = bir."line_number"
FROM "bookings_import_source" AS source
WHERE source."job_id" = bir."job_id" AND source."sort_order" = 1;--> statement-breakpoint

ALTER TABLE "bookings_import_row" ALTER COLUMN "source_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings_import_row" ALTER COLUMN "source_line_number" SET NOT NULL;--> statement-breakpoint
