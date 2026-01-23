CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "time_slot"
ADD CONSTRAINT "time_slot_no_overlap"
EXCLUDE USING gist (
  "court_id" WITH =,
  tstzrange("start_time", "end_time", '[)') WITH &&
);--> statement-breakpoint
